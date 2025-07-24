import type { Champion, GameConfig } from './game';

export interface GameState {
    sessionId: string;
    teams: {
        blue: {
            name: string;
            bans: Champion[];
            picks: Champion[];
            isReady: boolean;
            prefix?: string;
            logoUrl?: string;
        };
        red: {
            name: string;
            bans: Champion[];
            picks: Champion[];
            isReady: boolean;
            prefix?: string;
            logoUrl?: string;
        };
    };
    phase: string;
    currentTurn: {
        team: 'blue' | 'red';
        type: 'pick' | 'ban';
        phase: string;
    } | null;
    turnNumber: number;
    totalTurns: number;
    timer: {
        remaining: number;
        totalTime: number;
        isActive: boolean;
    };
    bothTeamsReady: boolean;
    config?: GameConfig;
    seriesScore?: { blue: number; red: number };
    // Hover state for champion selection
    hoverState?: {
        blueTeam?: {
            hoveredChampionId: number | null;
            actionType: 'pick' | 'ban' | null;
        };
        redTeam?: {
            hoveredChampionId: number | null;
            actionType: 'pick' | 'ban' | null;
        };
    };
} 