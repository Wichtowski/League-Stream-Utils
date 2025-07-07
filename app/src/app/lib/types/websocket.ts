import type { GameConfig } from './game';
import type { GameState } from './ui';

// Re-export GameState for convenience
export type { GameState };

export interface WSMessagePayload {
    championId?: number;
    ready?: boolean;
    gameState?: GameState;
    message?: string;
    config?: GameConfig;
    remaining?: number;
    totalTime?: number;
    isActive?: boolean;
    actionType?: 'pick' | 'ban';
}

export interface WSMessage {
    type: 'join' | 'ban' | 'pick' | 'hover' | 'gameState' | 'error' | 'teamUpdate' | 'ready' | 'timerUpdate' | 'configUpdate';
    payload: WSMessagePayload;
    sessionId?: string;
    teamSide?: 'blue' | 'red';
} 