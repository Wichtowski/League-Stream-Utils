import { NextRequest, NextResponse } from "next/server";
import { getGameSession, updateGameSession } from "@lib/game/game-logic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const resolvedParams = await params;
    const session = await getGameSession(resolvedParams.sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Update the session phase from 'config' to 'lobby'
    const updatedSession = await updateGameSession(resolvedParams.sessionId, {
      ...session,
      phase: "lobby"
    });

    return NextResponse.json({
      success: true,
      session: updatedSession
    });
  } catch (error) {
    console.error("Error starting match:", error);
    return NextResponse.json({ error: "Failed to start match" }, { status: 500 });
  }
}
