import { MatchFormat } from "./tournament";

export interface Champion {
    id: number;
    name: string;
    key: string;
    image: string;
}

export interface Coach {
    name: string;
    id?: string;
}

export interface Team {
    id: string;
    name: string;
    side: 'blue' | 'red';
    bans: Champion[];
    picks: Champion[];
    currentPick?: Champion;
    isReady: boolean;
    coach?: Coach;
    logoUrl?: string;
    usedChampions?: Champion[];
}

export interface GameConfig {
    seriesType: MatchFormat;
    currentGame: number;
    totalGames: number;
    isFearlessDraft: boolean;
    patchName: string;
    blueTeamName?: string;
    redTeamName?: string;
    blueTeamPrefix?: string;
    redTeamPrefix?: string;
    blueCoach?: Coach;
    redCoach?: Coach;
    blueTeamLogo?: string;
    redTeamLogo?: string;
    tournamentName?: string;
    tournamentLogo?: string;
}

export interface GameSession {
    id: string;
    teams: {
        blue: Team;
        red: Team;
    };
    phase: 'config' | 'lobby' | 'ban1' | 'pick1' | 'ban2' | 'pick2' | 'completed';
    currentTeam: 'blue' | 'red';
    turnNumber: number;
    createdAt: Date;
    lastActivity: Date;
    timer: {
        remaining: number;
        totalTime: number;
        isActive: boolean;
        startedAt?: Date;
    };
    bothTeamsReady: boolean;
    config: GameConfig;
    // series tracking
    gameHistory?: GameSession[];
    seriesScore?: { blue: number; red: number };
}

export type TeamSide = 'blue' | 'red';
export type ActionType = 'pick' | 'ban';
export type GamePhase = 'config' | 'lobby' | 'ban1' | 'pick1' | 'ban2' | 'pick2' | 'completed';
