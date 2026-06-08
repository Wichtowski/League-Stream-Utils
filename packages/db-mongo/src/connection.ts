import mongoose from "mongoose";

let cached = (global as Record<string, unknown>).__mongoConnection as
  | {
      conn: typeof mongoose | null;
      promise: Promise<typeof mongoose> | null;
    }
  | undefined;

if (!cached) {
  cached = { conn: null, promise: null };
  (global as Record<string, unknown>).__mongoConnection = cached;
}

export function isMongoConfigured(): boolean {
  return !!process.env.MONGODB_URI;
}

export async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(uri, {
      bufferCommands: false,
    } as mongoose.ConnectOptions);
  }

  cached!.conn = await cached!.promise;

  return cached!.conn;
}

export { default as mongoose } from "mongoose";
