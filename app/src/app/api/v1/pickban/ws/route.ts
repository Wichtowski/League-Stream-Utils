import { WebSocketServer, WebSocket } from 'ws';
import {
    getGameSession,
    banChampion,
    pickChampion,
    getGameState,
    canTeamAct,
    setTeamReady,
    updateGameSession
} from '@lib/game/game-logic';
import type { WSMessage, TeamSide } from '@lib/types';

interface ExtendedWebSocket extends WebSocket {
    sessionId?: string;
    teamSide?: TeamSide;
}

// In-memory storage for WebSocket connections
const connections = new Map<string, Set<ExtendedWebSocket>>();

let wss: WebSocketServer | null = null;

function initWebSocketServer() {
    if (wss) return wss;

    wss = new WebSocketServer({
        port: 8080,
        verifyClient: () => true
    });

    wss.on('connection', (ws) => {
        console.log('New WebSocket connection');

        ws.on('message', async (data) => {
            try {
                const message: WSMessage = JSON.parse(data.toString());
                await handleWebSocketMessage(ws, message);
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
                ws.send(
                    JSON.stringify({
                        type: 'error',
                        payload: { message: 'Invalid message format' }
                    })
                );
            }
        });

        ws.on('close', () => {
            console.log('WebSocket connection closed');
            for (const [sessionId, sessionConnections] of connections.entries()) {
                sessionConnections.delete(ws);
                if (sessionConnections.size === 0) {
                    connections.delete(sessionId);
                }
            }
        });
    });

    return wss;
}

async function handleWebSocketMessage(ws: ExtendedWebSocket, message: WSMessage) {
    const { type, payload, sessionId, teamSide } = message;

    if (!sessionId) {
        ws.send(
            JSON.stringify({
                type: 'error',
                payload: { message: 'Session ID required' }
            })
        );
        return;
    }

    const session = await getGameSession(sessionId);
    if (!session) {
        ws.send(
            JSON.stringify({
                type: 'error',
                payload: { message: 'Session not found' }
            })
        );
        return;
    }

    switch (type) {
        case 'join':
            await handleJoinSession(ws, sessionId, teamSide);
            break;

        case 'ban':
            if (!teamSide || !payload.championId) {
                ws.send(
                    JSON.stringify({
                        type: 'error',
                        payload: { message: 'Team side and champion ID required for ban' }
                    })
                );
                return;
            }

            if (!canTeamAct(session, teamSide)) {
                ws.send(
                    JSON.stringify({
                        type: 'error',
                        payload: { message: 'Not your turn' }
                    })
                );
                return;
            }

            if (await banChampion(session, payload.championId, teamSide)) {
                await broadcastGameState(sessionId);
            } else {
                ws.send(
                    JSON.stringify({
                        type: 'error',
                        payload: { message: 'Invalid ban action' }
                    })
                );
            }
            break;

        case 'pick':
            if (!teamSide || !payload.championId) {
                ws.send(
                    JSON.stringify({
                        type: 'error',
                        payload: { message: 'Team side and champion ID required for pick' }
                    })
                );
                return;
            }

            if (!canTeamAct(session, teamSide)) {
                ws.send(
                    JSON.stringify({
                        type: 'error',
                        payload: { message: 'Not your turn' }
                    })
                );
                return;
            }

            if (await pickChampion(session, payload.championId, teamSide)) {
                await broadcastGameState(sessionId);
            } else {
                ws.send(
                    JSON.stringify({
                        type: 'error',
                        payload: { message: 'Invalid pick action' }
                    })
                );
            }
            break;

        case 'hover':
            if (!teamSide || !payload.championId || !payload.actionType) {
                ws.send(
                    JSON.stringify({
                        type: 'error',
                        payload: {
                            message: 'Team side, champion ID, and action type required for hover'
                        }
                    })
                );
                return;
            }

            // Update hover state in the session
            if (!session.hoverState) {
                session.hoverState = {};
            }

            session.hoverState[`${teamSide}Team`] = {
                hoveredChampionId: payload.championId,
                actionType: payload.actionType
            };

            // Save the session to persist hover state
            await updateGameSession(sessionId, { hoverState: session.hoverState });

            // Broadcast updated game state to all clients
            await broadcastGameState(sessionId);
            break;

        case 'ready':
            if (!teamSide) {
                ws.send(
                    JSON.stringify({
                        type: 'error',
                        payload: { message: 'Team side required for ready action' }
                    })
                );
                return;
            }

            const readyResult = await setTeamReady(session, teamSide, payload.ready || false);
            if (readyResult) {
                await broadcastGameState(sessionId);
            } else {
                ws.send(
                    JSON.stringify({
                        type: 'error',
                        payload: { message: 'Failed to set ready state' }
                    })
                );
            }
            break;

        default:
            ws.send(
                JSON.stringify({
                    type: 'error',
                    payload: { message: 'Unknown message type' }
                })
            );
    }
}

async function handleJoinSession(ws: ExtendedWebSocket, sessionId: string, teamSide?: TeamSide) {
    if (!connections.has(sessionId)) {
        connections.set(sessionId, new Set());
    }

    connections.get(sessionId)!.add(ws);

    // Store team info on the websocket
    ws.sessionId = sessionId;
    ws.teamSide = teamSide;

    // Send current game state
    const session = await getGameSession(sessionId);
    if (session) {
        ws.send(
            JSON.stringify({
                type: 'gameState',
                payload: getGameState(session)
            })
        );
    }
}

async function broadcastGameState(sessionId: string) {
    const session = await getGameSession(sessionId);
    if (!session) return;

    const gameState = getGameState(session);
    const message = JSON.stringify({
        type: 'gameState',
        payload: gameState
    });

    const sessionConnections = connections.get(sessionId);
    if (sessionConnections) {
        sessionConnections.forEach((ws) => {
            if (ws.readyState === 1) {
                // WebSocket.OPEN
                ws.send(message);
            }
        });
    }
}

export async function GET() {
    // Initialize WebSocket server on first request
    initWebSocketServer();

    return new Response('WebSocket server running on port 8080', {
        status: 200,
        headers: {
            'Content-Type': 'text/plain'
        }
    });
}
