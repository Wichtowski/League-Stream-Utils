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
  const configUrl = `${baseUrl}/modules/pickban/static/${session.id}/config`;
  const blueTeamUrl = `${baseUrl}/modules/pickban/static/${session.id}/game?team=blue`;
  const redTeamUrl = `${baseUrl}/modules/pickban/static/${session.id}/game?team=red`;
  const spectatorUrl = `${baseUrl}/modules/pickban/static/${session.id}/game`;
  const obsUrl = `${baseUrl}/modules/pickban/static/${session.id}/obs`;

  return NextResponse.json({
    sessionId: session.id,
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
