import { MongoClient, Db } from 'mongodb';
import { config } from './env';

class DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnecting: boolean = false;

  public async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    if (this.isConnecting) {
      throw new Error('Database connection is already in progress.');
    }

    this.isConnecting = true;

    try {
      this.client = new MongoClient(config.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 20,
        minPoolSize: 5
      });

      await this.client.connect();
      this.db = this.client.db(config.dbName);

      // Verify connection via non-destructive ping command
      await this.db.command({ ping: 1 });

      console.log(`[Database] Successfully connected to existing MongoDB database: "${config.dbName}"`);
      return this.db;
    } catch (error) {
      console.error('[Database] Failed to connect to MongoDB:', error);
      this.client = null;
      this.db = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('Database is not initialized. Call connect() first.');
    }
    return this.db;
  }

  public getClient(): MongoClient {
    if (!this.client) {
      throw new Error('MongoClient is not initialized. Call connect() first.');
    }
    return this.client;
  }

  public async checkHealth(): Promise<{ isConnected: boolean; databaseName: string; pingTimeMs: number }> {
    if (!this.db) {
      return { isConnected: false, databaseName: config.dbName, pingTimeMs: -1 };
    }

    const startTime = Date.now();
    try {
      // Non-destructive read command to verify cluster response
      await this.db.command({ ping: 1 });
      const pingTimeMs = Date.now() - startTime;
      return {
        isConnected: true,
        databaseName: config.dbName,
        pingTimeMs
      };
    } catch (err) {
      return {
        isConnected: false,
        databaseName: config.dbName,
        pingTimeMs: -1
      };
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
        console.log('[Database] MongoDB connection closed gracefully.');
      } catch (error) {
        console.error('[Database] Error closing MongoDB connection:', error);
      } finally {
        this.client = null;
        this.db = null;
      }
    }
  }
}

export const dbConnection = new DatabaseConnection();
