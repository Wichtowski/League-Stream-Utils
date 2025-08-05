import { NextRequest, NextResponse } from "next/server";
import { updateGameConfig, getGameSession } from "@lib/game/game-logic";
import { GameConfig } from "@lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const resolvedParams = await params;
    const session = await getGameSession(resolvedParams.sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      config: session.config,
    });
  } catch (error) {
    console.error("Error loading configuration:", error);
    return NextResponse.json(
      { error: "Failed to load configuration" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const resolvedParams = await params;
    const { config }: { config: Partial<GameConfig> } = await req.json();

    const updatedSession = await updateGameConfig(
      resolvedParams.sessionId,
      config,
    );

    if (!updatedSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating configuration:", error);
    return NextResponse.json(
      { error: "Failed to update configuration" },
      { status: 500 },
    );
  }
}
