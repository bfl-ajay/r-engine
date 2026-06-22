/**
 * Query Builder Service
 * Provides SQL query construction and validation
 */

import {
  AdvancedQueryBuilder,
  FilterDefinition,
  JoinDefinition,
  AggregationDefinition,
  SortDefinitionEx,
} from '@reporting-engine/shared';
import { ApiError } from '../middlewares/errorHandler';

/**
 * Query Builder
 * Constructs SQL queries from builder objects
 */
export class QueryBuilder {
  /**
   * Build SQL query from builder object (PostgreSQL flavor)
   */
  static buildPostgresQuery(builder: AdvancedQueryBuilder): { sql: string; params: any[] } {
    const params: any[] = [];
    let sql = 'SELECT ';

    // SELECT clause
    sql += builder.select.length > 0 ? builder.select.join(', ') : '*';
    sql += ' FROM ' + builder.from;
    let paramIndex = 1;

    // JOIN clauses
    if (builder.joins && builder.joins.length > 0) {
      for (const join of builder.joins) {
        sql += ` ${join.type} JOIN ${join.rightTable} ON ${join.condition}`;
      }
    }

    // WHERE clause
    if (builder.where && builder.where.length > 0) {
      sql += ' WHERE ';
      const whereClauses: string[] = [];

      for (const filter of builder.where) {
        const clause = this.buildFilterClause(filter, params, paramIndex);
        whereClauses.push(clause);
        paramIndex = params.length + 1;
      }

      sql += whereClauses.join(
        builder.where.length > 1 && builder.where[0].logic ? ` ${builder.where[0].logic} ` : ' AND '
      );
    }

    // GROUP BY clause
    if (builder.groupBy && builder.groupBy.length > 0) {
      sql += ' GROUP BY ' + builder.groupBy.join(', ');
    }

    // HAVING clause
    if (builder.having && builder.having.length > 0) {
      sql += ' HAVING ';
      const havingClauses: string[] = [];

      for (const filter of builder.having) {
        const clause = this.buildFilterClause(filter, params, paramIndex);
        havingClauses.push(clause);
        paramIndex = params.length + 1;
      }

      sql += havingClauses.join(
        builder.having.length > 1 && builder.having[0].logic
          ? ` ${builder.having[0].logic} `
          : ' AND '
      );
    }

    // ORDER BY clause
    if (builder.orderBy && builder.orderBy.length > 0) {
      sql += ' ORDER BY ' + builder.orderBy.map((s) => `${s.field} ${s.direction}`).join(', ');
    }

    // LIMIT clause
    if (builder.limit) {
      sql += ` LIMIT ${builder.limit}`;
    }

    // OFFSET clause
    if (builder.offset) {
      sql += ` OFFSET ${builder.offset}`;
    }

    sql += ';';

    return { sql, params };
  }

  /**
   * Build SQL query (MySQL flavor)
   */
  static buildMySqlQuery(builder: AdvancedQueryBuilder): { sql: string; params: any[] } {
    // MySQL syntax is very similar to PostgreSQL for basic queries
    return this.buildPostgresQuery(builder);
  }

  /**
   * Build MongoDB aggregation pipeline
   */
  static buildMongoQuery(builder: AdvancedQueryBuilder): { pipeline: any[] } {
    const pipeline: any[] = [];

    // Match stage (WHERE clause)
    if (builder.where && builder.where.length > 0) {
      const matchObj: any = {};
      for (const filter of builder.where) {
        Object.assign(matchObj, this.buildMongoFilter(filter));
      }
      pipeline.push({ $match: matchObj });
    }

    // Group stage (GROUP BY + aggregations)
    if (builder.groupBy || (builder.where && builder.where.length > 0)) {
      const groupObj: any = {
        _id: builder.groupBy ? `$${builder.groupBy[0]}` : null,
      };

      // Add aggregations
      if (builder.select) {
        for (const field of builder.select) {
          if (field !== '_id') {
            groupObj[field] = { $first: `$${field}` };
          }
        }
      }

      pipeline.push({ $group: groupObj });
    }

    // Sort stage (ORDER BY)
    if (builder.orderBy && builder.orderBy.length > 0) {
      const sortObj: any = {};
      for (const sort of builder.orderBy) {
        sortObj[sort.field] = sort.direction === 'ASC' ? 1 : -1;
      }
      pipeline.push({ $sort: sortObj });
    }

    // Skip and limit
    if (builder.offset) {
      pipeline.push({ $skip: builder.offset });
    }

    if (builder.limit) {
      pipeline.push({ $limit: builder.limit });
    }

    // Project stage (SELECT)
    if (builder.select && builder.select.length > 0 && builder.select[0] !== '*') {
      const projectObj: any = { _id: 1 };
      for (const field of builder.select) {
        projectObj[field] = 1;
      }
      pipeline.push({ $project: projectObj });
    }

    return { pipeline };
  }

  /**
   * Build a simple SELECT query
   */
  static buildSimpleSelect(
    table: string,
    columns?: string[],
    filters?: FilterDefinition[],
    limit?: number
  ): { sql: string; params: any[] } {
    const params: any[] = [];
    let sql = `SELECT ${columns && columns.length > 0 ? columns.join(', ') : '*'} FROM ${table}`;

    if (filters && filters.length > 0) {
      sql += ' WHERE ';
      const whereClauses: string[] = [];

      for (const filter of filters) {
        const clause = this.buildFilterClause(filter, params, params.length + 1);
        whereClauses.push(clause);
      }

      sql += whereClauses.join(' AND ');
    }

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    sql += ';';

    return { sql, params };
  }

  /**
   * Build INSERT query
   */
  static buildInsert(
    table: string,
    data: Record<string, any>
  ): { sql: string; params: any[] } {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders});`;

    return { sql, params: values };
  }

  /**
   * Build UPDATE query
   */
  static buildUpdate(
    table: string,
    data: Record<string, any>,
    filters: FilterDefinition[]
  ): { sql: string; params: any[] } {
    const params = Object.values(data);
    const setClause = Object.keys(data)
      .map((col, i) => `${col} = $${i + 1}`)
      .join(', ');

    let sql = `UPDATE ${table} SET ${setClause}`;
    let paramIndex = params.length + 1;

    if (filters && filters.length > 0) {
      sql += ' WHERE ';
      const whereClauses: string[] = [];

      for (const filter of filters) {
        const clause = this.buildFilterClause(filter, params, paramIndex);
        whereClauses.push(clause);
        paramIndex = params.length + 1;
      }

      sql += whereClauses.join(' AND ');
    }

    sql += ';';

    return { sql, params };
  }

  /**
   * Build DELETE query
   */
  static buildDelete(
    table: string,
    filters: FilterDefinition[]
  ): { sql: string; params: any[] } {
    const params: any[] = [];
    let sql = `DELETE FROM ${table}`;

    if (filters && filters.length > 0) {
      sql += ' WHERE ';
      const whereClauses: string[] = [];

      for (const filter of filters) {
        const clause = this.buildFilterClause(filter, params, params.length + 1);
        whereClauses.push(clause);
      }

      sql += whereClauses.join(' AND ');
    }

    sql += ';';

    return { sql, params };
  }

  /**
   * Build COUNT query
   */
  static buildCount(table: string, filters?: FilterDefinition[]): { sql: string; params: any[] } {
    const params: any[] = [];
    let sql = `SELECT COUNT(*) as count FROM ${table}`;

    if (filters && filters.length > 0) {
      sql += ' WHERE ';
      const whereClauses: string[] = [];

      for (const filter of filters) {
        const clause = this.buildFilterClause(filter, params, params.length + 1);
        whereClauses.push(clause);
      }

      sql += whereClauses.join(' AND ');
    }

    sql += ';';

    return { sql, params };
  }

  /**
   * Validate query builder object
   */
  static validate(builder: AdvancedQueryBuilder): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!builder.from) {
      errors.push('FROM table is required');
    }

    if (!builder.select || builder.select.length === 0) {
      errors.push('SELECT columns are required');
    }

    // Validate filters
    if (builder.where) {
      for (const filter of builder.where) {
        if (!filter.field || !filter.operator) {
          errors.push('Filter must have field and operator');
        }
      }
    }

    // Validate joins
    if (builder.joins) {
      for (const join of builder.joins) {
        if (!join.leftTable || !join.rightTable || !join.condition) {
          errors.push('Join must have leftTable, rightTable, and condition');
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build WHERE filter clause
   */
  private static buildFilterClause(
    filter: FilterDefinition,
    params: any[],
    paramIndex: number
  ): string {
    const paramPlaceholder = `$${paramIndex}`;

    switch (filter.operator) {
      case '=':
        params.push(filter.value);
        return `${filter.field} = ${paramPlaceholder}`;
      case '!=':
        params.push(filter.value);
        return `${filter.field} != ${paramPlaceholder}`;
      case '>':
        params.push(filter.value);
        return `${filter.field} > ${paramPlaceholder}`;
      case '>=':
        params.push(filter.value);
        return `${filter.field} >= ${paramPlaceholder}`;
      case '<':
        params.push(filter.value);
        return `${filter.field} < ${paramPlaceholder}`;
      case '<=':
        params.push(filter.value);
        return `${filter.field} <= ${paramPlaceholder}`;
      case 'IN':
        if (filter.values && filter.values.length > 0) {
          const placeholders = filter.values
            .map((_, i) => `$${paramIndex + i}`)
            .join(', ');
          params.push(...filter.values);
          return `${filter.field} IN (${placeholders})`;
        }
        return 'TRUE'; // No values, return true
      case 'LIKE':
        params.push(`%${filter.value}%`);
        return `${filter.field} LIKE ${paramPlaceholder}`;
      case 'BETWEEN':
        if (filter.values && filter.values.length === 2) {
          params.push(filter.values[0], filter.values[1]);
          return `${filter.field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        }
        return 'TRUE';
      case 'IS_NULL':
        return `${filter.field} IS NULL`;
      default:
        return 'TRUE';
    }
  }

  /**
   * Build MongoDB filter object
   */
  private static buildMongoFilter(filter: FilterDefinition): Record<string, any> {
    const filterObj: Record<string, any> = {};

    switch (filter.operator) {
      case '=':
        filterObj[filter.field] = filter.value;
        break;
      case '!=':
        filterObj[filter.field] = { $ne: filter.value };
        break;
      case '>':
        filterObj[filter.field] = { $gt: filter.value };
        break;
      case '>=':
        filterObj[filter.field] = { $gte: filter.value };
        break;
      case '<':
        filterObj[filter.field] = { $lt: filter.value };
        break;
      case '<=':
        filterObj[filter.field] = { $lte: filter.value };
        break;
      case 'IN':
        filterObj[filter.field] = { $in: filter.values };
        break;
      case 'LIKE':
        filterObj[filter.field] = { $regex: filter.value, $options: 'i' };
        break;
      case 'BETWEEN':
        if (filter.values && filter.values.length === 2) {
          filterObj[filter.field] = { $gte: filter.values[0], $lte: filter.values[1] };
        }
        break;
      case 'IS_NULL':
        filterObj[filter.field] = { $eq: null };
        break;
    }

    return filterObj;
  }
}

/**
 * Fluent Query Builder
 * Provides a fluent interface for building queries
 */
export class FluentQueryBuilder {
  private builder: AdvancedQueryBuilder;

  constructor(fromTable: string) {
    this.builder = {
      select: [],
      from: fromTable,
      joins: [],
      where: [],
      groupBy: [],
      orderBy: [],
    };
  }

  /**
   * Add SELECT columns
   */
  select(...columns: string[]): this {
    this.builder.select = columns;
    return this;
  }

  /**
   * Add WHERE condition
   */
  where(field: string, operator: any, value?: any): this {
    if (!this.builder.where) {
      this.builder.where = [];
    }

    this.builder.where.push({
      field,
      operator,
      value,
      logic: this.builder.where.length > 0 ? 'AND' : undefined,
    });

    return this;
  }

  /**
   * Add OR condition
   */
  orWhere(field: string, operator: any, value?: any): this {
    if (!this.builder.where) {
      this.builder.where = [];
    }

    this.builder.where.push({
      field,
      operator,
      value,
      logic: 'OR',
    });

    return this;
  }

  /**
   * Add JOIN
   */
  join(
    type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL',
    rightTable: string,
    condition: string
  ): this {
    if (!this.builder.joins) {
      this.builder.joins = [];
    }

    this.builder.joins.push({
      type,
      leftTable: this.builder.from,
      rightTable,
      condition,
    });

    return this;
  }

  /**
   * Add GROUP BY
   */
  groupBy(...fields: string[]): this {
    this.builder.groupBy = fields;
    return this;
  }

  /**
   * Add ORDER BY
   */
  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    if (!this.builder.orderBy) {
      this.builder.orderBy = [];
    }

    this.builder.orderBy.push({ field, direction });
    return this;
  }

  /**
   * Set LIMIT
   */
  limit(limit: number): this {
    this.builder.limit = limit;
    return this;
  }

  /**
   * Set OFFSET
   */
  offset(offset: number): this {
    this.builder.offset = offset;
    return this;
  }

  /**
   * Build PostgreSQL query
   */
  buildPostgres(): { sql: string; params: any[] } {
    return QueryBuilder.buildPostgresQuery(this.builder);
  }

  /**
   * Build MySQL query
   */
  buildMySQL(): { sql: string; params: any[] } {
    return QueryBuilder.buildMySqlQuery(this.builder);
  }

  /**
   * Build MongoDB pipeline
   */
  buildMongo(): { pipeline: any[] } {
    return QueryBuilder.buildMongoQuery(this.builder);
  }

  /**
   * Get raw builder object
   */
  getBuilder(): AdvancedQueryBuilder {
    return this.builder;
  }

  /**
   * Validate query
   */
  validate(): { valid: boolean; errors: string[] } {
    return QueryBuilder.validate(this.builder);
  }
}

// Export instances
export const queryBuilder = new QueryBuilder();
export const fluentBuilder = (from: string) => new FluentQueryBuilder(from);
