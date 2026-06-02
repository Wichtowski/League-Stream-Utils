import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@lib/database/connection";

let isDatabaseInitialized = false;

export async function initializeDatabase(): Promise<void> {
  if (isDatabaseInitialized) {
    return;
  }

  try {
    console.log("🚀 Initializing database connection...");
    await connectToDatabase();
    isDatabaseInitialized = true;
    console.log("✅ Database connection initialized");
  } catch (error) {
    console.error("❌ Failed to initialize database connection:", error);
    throw error;
  }
}

export function withDatabaseInit(
  handler: (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params: Promise<Record<string, string>> }) => {
    try {
      await initializeDatabase();
      return handler(request, context);
    } catch (error) {
      console.error("Database initialization failed:", error);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }
  };
}

