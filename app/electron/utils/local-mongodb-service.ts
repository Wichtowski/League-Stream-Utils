import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export interface LocalMongoDBStatus {
  isRunning: boolean;
  port: number;
  pid?: number;
}

export class LocalMongoDBService {
  private mongoServer: MongoMemoryServer | null = null;
  private port: number = 27017;
  private isStarting: boolean = false;
  private connectionString: string | null = null;
  private dataDirectory: string;

  constructor() {
    // Set up persistent data directory in %appdata%
    this.dataDirectory = path.join(app.getPath('userData'), 'mongodb-data');
    
    // Ensure the data directory exists
    if (!fs.existsSync(this.dataDirectory)) {
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }
  }

  async start(): Promise<void> {
    if (this.mongoServer || this.isStarting) {
      return;
    }

    this.isStarting = true;

    try {
      console.log('🚀 Starting MongoDB Memory Server with persistent storage...');
      console.log(`📁 Data directory: ${this.dataDirectory}`);
      
      // Create and start the MongoDB memory server with persistent storage
      this.mongoServer = await MongoMemoryServer.create({
        instance: {
          port: this.port,
          dbName: 'league-stream-utils',
          storageEngine: 'wiredTiger',
          args: [
            '--dbpath', this.dataDirectory,
            '--storageEngine', 'wiredTiger'
          ]
        },
        binary: {
          version: '7.0.0'
        }
      });

      // Get the connection string
      this.connectionString = this.mongoServer.getUri();
      console.log('✅ MongoDB Memory Server started successfully with persistent storage');
      
    } catch (error) {
      console.error('❌ Failed to start MongoDB Memory Server:', error);
      throw new Error('Failed to start local MongoDB. Please try again.');
    } finally {
      this.isStarting = false;
    }
  }

  async stop(): Promise<void> {
    if (this.mongoServer) {
      try {
        await this.mongoServer.stop();
        this.mongoServer = null;
        this.connectionString = null;
        console.log('🛑 MongoDB Memory Server stopped');
      } catch (error) {
        console.error('Error stopping MongoDB Memory Server:', error);
      }
    }
  }

  async getStatus(): Promise<LocalMongoDBStatus> {
    if (this.mongoServer && this.connectionString) {
      return {
        isRunning: true,
        port: this.port
      };
    }

    return {
      isRunning: false,
      port: this.port
    };
  }

  getConnectionString(): string {
    if (!this.connectionString) {
      throw new Error('MongoDB Memory Server not started');
    }
    return this.connectionString;
  }

  getDataDirectory(): string {
    return this.dataDirectory;
  }

  async waitForReady(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const status = await this.getStatus();
      if (status.isRunning) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('MongoDB Memory Server failed to start within 30 seconds');
  }

  async clearData(): Promise<void> {
    if (this.mongoServer) {
      await this.stop();
    }
    
    // Clear the data directory
    if (fs.existsSync(this.dataDirectory)) {
      fs.rmSync(this.dataDirectory, { recursive: true, force: true });
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }
    
    console.log('🗑️ MongoDB data cleared');
  }
}

export const localMongoDBService = new LocalMongoDBService();
