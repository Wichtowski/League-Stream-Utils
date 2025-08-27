import { NextRequest, NextResponse } from "next/server";
import { createGameSession, getAllSessions } from "@lib/game/game-logic";
import { cleanupOldSessions } from "@lib/database";

export async function GET(): Promise<NextResponse> {
  // Cleanup old sessions (24+ hours) before returning active ones
  try {
    await cleanupOldSessions(24);
  } catch (error) {
    console.error("Cleanup error during session fetch:", error);
    // Continue even if cleanup fails
  }

  const sessions = await getAllSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const session = await createGameSession(body.config);

  const baseUrl = request.nextUrl.origin;
  const sessionId = (session as unknown as { id: string }).id;
  const configUrl = `${baseUrl}/modules/pickban/static/${sessionId}/config`;
  const blueTeamUrl = `${baseUrl}/modules/pickban/static/${sessionId}/game?team=blue`;
  const redTeamUrl = `${baseUrl}/modules/pickban/static/${sessionId}/game?team=red`;
  const spectatorUrl = `${baseUrl}/modules/pickban/static/${sessionId}/game`;
  const obsUrl = `${baseUrl}/modules/pickban/static/${sessionId}/obs`;

  return NextResponse.json({
    sessionId,
    session,
    urls: {
      config: configUrl,
      blue: blueTeamUrl,
      red: redTeamUrl,
      spectator: spectatorUrl,
      obs: obsUrl
    }
  });
}
