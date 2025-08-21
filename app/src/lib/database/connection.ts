import mongoose from "mongoose";
import { config } from "@lib/config";

const mongooseInstance = mongoose;

interface ConnectionState {
  isConnected: boolean;
  promise: Promise<typeof mongoose> | null;
}

const connection: ConnectionState = {
  isConnected: false,
  promise: null
};

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connectionPromise: Promise<typeof mongoose> | null = null;
  private eventListenersAttached: boolean = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  private attachEventListeners(): void {
    if (this.eventListenersAttached) {
      return;
    }

    mongooseInstance.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
      connection.isConnected = true;
    });

    mongooseInstance.connection.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
      connection.isConnected = false;
      this.connectionPromise = null;
    });

    mongooseInstance.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected - by event");
      connection.isConnected = false;
      this.connectionPromise = null;
    });

    mongooseInstance.connection.setMaxListeners(20);

    process.on("SIGINT", async () => {
      await this.disconnect();
      process.exit(0);
    });

    this.eventListenersAttached = true;
  }

  public async connect(): Promise<typeof mongoose> {
    if (connection.isConnected && mongooseInstance.connection.readyState === 1) {
      return mongooseInstance;
    }

    if (this.connectionPromise) {
      console.log("🔄 Database connection in progress, waiting...");
      return this.connectionPromise;
    }

    try {
      console.log("🚀 Creating new database connection...");

      const mongoUri = config.database.uri!;

      this.connectionPromise = mongooseInstance.connect(mongoUri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });

      const result = await this.connectionPromise;

      connection.isConnected = true;
      console.log("✅ Database connection established successfully");

      this.attachEventListeners();

      return result;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      connection.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (connection.isConnected) {
      await mongooseInstance.disconnect();
      connection.isConnected = false;
      this.connectionPromise = null;
      console.log("🔌 MongoDB disconnected - by method");
    }
  }

  public isConnected(): boolean {
    const connected = connection.isConnected && mongooseInstance.connection.readyState === 1;
    if (!connected && connection.isConnected) {
      console.log("⚠️ Connection state mismatch detected, resetting...");
      connection.isConnected = false;
      this.connectionPromise = null;
    }
    return connected;
  }

  public getConnectionState(): string {
    const states = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting"
    };
    return states[mongooseInstance.connection.readyState as keyof typeof states] || "unknown";
  }

  public getConnectionInfo(): { state: string; listeners: number; maxListeners: number } {
    return {
      state: this.getConnectionState(),
      listeners:
        mongooseInstance.connection.listenerCount("connected") +
        mongooseInstance.connection.listenerCount("error") +
        mongooseInstance.connection.listenerCount("disconnected"),
      maxListeners: mongooseInstance.connection.getMaxListeners()
    };
  }
}

const dbConnection = DatabaseConnection.getInstance();

export async function connectToDatabase(): Promise<typeof mongoose> {
  const result = await dbConnection.connect();

  return result;
}

export function isConnectionEstablished(): boolean {
  return dbConnection.isConnected();
}

export function getConnectionState(): string {
  return dbConnection.getConnectionState();
}

export function getConnectionInfo() {
  return dbConnection.getConnectionInfo();
}

export async function disconnectFromDatabase(): Promise<void> {
  return dbConnection.disconnect();
}

export { dbConnection };
