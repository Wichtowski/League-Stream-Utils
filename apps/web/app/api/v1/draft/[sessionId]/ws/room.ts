import { createLogger } from "@lsu/logger";

const log = createLogger("draft-ws");

type WSClient = {
  ws: WebSocket;
  sessionId: string;
};

const sessions = new Map<string, Set<WSClient>>();

export function addClient(sessionId: string, ws: WebSocket): WSClient {
  const client: WSClient = { ws, sessionId };
  if (!sessions.has(sessionId)) sessions.set(sessionId, new Set());
  sessions.get(sessionId)!.add(client);
  log.info("client connected", { sessionId, clients: sessions.get(sessionId)!.size });

  return client;
}

export function removeClient(client: WSClient) {
  const room = sessions.get(client.sessionId);
  if (room) {
    room.delete(client);
    if (room.size === 0) sessions.delete(client.sessionId);
  }
  log.info("client disconnected", { sessionId: client.sessionId, clients: room?.size ?? 0 });
}

export function broadcast(sessionId: string, msg: Record<string, unknown>, exclude?: WSClient) {
  const room = sessions.get(sessionId);
  if (!room) return;
  const data = JSON.stringify(msg);
  for (const client of room) {
    if (client === exclude) continue;
    try {
      client.ws.send(data);
    } catch {
      removeClient(client);
    }
  }
}

export function getSessionClientCount(sessionId: string): number {
  return sessions.get(sessionId)?.size ?? 0;
}

export function getActiveSessionIds(): string[] {
  return Array.from(sessions.keys());
}

export function getTotalClientCount(): number {
  let total = 0;
  for (const room of sessions.values()) total += room.size;

  return total;
}
