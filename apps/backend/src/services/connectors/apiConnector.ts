/**
 * REST API Data Connector
 * Handles connections and queries to REST APIs
 */

import * as axios from 'axios';
import { DataSourceConnection } from '@reporting-engine/shared';
import { ConnectorResult } from './postgresConnector';

/**
 * API Connector
 */
export class ApiConnector {
  private connection: DataSourceConnection;

  constructor(connection: DataSourceConnection) {
    this.connection = connection;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<ConnectorResult> {
    try {
      const config = this.buildAxiosConfig('GET');

      const response = await axios.default.get(this.connection.baseUrl || '', config);

      return {
        success: true,
        data: [{ status: response.status, message: 'Connection successful' }],
      };
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
   * Execute a query (API call)
   */
  async executeQuery(queryText: string, parameters?: Record<string, any>): Promise<ConnectorResult> {
    try {
      // Parse query as JSON with format: { method, path, query, body }
      const query = JSON.parse(queryText);

      const url = this.buildUrl(query.path || '/', query.query || parameters);
      const config = this.buildAxiosConfig(query.method || 'GET');

      let response: any;

      switch (query.method?.toUpperCase() || 'GET') {
        case 'POST':
          response = await axios.default.post(url, query.body, config);
          break;
        case 'PUT':
          response = await axios.default.put(url, query.body, config);
          break;
        case 'DELETE':
          response = await axios.default.delete(url, config);
          break;
        case 'PATCH':
          response = await axios.default.patch(url, query.body, config);
          break;
        default:
          response = await axios.default.get(url, config);
      }

      const data = Array.isArray(response.data) ? response.data : [response.data];

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error instanceof Error ? error.message : 'API call failed',
        },
      };
    }
  }

  /**
   * Get API schema (endpoints documentation)
   */
  async getSchema(): Promise<any> {
    // For now, return basic info
    // In real implementation, this could parse OpenAPI/Swagger docs
    return {
      baseUrl: this.connection.baseUrl,
      endpoints: [],
      authentication: this.connection.authentication?.type || 'NONE',
    };
  }

  /**
   * Build axios configuration with headers and auth
   */
  private buildAxiosConfig(method: string): any {
    const config: any = {
      method,
      timeout: this.connection.timeout || 30000,
      headers: {
        ...this.connection.headers,
        'Content-Type': 'application/json',
      },
    };

    // Add authentication
    if (this.connection.authentication) {
      switch (this.connection.authentication.type) {
        case 'BASIC':
          config.auth = {
            username: this.connection.authentication.username,
            password: this.connection.authentication.password,
          };
          break;
        case 'BEARER':
          config.headers.Authorization = `Bearer ${this.connection.authentication.token}`;
          break;
        case 'OAUTH':
          // OAuth implementation would go here
          // For now, just use token if available
          if (this.connection.authentication.token) {
            config.headers.Authorization = `Bearer ${this.connection.authentication.token}`;
          }
          break;
      }
    }

    return config;
  }

  /**
   * Build full URL with query parameters
   */
  private buildUrl(path: string, query?: Record<string, any>): string {
    let url = (this.connection.baseUrl || '').replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);

    if (query && Object.keys(query).length > 0) {
      const queryString = new URLSearchParams(query).toString();
      url += `?${queryString}`;
    }

    return url;
  }

  /**
   * Close connection (no-op for stateless APIs)
   */
  async close(): Promise<void> {
    // No-op
  }
}
