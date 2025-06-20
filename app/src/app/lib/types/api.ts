import type { GameSession } from './game';

export interface SessionUrls {
    blue: string;
    red: string;
    spectator: string;
    config: string;
    obs: string;
    sessionId: string;
}

export interface SessionResponse {
    sessionId: string;
    session: GameSession;
    urls: SessionUrls;
} 