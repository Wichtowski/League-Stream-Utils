import { MongoMemoryServer } from 'mongodb-memory-server';

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

  constructor() {
    // No need to create data directory - mongodb-memory-server handles this
  }

  async start(): Promise<void> {
    if (this.mongoServer || this.isStarting) {
      return;
    }

    this.isStarting = true;

    try {
      console.log('🚀 Starting MongoDB Memory Server...');
      
      // Create and start the MongoDB memory server
      this.mongoServer = await MongoMemoryServer.create({
        instance: {
          port: this.port,
          dbName: 'league-stream-utils'
        }
      });

      // Get the connection string
      this.connectionString = this.mongoServer.getUri();
      console.log('✅ MongoDB Memory Server started successfully');
      
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
}

export const localMongoDBService = new LocalMongoDBService(); 