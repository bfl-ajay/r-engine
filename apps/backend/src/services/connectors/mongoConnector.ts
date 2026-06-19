/**
 * MongoDB Data Connector
 * Handles connections and queries to MongoDB databases
 */

import { MongoClient, Db } from 'mongodb';
import { DataSourceConnection } from '@report-engine/shared';
import { ConnectorResult } from './postgresConnector';

/**
 * MongoDB Connector
 */
export class MongoConnector {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connection: DataSourceConnection;

  constructor(connection: DataSourceConnection) {
    this.connection = connection;
  }

  /**
   * Get or create database connection
   */
  private async getDb(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    const connectionString =
      this.connection.connectionString ||
      `mongodb://${this.connection.username}${this.connection.password ? ':' + this.connection.password : ''}@${this.connection.host}:${this.connection.port || 27017}`;

    this.client = new MongoClient(connectionString, {
      maxPoolSize: this.connection.poolSize || 10,
      serverSelectionTimeoutMS: this.connection.timeout || 30000,
    });

    await this.client.connect();
    this.db = this.client.db(this.connection.mongoDatabase || 'test');

    return this.db;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<ConnectorResult> {
    try {
      const db = await this.getDb();
      const result = await db.admin().ping();

      return {
        success: true,
        data: [result],
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
   * Execute a query (aggregation pipeline)
   */
  async executeQuery(queryText: string, parameters?: Record<string, any>): Promise<ConnectorResult> {
    try {
      const db = await this.getDb();

      // Parse aggregation pipeline or collection query
      let pipeline: any[] = [];
      try {
        const query = JSON.parse(queryText);

        if (Array.isArray(query)) {
          pipeline = query;
        } else if (query.collection && Array.isArray(query.pipeline)) {
          // Format: { collection: "users", pipeline: [...] }
          const collection = db.collection(query.collection);
          const results = await collection.aggregate(query.pipeline).toArray();
          return { success: true, data: results };
        }
      } catch {
        // If not JSON, try to parse as simple collection query
        const match = queryText.match(/^db\.(\w+)\.(.+)$/);
        if (match) {
          const collectionName = match[1];
          const collection = db.collection(collectionName);
          const results = await collection.find({}).toArray();
          return { success: true, data: results };
        }
      }

      // Execute aggregation pipeline
      if (pipeline.length > 0) {
        const collections = db.listCollections().toArray();
        const cols = await collections;
        if (cols.length > 0) {
          const collection = db.collection(cols[0].name);
          const results = await collection.aggregate(pipeline).toArray();
          return { success: true, data: results };
        }
      }

      return { success: true, data: [] };
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
      const db = await this.getDb();

      const collections = await db.listCollections().toArray();

      const schema = {
        collections: await Promise.all(
          collections.map(async (coll) => {
            const collection = db.collection(coll.name);
            const sample = await collection.findOne({});

            return {
              name: coll.name,
              fields: sample ? Object.keys(sample).map((key) => ({ name: key })) : [],
            };
          })
        ),
      };

      return schema;
    } catch (error) {
      throw new Error(
        `Failed to get schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}
