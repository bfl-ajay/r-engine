/**
 * MSSQL Server Connector
 * Handles SQL Server connection and query execution
 */

import mssql from 'mssql';
import { DataSourceConnection, QueryResult, ColumnMetadata } from '@reporting-engine/shared';

export interface ConnectorResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * MSSQLConnector - Connects to Microsoft SQL Server
 */
class MSSQLConnector {
  private connection?: mssql.ConnectionPool;
  private config: DataSourceConnection;

  constructor(config: DataSourceConnection) {
    this.config = config;
  }

  /**
   * Get or create connection pool
   */
  async getPool(): Promise<mssql.ConnectionPool> {
    if (this.connection) {
      return this.connection;
    }

    const mssqlConfig: mssql.config = {
      user: this.config.username,
      password: this.config.password,
      database: this.config.database,
      server: this.config.host || 'localhost',
      port: this.config.port || 1433,
      pool: {
        max: this.config.poolSize || 10,
        min: 0,
        idleTimeoutMillis: this.config.timeout || 30000,
      },
      options: {
        encrypt: this.config.ssl !== false,
        trustServerCertificate: this.config.ssl === false,
        requestTimeout: this.config.timeout || 30000,
      },
    };

    this.connection = new mssql.ConnectionPool(mssqlConfig);

    try {
      await this.connection.connect();
    } catch (error) {
      this.connection = undefined;
      throw error;
    }

    return this.connection;
  }

  /**
   * Execute query
   */
  async executeQuery(
    queryText: string,
    parameters?: Record<string, any>
  ): Promise<ConnectorResult> {
    try {
      const pool = await this.getPool();
      const request = pool.request();

      // Add parameters
      if (parameters) {
        Object.entries(parameters).forEach(([key, value]) => {
          request.input(key, value);
        });
      }

      const result = await request.query(queryText);

      return {
        success: true,
        data: result.recordset,
      };
    } catch (error) {
      return {
        success: false,
        error: `Query execution failed: ${error}`,
      };
    }
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<ConnectorResult> {
    try {
      const pool = await this.getPool();
      await pool.request().query('SELECT 1');

      return {
        success: true,
        data: { message: 'Connection successful' },
      };
    } catch (error) {
      return {
        success: false,
        error: `Connection test failed: ${error}`,
      };
    }
  }

  /**
   * Get database schema
   */
  async getSchema(): Promise<ConnectorResult> {
    try {
      const pool = await this.getPool();

      // Get tables
      const tablesQuery = `
        SELECT 
          TABLE_NAME as name,
          TABLE_CATALOG as database,
          TABLE_SCHEMA as schema
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `;

      const tablesResult = await pool.request().query(tablesQuery);
      const tables = tablesResult.recordset;

      // Get columns for each table
      const columnsQuery = `
        SELECT 
          TABLE_NAME,
          COLUMN_NAME as name,
          DATA_TYPE as type,
          CHARACTER_MAXIMUM_LENGTH as size,
          IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        ORDER BY TABLE_NAME, ORDINAL_POSITION
      `;

      const columnsResult = await pool.request().query(columnsQuery);
      const allColumns = columnsResult.recordset;

      // Group columns by table
      const schema = tables.map((table) => {
        const tableColumns = allColumns.filter(
          (c) => c.TABLE_NAME === table.name
        );

        return {
          name: table.name,
          columns: tableColumns.map((col) => ({
            name: col.name,
            type: this.mapMSSQLType(col.type),
            nullable: col.IS_NULLABLE === 'YES',
            size: col.size,
          } as ColumnMetadata)),
        };
      });

      return {
        success: true,
        data: { tables: schema },
      };
    } catch (error) {
      return {
        success: false,
        error: `Schema retrieval failed: ${error}`,
      };
    }
  }

  /**
   * Map MSSQL data types to generic types
   */
  private mapMSSQLType(
    mssqlType: string
  ): 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'OBJECT' {
    const type = mssqlType.toLowerCase();

    if (
      type.includes('varchar') ||
      type.includes('char') ||
      type.includes('text')
    ) {
      return 'STRING';
    }
    if (
      type.includes('int') ||
      type.includes('decimal') ||
      type.includes('numeric') ||
      type.includes('float') ||
      type.includes('real')
    ) {
      return 'NUMBER';
    }
    if (
      type.includes('date') ||
      type.includes('time') ||
      type.includes('datetime')
    ) {
      return 'DATE';
    }
    if (type.includes('bit')) {
      return 'BOOLEAN';
    }
    if (type.includes('json') || type.includes('xml')) {
      return 'OBJECT';
    }

    return 'STRING';
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.close();
      this.connection = undefined;
    }
  }

  /**
   * Get column names from table
   */
  async getTableColumns(tableName: string): Promise<string[]> {
    const schema = await this.getSchema();
    if (!schema.success) return [];

    const table = schema.data?.tables?.find((t) => t.name === tableName);
    return table?.columns?.map((c) => c.name) || [];
  }

  /**
   * Execute parameterized query
   */
  async executeParameterizedQuery(
    queryText: string,
    params: Record<string, any>
  ): Promise<QueryResult> {
    const result = await this.executeQuery(queryText, params);

    if (!result.success) {
      return {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: result.error || 'Query failed',
        },
      };
    }

    const rows = result.data as any[];
    const columns: ColumnMetadata[] = [];

    if (rows.length > 0) {
      Object.keys(rows[0]).forEach((key) => {
        columns.push({
          name: key,
          type: 'STRING', // Would need type inference from actual data
          nullable: true,
        });
      });
    }

    return {
      success: true,
      data: rows,
      columns,
      rowCount: rows.length,
    };
  }

  /**
   * Build WHERE clause with parameter placeholders
   */
  buildWhereClause(filters: any[]): { clause: string; params: Record<string, any> } {
    const params: Record<string, any> = {};
    const clauses: string[] = [];

    filters.forEach((filter, index) => {
      const paramName = `@param${index}`;
      params[paramName] = filter.value;

      switch (filter.operator) {
        case '=':
          clauses.push(`${filter.field} = ${paramName}`);
          break;
        case '!=':
          clauses.push(`${filter.field} != ${paramName}`);
          break;
        case '>':
          clauses.push(`${filter.field} > ${paramName}`);
          break;
        case '<':
          clauses.push(`${filter.field} < ${paramName}`);
          break;
        case '>=':
          clauses.push(`${filter.field} >= ${paramName}`);
          break;
        case '<=':
          clauses.push(`${filter.field} <= ${paramName}`);
          break;
        case 'LIKE':
          clauses.push(`${filter.field} LIKE ${paramName}`);
          break;
        case 'IN':
          const inParams = filter.values.map((v, i) => `@param${index}_${i}`);
          filter.values.forEach((v, i) => {
            params[`@param${index}_${i}`] = v;
          });
          clauses.push(`${filter.field} IN (${inParams.join(',')})`);
          break;
      }
    });

    return {
      clause: clauses.join(' AND '),
      params,
    };
  }
}

export default MSSQLConnector;
