/**
 * Oracle Database Connector
 * Handles Oracle connection and query execution
 */

import oracledb from 'oracledb';
import { DataSourceConnection, QueryResult, ColumnMetadata } from '@reporting-engine/shared';

export interface ConnectorResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * OracleConnector - Connects to Oracle Database
 */
class OracleConnector {
  private connection?: oracledb.Connection;
  private config: DataSourceConnection;

  constructor(config: DataSourceConnection) {
    this.config = config;
    // Initialize Oracle driver (thin client mode for easier deployment)
    oracledb.initOracleClient({ libDir: process.env.ORACLE_LIB_DIR });
  }

  /**
   * Get or create connection
   */
  async getConnection(): Promise<oracledb.Connection> {
    if (this.connection) {
      return this.connection;
    }

    try {
      // Parse connection string
      const connectionString = this.buildConnectionString();

      this.connection = await oracledb.getConnection({
        user: this.config.username,
        password: this.config.password,
        connectionString,
      });

      return this.connection;
    } catch (error) {
      this.connection = undefined;
      throw error;
    }
  }

  /**
   * Build Oracle connection string
   */
  private buildConnectionString(): string {
    if (this.config.connectionString) {
      return this.config.connectionString;
    }

    // Build TNS-style connection string
    const host = this.config.host || 'localhost';
    const port = this.config.port || 1521;
    const database = this.config.database || 'orcl';

    return `${host}:${port}/${database}`;
  }

  /**
   * Execute query
   */
  async executeQuery(
    queryText: string,
    parameters?: Record<string, any>
  ): Promise<ConnectorResult> {
    let connection: oracledb.Connection | undefined;

    try {
      connection = await this.getConnection();

      // Convert parameter object to array for Oracle
      const paramArray: any[] = [];
      const bindParams: Record<string, any> = {};

      if (parameters) {
        Object.entries(parameters).forEach(([key, value]) => {
          bindParams[`:${key}`] = value;
          paramArray.push(value);
        });
      }

      const options = {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      };

      const result = await connection.execute(
        queryText,
        paramArray.length > 0 ? bindParams : [],
        options as any
      );

      return {
        success: true,
        data: result.rows || [],
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
    let connection: oracledb.Connection | undefined;

    try {
      connection = await this.getConnection();
      const result = await connection.execute('SELECT 1 FROM DUAL');

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
    let connection: oracledb.Connection | undefined;

    try {
      connection = await this.getConnection();

      // Get tables
      const tablesQuery = `
        SELECT table_name as name
        FROM user_tables
        ORDER BY table_name
      `;

      const tablesResult = await connection.execute(tablesQuery, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      const tables = tablesResult.rows || [];

      // Get columns for each table
      const columnsQuery = `
        SELECT 
          table_name,
          column_name as name,
          data_type as type,
          data_length as size,
          nullable
        FROM user_tab_columns
        ORDER BY table_name, column_id
      `;

      const columnsResult = await connection.execute(columnsQuery, [], {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });

      const allColumns = columnsResult.rows || [];

      // Group columns by table
      const schema = (tables as any[]).map((table) => {
        const tableColumns = allColumns.filter(
          (c) => (c as any).table_name === table.name
        );

        return {
          name: table.name,
          columns: tableColumns.map((col) => ({
            name: (col as any).name,
            type: this.mapOracleType((col as any).type),
            nullable: (col as any).nullable === 'Y',
            size: (col as any).size,
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
   * Map Oracle data types to generic types
   */
  private mapOracleType(
    oracleType: string
  ): 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'OBJECT' {
    const type = oracleType.toUpperCase();

    if (type.includes('VARCHAR') || type.includes('CHAR') || type.includes('CLOB')) {
      return 'STRING';
    }
    if (
      type.includes('NUMBER') ||
      type.includes('INTEGER') ||
      type.includes('FLOAT') ||
      type.includes('DECIMAL')
    ) {
      return 'NUMBER';
    }
    if (type.includes('DATE') || type.includes('TIMESTAMP')) {
      return 'DATE';
    }
    if (type === 'CHAR' && type.length === 1) {
      return 'BOOLEAN';
    }
    if (type.includes('XMLTYPE')) {
      return 'OBJECT';
    }

    return 'STRING';
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
      } catch (error) {
        console.error('Error closing Oracle connection:', error);
      }
      this.connection = undefined;
    }
  }

  /**
   * Get table columns
   */
  async getTableColumns(tableName: string): Promise<string[]> {
    const schema = await this.getSchema();
    if (!schema.success) return [];

    const table = (schema.data?.tables || []).find((t) => t.name === tableName);
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
      const paramName = `:param${index}`;
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
          const inParams = filter.values.map((v, i) => `:param${index}_${i}`);
          filter.values.forEach((v, i) => {
            params[`:param${index}_${i}`] = v;
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

  /**
   * Execute stored procedure
   */
  async executeStoredProcedure(
    procedureName: string,
    parameters?: Record<string, any>
  ): Promise<ConnectorResult> {
    let connection: oracledb.Connection | undefined;

    try {
      connection = await this.getConnection();

      const bindParams: Record<string, any> = {};
      if (parameters) {
        Object.entries(parameters).forEach(([key, value]) => {
          bindParams[`:${key}`] = value;
        });
      }

      const result = await connection.execute(
        `BEGIN ${procedureName}(${Object.keys(bindParams).join(',')}); END;`,
        bindParams,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      return {
        success: true,
        data: result.outBinds,
      };
    } catch (error) {
      return {
        success: false,
        error: `Stored procedure execution failed: ${error}`,
      };
    }
  }
}

export default OracleConnector;
