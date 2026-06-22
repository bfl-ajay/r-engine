/**
 * MySQL Data Connector
 * Handles connections and queries to MySQL databases
 */

import * as mysql from 'mysql2/promise';
import { DataSourceConnection } from '@reporting-engine/shared';
import { ConnectorResult } from './postgresConnector';

/**
 * MySQL Connector
 */
export class MySqlConnector {
  private pool: mysql.Pool | null = null;
  private connection: DataSourceConnection;

  constructor(connection: DataSourceConnection) {
    this.connection = connection;
  }

  /**
   * Get or create connection pool
   */
  private getPool(): mysql.Pool {
    if (this.pool) {
      return this.pool;
    }

    this.pool = mysql.createPool({
      host: this.connection.host || 'localhost',
      port: this.connection.port || 3306,
      database: this.connection.database,
      user: this.connection.username,
      password: this.connection.password,
      waitForConnections: true,
      connectionLimit: this.connection.poolSize || 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0,
    });

    return this.pool;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<ConnectorResult> {
    try {
      const pool = this.getPool();
      const connection = await pool.getConnection();

      try {
        const [rows] = await connection.query('SELECT NOW() as timestamp');
        return {
          success: true,
          data: rows,
        };
      } finally {
        connection.release();
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
      const connection = await pool.getConnection();

      try {
        // Replace named parameters with positional ones
        const { sql, params } = this.replaceNamedParameters(queryText, parameters || {});

        const [rows] = await connection.query(sql, params);

        return {
          success: true,
          data: rows as any[],
        };
      } finally {
        connection.release();
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
      const connection = await pool.getConnection();

      try {
        // Get tables
        const [tables] = await connection.query(
          `SELECT TABLE_NAME as table_name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
          [this.connection.database]
        );

        const schema = { tables: [] };

        for (const table of tables as any[]) {
          // Get columns for each table
          const [columns] = await connection.query(
            `SELECT COLUMN_NAME as column_name, DATA_TYPE as data_type, IS_NULLABLE as is_nullable 
             FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
            [this.connection.database, table.table_name]
          );

          (schema.tables as any[]).push({
            name: table.table_name,
            columns: (columns as any[]).map((col) => ({
              name: col.column_name,
              type: this.mapMySqlType(col.data_type),
              nullable: col.is_nullable === 'YES',
            })),
          });
        }

        return schema;
      } finally {
        connection.release();
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
   * Map MySQL data types
   */
  private mapMySqlType(mysqlType: string): string {
    const typeMap: Record<string, string> = {
      varchar: 'STRING',
      char: 'STRING',
      text: 'STRING',
      longtext: 'STRING',
      tinytext: 'STRING',
      mediumtext: 'STRING',
      int: 'NUMBER',
      tinyint: 'NUMBER',
      smallint: 'NUMBER',
      mediumint: 'NUMBER',
      bigint: 'NUMBER',
      float: 'NUMBER',
      double: 'NUMBER',
      decimal: 'NUMBER',
      numeric: 'NUMBER',
      boolean: 'BOOLEAN',
      bool: 'BOOLEAN',
      date: 'DATE',
      datetime: 'DATE',
      timestamp: 'DATE',
      time: 'DATE',
      json: 'OBJECT',
    };

    return typeMap[mysqlType.toLowerCase()] || 'STRING';
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

    // Find all :paramName patterns
    const paramRegex = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let match;

    while ((match = paramRegex.exec(queryText)) !== null) {
      const paramName = match[1];
      if (parameters.hasOwnProperty(paramName)) {
        sql = sql.replace(`:${paramName}`, '?');
        params.push(parameters[paramName]);
      }
    }

    return { sql, params };
  }
}
