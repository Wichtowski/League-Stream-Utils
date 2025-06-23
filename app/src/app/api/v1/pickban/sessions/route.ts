import { NextRequest, NextResponse } from 'next/server';
import { createGameSession, getAllSessions } from '@lib/game-logic';
import { cleanupOldSessions } from '@lib/database';

export async function GET() {
  // Cleanup old sessions (24+ hours) before returning active ones
  try {
    await cleanupOldSessions(24);
  } catch (error) {
    console.error('Cleanup error during session fetch:', error);
    // Continue even if cleanup fails
  }
  
  const sessions = await getAllSessions();
  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  const session = await createGameSession();
  
  const baseUrl = request.nextUrl.origin;
  const configUrl = `${baseUrl}/modules/pickban/config/${session.id}`;
  const blueTeamUrl = `${baseUrl}/modules/pickban/game/${session.id}?team=blue`;
  const redTeamUrl = `${baseUrl}/modules/pickban/game/${session.id}?team=red`;
  const spectatorUrl = `${baseUrl}/modules/pickban/game/${session.id}`;
  const obsUrl = `${baseUrl}/modules/pickban/obs/${session.id}`;

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
