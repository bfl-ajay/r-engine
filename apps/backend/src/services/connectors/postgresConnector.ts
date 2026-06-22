/**
 * PostgreSQL Data Connector
 * Handles connections and queries to PostgreSQL databases
 */

import { Pool, PoolClient } from 'pg';
import { DataSourceConnection } from '@reporting-engine/shared';

export interface ConnectorResult {
  success: boolean;
  data?: any[];
  error?: {
    code: string;
    message: string;
  };
}

/**
 * PostgreSQL Connector
 */
export class PostgresConnector {
  private pool: Pool | null = null;
  private connection: DataSourceConnection;

  constructor(connection: DataSourceConnection) {
    this.connection = connection;
  }

  /**
   * Get or create connection pool
   */
  private getPool(): Pool {
    if (this.pool) {
      return this.pool;
    }

    this.pool = new Pool({
      host: this.connection.host || 'localhost',
      port: this.connection.port || 5432,
      database: this.connection.database,
      user: this.connection.username,
      password: this.connection.password,
      ssl: this.connection.ssl ? { rejectUnauthorized: false } : false,
      max: this.connection.poolSize || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: this.connection.timeout || 30000,
    });

    return this.pool;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<ConnectorResult> {
    try {
      const pool = this.getPool();
      const client = await pool.connect();

      try {
        const result = await client.query('SELECT NOW()');
        return {
          success: true,
          data: [{ timestamp: result.rows[0].now }],
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONNECTION_ERROR',
          message: error instanceof Error ? error.message : 'Connection failed',
        },
      };
    }
  }

  /**
   * Execute a query
   */
  async executeQuery(queryText: string, parameters?: Record<string, any>): Promise<ConnectorResult> {
    try {
      const pool = this.getPool();
      const client = await pool.connect();

      try {
        // Replace named parameters with positional ones
        const { sql, params } = this.replaceNamedParameters(queryText, parameters || {});

        const result = await client.query(sql, params);

        return {
          success: true,
          data: result.rows,
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: error instanceof Error ? error.message : 'Query execution failed',
        },
      };
    }
  }

  /**
   * Get database schema
   */
  async getSchema(): Promise<any> {
    try {
      const pool = this.getPool();
      const client = await pool.connect();

      try {
        // Get tables
        const tablesResult = await client.query(`
          SELECT 
            table_name,
            table_schema
          FROM information_schema.tables
          WHERE table_schema = $1
          ORDER BY table_name
        `, [this.connection.schema || 'public']);

        const tables = [];

        for (const table of tablesResult.rows) {
          // Get columns for each table
          const columnsResult = await client.query(`
            SELECT 
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns
            WHERE table_name = $1 AND table_schema = $2
            ORDER BY ordinal_position
          `, [table.table_name, table.table_schema]);

          tables.push({
            name: table.table_name,
            columns: columnsResult.rows.map((col: any) => ({
              name: col.column_name,
              type: this.mapPostgresType(col.data_type),
              nullable: col.is_nullable === 'YES',
              default: col.column_default,
            })),
          });
        }

        return { tables };
      } finally {
        client.release();
      }
    } catch (error) {
      throw new Error(
        `Failed to get schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * Map PostgreSQL data types
   */
  private mapPostgresType(pgType: string): string {
    const typeMap: Record<string, string> = {
      'character varying': 'STRING',
      varchar: 'STRING',
      text: 'STRING',
      char: 'STRING',
      integer: 'NUMBER',
      smallint: 'NUMBER',
      bigint: 'NUMBER',
      numeric: 'NUMBER',
      decimal: 'NUMBER',
      real: 'NUMBER',
      'double precision': 'NUMBER',
      boolean: 'BOOLEAN',
      bool: 'BOOLEAN',
      date: 'DATE',
      time: 'DATE',
      timestamp: 'DATE',
      'timestamp without time zone': 'DATE',
      'timestamp with time zone': 'DATE',
      json: 'OBJECT',
      jsonb: 'OBJECT',
    };

    return typeMap[pgType.toLowerCase()] || 'STRING';
  }

  /**
   * Replace named parameters with positional ones
   */
  private replaceNamedParameters(
    queryText: string,
    parameters: Record<string, any>
  ): { sql: string; params: any[] } {
    const params: any[] = [];
    let sql = queryText;
    let paramIndex = 1;

    // Find all :paramName patterns
    const paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;

    while ((match = paramRegex.exec(queryText)) !== null) {
      const paramName = match[1];
      if (parameters.hasOwnProperty(paramName)) {
        sql = sql.replace(`:${paramName}`, `$${paramIndex}`);
        params.push(parameters[paramName]);
        paramIndex++;
      }
    }

    return { sql, params };
  }
}
