/**
 * Data Source Service
 * Manages database connections, queries, and result caching
 */

import { prisma } from '../db';
import {
  DataSourceConnection,
  QueryDefinition,
  QueryResult,
  DataSourceType,
  DataSourceTestResult,
} from '@report-engine/shared';
import { ApiError } from '../middlewares/errorHandler';
import { PostgresConnector } from './connectors/postgresConnector';
import { MySqlConnector } from './connectors/mysqlConnector';
import { MongoConnector } from './connectors/mongoConnector';
import { CsvConnector } from './connectors/csvConnector';
import { JsonConnector } from './connectors/jsonConnector';
import { ApiConnector } from './connectors/apiConnector';

/**
 * Data Source Service
 * Provides data source management and query execution
 */
export class DataSourceService {
  private connectionCache: Map<string, any> = new Map();
  private queryCache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clean up cache periodically
    setInterval(() => this.cleanupCache(), this.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * Create a new data source connection
   */
  async createConnection(input: DataSourceConnection): Promise<DataSourceConnection> {
    if (!input.name) {
      throw new ApiError('VALIDATION_ERROR', 'Connection name is required');
    }

    if (!input.type) {
      throw new ApiError('VALIDATION_ERROR', 'Connection type is required');
    }

    // Validate type-specific fields
    this.validateConnectionInput(input);

    try {
      const connection = await prisma.dataSourceConnection.create({
        data: {
          id: input.id || `conn-${Date.now()}`,
          name: input.name,
          displayName: input.displayName,
          type: input.type,
          description: input.description,
          isActive: input.isActive !== false,
          isShared: input.isShared || false,
          owner: input.owner,
          databaseType: input.databaseType,
          host: input.host,
          port: input.port,
          database: input.database,
          username: input.username,
          password: input.password ? this.encryptPassword(input.password) : undefined,
          ssl: input.ssl,
          schema: input.schema,
          connectionString: input.connectionString,
          baseUrl: input.baseUrl,
          filePath: input.filePath,
          poolSize: input.poolSize || 10,
          timeout: input.timeout || 30000,
        },
      });

      return this.sanitizeConnection(connection);
    } catch (error) {
      throw new ApiError('DATABASE_ERROR', 'Failed to create connection', { error });
    }
  }

  /**
   * Get a connection by ID
   */
  async getConnectionById(connectionId: string): Promise<DataSourceConnection> {
    try {
      const connection = await prisma.dataSourceConnection.findUnique({
        where: { id: connectionId },
      });

      if (!connection) {
        throw new ApiError('NOT_FOUND', 'Connection not found');
      }

      return this.sanitizeConnection(connection);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('DATABASE_ERROR', 'Failed to fetch connection', { error });
    }
  }

  /**
   * List all connections with pagination
   */
  async listConnections(page = 1, limit = 20): Promise<any> {
    try {
      const skip = (page - 1) * limit;
      const [connections, total] = await Promise.all([
        prisma.dataSourceConnection.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.dataSourceConnection.count(),
      ]);

      return {
        data: connections.map((c) => this.sanitizeConnection(c)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ApiError('DATABASE_ERROR', 'Failed to list connections', { error });
    }
  }

  /**
   * Update a connection
   */
  async updateConnection(
    connectionId: string,
    updates: Partial<DataSourceConnection>
  ): Promise<DataSourceConnection> {
    try {
      const connection = await prisma.dataSourceConnection.update({
        where: { id: connectionId },
        data: {
          ...updates,
          password: updates.password ? this.encryptPassword(updates.password) : undefined,
          modifiedAt: new Date().toISOString(),
        },
      });

      // Invalidate connection cache
      this.connectionCache.delete(connectionId);

      return this.sanitizeConnection(connection);
    } catch (error) {
      throw new ApiError('DATABASE_ERROR', 'Failed to update connection', { error });
    }
  }

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string): Promise<void> {
    try {
      await prisma.dataSourceConnection.delete({
        where: { id: connectionId },
      });

      this.connectionCache.delete(connectionId);
    } catch (error) {
      throw new ApiError('DATABASE_ERROR', 'Failed to delete connection', { error });
    }
  }

  /**
   * Test a connection
   */
  async testConnection(connectionId: string): Promise<DataSourceTestResult> {
    try {
      const connection = await this.getConnectionById(connectionId);
      const connector = this.getConnector(connection);

      if (!connector) {
        return {
          success: false,
          message: `No connector available for type ${connection.type}`,
        };
      }

      const startTime = Date.now();
      const result = await connector.testConnection();
      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        message: result.message,
        executionTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create a query definition
   */
  async createQuery(input: QueryDefinition): Promise<QueryDefinition> {
    if (!input.name) {
      throw new ApiError('VALIDATION_ERROR', 'Query name is required');
    }

    if (!input.connectionId) {
      throw new ApiError('VALIDATION_ERROR', 'Connection ID is required');
    }

    try {
      const query = await prisma.queryDefinition.create({
        data: {
          id: input.id || `query-${Date.now()}`,
          name: input.name,
          displayName: input.displayName,
          connectionId: input.connectionId,
          queryType: input.queryType,
          queryText: input.queryText,
          timeout: input.timeout || 30000,
          cachingEnabled: input.caching?.enabled || false,
          cachingDuration: input.caching?.duration,
          paginationEnabled: input.pagination?.enabled || false,
          paginationPageSize: input.pagination?.pageSize,
        },
      });

      return this.mapDbQueryToType(query);
    } catch (error) {
      throw new ApiError('DATABASE_ERROR', 'Failed to create query', { error });
    }
  }

  /**
   * Get a query by ID
   */
  async getQueryById(queryId: string): Promise<QueryDefinition> {
    try {
      const query = await prisma.queryDefinition.findUnique({
        where: { id: queryId },
      });

      if (!query) {
        throw new ApiError('NOT_FOUND', 'Query not found');
      }

      return this.mapDbQueryToType(query);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('DATABASE_ERROR', 'Failed to fetch query', { error });
    }
  }

  /**
   * Execute a query
   */
  async executeQuery(
    queryId: string,
    parameters: Record<string, any> = {}
  ): Promise<QueryResult> {
    try {
      const query = await this.getQueryById(queryId);
      const connection = await this.getConnectionById(query.connectionId);

      // Check cache
      const cacheKey = this.generateCacheKey(queryId, parameters);
      if (query.caching?.enabled) {
        const cached = this.queryCache.get(cacheKey);
        if (
          cached &&
          Date.now() - cached.timestamp < (query.caching.duration || 3600) * 1000
        ) {
          return {
            success: true,
            data: cached.data,
            rowCount: cached.data.length,
          };
        }
      }

      // Get connector and execute
      const connector = this.getConnector(connection);
      if (!connector) {
        return {
          success: false,
          error: { code: 'NO_CONNECTOR', message: `No connector for ${connection.type}` },
        };
      }

      const startTime = Date.now();
      const result = await connector.executeQuery(query.queryText, parameters);
      const executionTime = Date.now() - startTime;

      // Cache result if enabled
      if (query.caching?.enabled && result.success) {
        this.queryCache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
        });
      }

      return {
        success: result.success,
        data: result.data,
        rowCount: result.data?.length || 0,
        executionTime,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Query execution failed',
        },
      };
    }
  }

  /**
   * Get schema for a connection
   */
  async getConnectionSchema(connectionId: string): Promise<any> {
    try {
      const connection = await this.getConnectionById(connectionId);
      const connector = this.getConnector(connection);

      if (!connector) {
        throw new ApiError('NOT_SUPPORTED', `Schema introspection not supported for ${connection.type}`);
      }

      return await connector.getSchema();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('SCHEMA_ERROR', 'Failed to retrieve schema', { error });
    }
  }

  /**
   * Preview query results
   */
  async previewQuery(
    queryId: string,
    limit = 10,
    parameters: Record<string, any> = {}
  ): Promise<QueryResult> {
    try {
      const result = await this.executeQuery(queryId, parameters);

      if (result.success && result.data) {
        return {
          ...result,
          data: result.data.slice(0, limit),
          rowCount: Math.min(result.data.length, limit),
        };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PREVIEW_ERROR',
          message: error instanceof Error ? error.message : 'Preview failed',
        },
      };
    }
  }

  /**
   * List queries for a connection
   */
  async listQueries(connectionId: string, page = 1, limit = 20): Promise<any> {
    try {
      const skip = (page - 1) * limit;
      const [queries, total] = await Promise.all([
        prisma.queryDefinition.findMany({
          where: { connectionId },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.queryDefinition.count({ where: { connectionId } }),
      ]);

      return {
        data: queries.map((q) => this.mapDbQueryToType(q)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new ApiError('DATABASE_ERROR', 'Failed to list queries', { error });
    }
  }

  /**
   * Get appropriate connector for connection type
   */
  private getConnector(connection: DataSourceConnection): any {
    switch (connection.type) {
      case 'SQL':
        if (connection.databaseType === 'POSTGRESQL') {
          return new PostgresConnector(connection);
        }
        if (connection.databaseType === 'MYSQL') {
          return new MySqlConnector(connection);
        }
        break;
      case 'MONGODB':
        return new MongoConnector(connection);
      case 'CSV':
        return new CsvConnector(connection);
      case 'JSON':
        return new JsonConnector(connection);
      case 'API':
        return new ApiConnector(connection);
      default:
        return null;
    }
  }

  /**
   * Validate connection input
   */
  private validateConnectionInput(input: DataSourceConnection): void {
    switch (input.type) {
      case 'SQL':
        if (!input.databaseType || !input.host || !input.database) {
          throw new ApiError(
            'VALIDATION_ERROR',
            'SQL connections require databaseType, host, and database'
          );
        }
        break;
      case 'MONGODB':
        if (!input.connectionString && !input.host) {
          throw new ApiError(
            'VALIDATION_ERROR',
            'MongoDB requires connectionString or host'
          );
        }
        break;
      case 'API':
        if (!input.baseUrl) {
          throw new ApiError('VALIDATION_ERROR', 'API connections require baseUrl');
        }
        break;
      case 'CSV':
      case 'JSON':
        if (!input.filePath && !input.fileUrl) {
          throw new ApiError(
            'VALIDATION_ERROR',
            'File connections require filePath or fileUrl'
          );
        }
        break;
    }
  }

  /**
   * Sanitize connection (remove sensitive info)
   */
  private sanitizeConnection(connection: any): DataSourceConnection {
    const sanitized = { ...connection };
    if (sanitized.password) {
      sanitized.password = '***ENCRYPTED***';
    }
    return sanitized;
  }

  /**
   * Encrypt password
   */
  private encryptPassword(password: string): string {
    // TODO: Implement proper encryption using crypto module
    return Buffer.from(password).toString('base64');
  }

  /**
   * Decrypt password
   */
  private decryptPassword(encrypted: string): string {
    // TODO: Implement proper decryption
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(queryId: string, parameters: Record<string, any>): string {
    const paramStr = JSON.stringify(parameters);
    return `${queryId}:${paramStr}`;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    this.queryCache.forEach((value, key) => {
      // Remove entries older than 1 hour
      if (now - value.timestamp > 3600 * 1000) {
        entriesToDelete.push(key);
      }
    });

    entriesToDelete.forEach((key) => this.queryCache.delete(key));
  }

  /**
   * Map database query to type
   */
  private mapDbQueryToType(query: any): QueryDefinition {
    return {
      id: query.id,
      name: query.name,
      displayName: query.displayName,
      connectionId: query.connectionId,
      queryType: query.queryType,
      queryText: query.queryText,
      timeout: query.timeout,
      caching: query.cachingEnabled
        ? {
            enabled: true,
            duration: query.cachingDuration,
          }
        : undefined,
      pagination: query.paginationEnabled
        ? {
            enabled: true,
            pageSize: query.paginationPageSize,
          }
        : undefined,
    };
  }
}

// Export singleton instance
export const dataSourceService = new DataSourceService();
