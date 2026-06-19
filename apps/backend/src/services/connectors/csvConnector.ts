/**
 * CSV Data Connector
 * Handles reading data from CSV files
 */

import * as fs from 'fs';
import * as csv from 'csv-parse/sync';
import * as path from 'path';
import { DataSourceConnection } from '@report-engine/shared';
import { ConnectorResult } from './postgresConnector';

/**
 * CSV Connector
 */
export class CsvConnector {
  private connection: DataSourceConnection;

  constructor(connection: DataSourceConnection) {
    this.connection = connection;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<ConnectorResult> {
    try {
      const filePath = await this.getFilePath();
      const exists = fs.existsSync(filePath);

      if (!exists) {
        return {
          success: false,
          error: { code: 'FILE_NOT_FOUND', message: `File not found: ${filePath}` },
        };
      }

      const stats = fs.statSync(filePath);
      return {
        success: true,
        data: [{ file: filePath, size: stats.size }],
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FILE_ERROR',
          message: error instanceof Error ? error.message : 'File access failed',
        },
      };
    }
  }

  /**
   * Execute a query (read CSV file)
   */
  async executeQuery(queryText: string, parameters?: Record<string, any>): Promise<ConnectorResult> {
    try {
      const filePath = await this.getFilePath();

      const fileContent = fs.readFileSync(filePath, {
        encoding: (this.connection.encoding as BufferEncoding) || 'utf-8',
      });

      const records = csv.parse(fileContent, {
        columns: this.connection.hasHeaders !== false,
        skip_empty_lines: true,
        delimiter: ',',
      });

      return {
        success: true,
        data: records,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: error instanceof Error ? error.message : 'CSV parsing failed',
        },
      };
    }
  }

  /**
   * Get file schema
   */
  async getSchema(): Promise<any> {
    try {
      const filePath = await this.getFilePath();
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      const records = csv.parse(fileContent, {
        columns: this.connection.hasHeaders !== false,
        skip_empty_lines: true,
        to: 1,
      });

      const columns = records.length > 0 ? Object.keys(records[0]).map((name) => ({ name })) : [];

      return { columns };
    } catch (error) {
      throw new Error(`Failed to get schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file path (local or download from URL)
   */
  private async getFilePath(): Promise<string> {
    if (this.connection.filePath) {
      return this.connection.filePath;
    }

    if (this.connection.fileUrl) {
      // TODO: Download file from URL and cache it
      throw new Error('File URL support not yet implemented');
    }

    throw new Error('No file path or URL specified');
  }

  /**
   * Close connection (no-op for files)
   */
  async close(): Promise<void> {
    // No-op
  }
}

/**
 * JSON Connector
 */
export class JsonConnector {
  private connection: DataSourceConnection;

  constructor(connection: DataSourceConnection) {
    this.connection = connection;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<ConnectorResult> {
    try {
      const filePath = await this.getFilePath();
      const exists = fs.existsSync(filePath);

      if (!exists) {
        return {
          success: false,
          error: { code: 'FILE_NOT_FOUND', message: `File not found: ${filePath}` },
        };
      }

      const stats = fs.statSync(filePath);
      return {
        success: true,
        data: [{ file: filePath, size: stats.size }],
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FILE_ERROR',
          message: error instanceof Error ? error.message : 'File access failed',
        },
      };
    }
  }

  /**
   * Execute a query (read JSON file)
   */
  async executeQuery(queryText: string, parameters?: Record<string, any>): Promise<ConnectorResult> {
    try {
      const filePath = await this.getFilePath();

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // If data is array, return as-is; if object, wrap in array
      const records = Array.isArray(data) ? data : [data];

      return {
        success: true,
        data: records,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: error instanceof Error ? error.message : 'JSON parsing failed',
        },
      };
    }
  }

  /**
   * Get file schema
   */
  async getSchema(): Promise<any> {
    try {
      const filePath = await this.getFilePath();
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      const records = Array.isArray(data) ? data : [data];
      const columns = records.length > 0 ? Object.keys(records[0]).map((name) => ({ name })) : [];

      return { columns };
    } catch (error) {
      throw new Error(`Failed to get schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file path
   */
  private async getFilePath(): Promise<string> {
    if (this.connection.filePath) {
      return this.connection.filePath;
    }

    if (this.connection.fileUrl) {
      // TODO: Download file from URL and cache it
      throw new Error('File URL support not yet implemented');
    }

    throw new Error('No file path or URL specified');
  }

  /**
   * Close connection (no-op for files)
   */
  async close(): Promise<void> {
    // No-op
  }
}
