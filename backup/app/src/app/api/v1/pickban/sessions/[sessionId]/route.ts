import { NextRequest, NextResponse } from "next/server";
import { deleteGameSession, getGameSession } from "@lib/database";
import { withAuth } from "@lib/auth";
import type { JWTPayload } from "@lib/types/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getGameSession(resolvedParams.sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error loading session:", error);
    return NextResponse.json({ error: "Failed to load session" }, { status: 500 });
  }
}

export const DELETE = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    // Extract sessionId from the URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const sessionId = pathParts[pathParts.length - 1]; // Last part of the path

    // Verify admin access
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Delete the session
    const deleted = await deleteGameSession(sessionId);

    if (!deleted) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
});
