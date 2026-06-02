import type { NextRequest } from 'next/server';
import { getSession } from '@lsu/draft/queries';
import { getPhaseForTurn, getTeamForTurn } from '@lsu/draft';
import { addClient, removeClient, broadcast } from './room';
import { createLogger } from '@lsu/logger';

const log = createLogger('draft-ws');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const upgradeHeader = request.headers.get('upgrade');
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  const { 0: clientWs, 1: serverWs } = new (globalThis as any).WebSocketPair();

  serverWs.accept();

  const client = addClient(sessionId, serverWs);

  const turnNumber = session.turnNumber ?? 0;
  serverWs.send(
    JSON.stringify({
      type: 'state',
      phase: getPhaseForTurn(turnNumber),
      team: getTeamForTurn(turnNumber),
      turnNumber,
      actions: session.actions ?? [],
      timer: session.timer ?? { remaining: 30, totalTime: 30, isActive: false },
    }),
  );

  serverWs.addEventListener('message', async (event: MessageEvent) => {
    try {
      const msg = JSON.parse(typeof event.data === 'string' ? event.data : '');
      log.debug('ws message', { sessionId, type: msg.type });

      if (msg.type === 'action') {
        broadcast(sessionId, {
          type: 'action',
          action: msg.action,
          phase: msg.phase,
          team: msg.team,
          turnNumber: msg.turnNumber,
          timer: msg.timer,
        });
      }
    } catch {
      log.warn('malformed ws message', { sessionId });
    }
  });

  serverWs.addEventListener('close', () => {
    removeClient(client);
  });

  serverWs.addEventListener('error', () => {
    removeClient(client);
  });

  return new Response(null, { status: 101, webSocket: clientWs } as any);
}
