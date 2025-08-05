import mongoose from "mongoose";
import { config } from "@lib/config";

interface ConnectionState {
  isConnected: boolean;
  promise: Promise<typeof mongoose> | null;
}

const connection: ConnectionState = {
  isConnected: false,
  promise: null,
};

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connectionPromise: Promise<typeof mongoose> | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<typeof mongoose> {
    if (connection.isConnected && mongoose.connection.readyState === 1) {
      return mongoose;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    try {
      const mongoUri = config.database.uri!;

      this.connectionPromise = mongoose.connect(mongoUri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      const mongooseInstance = await this.connectionPromise;

      connection.isConnected = true;

      // Handle connection events
      mongoose.connection.on("connected", () => {
        console.log("✅ MongoDB connected successfully");
        connection.isConnected = true;
      });

      mongoose.connection.on("error", (error) => {
        console.error("❌ MongoDB connection error:", error);
        connection.isConnected = false;
        this.connectionPromise = null;
      });

      mongoose.connection.on("disconnected", () => {
        console.warn("⚠️ MongoDB disconnected - by event");
        connection.isConnected = false;
        this.connectionPromise = null;
      });

      process.on("SIGINT", async () => {
        await this.disconnect();
        process.exit(0);
      });

      return mongooseInstance;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      connection.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (connection.isConnected) {
      await mongoose.disconnect();
      connection.isConnected = false;
      this.connectionPromise = null;
      console.log("🔌 MongoDB disconnected - by method");
    }
  }

  public isConnected(): boolean {
    return connection.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionState(): string {
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };
    return (
      states[mongoose.connection.readyState as keyof typeof states] || "unknown"
    );
  }
}

// Export singleton instance and convenience functions
const dbConnection = DatabaseConnection.getInstance();

export async function connectToDatabase(): Promise<typeof mongoose> {
  return dbConnection.connect();
}

export function isConnectionEstablished(): boolean {
  return dbConnection.isConnected();
}

export function getConnectionState(): string {
  return dbConnection.getConnectionState();
}

export async function disconnectFromDatabase(): Promise<void> {
  return dbConnection.disconnect();
}

export { dbConnection };
