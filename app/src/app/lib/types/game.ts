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

// Pickban specific types
export interface PickbanConfig {
    seriesType: MatchFormat;
    currentGame: number;
    totalGames: number;
    isFearlessDraft: boolean;
    patchName: string;
    teams: {
        blue: {
            name: string;
            prefix?: string;
            coach?: Coach;
            logoUrl?: string;
        };
        red: {
            name: string;
            prefix?: string;
            coach?: Coach;
            logoUrl?: string;
        };
    };
    tournament?: {
        name: string;
        logoUrl?: string;
    };
    timers: {
        pickPhase: number;
        banPhase: number;
    };
}

export interface PickbanAction {
    id: string;
    type: ActionType;
    championId: number;
    teamSide: TeamSide;
    phase: GamePhase;
    timestamp: Date;
    undone?: boolean;
}

export interface PickbanSession {
    id: string;
    config: PickbanConfig;
    status: 'waiting' | 'active' | 'paused' | 'completed';
    currentPhase: GamePhase;
    currentTeam: TeamSide;
    turnNumber: number;
    timer: {
        remaining: number;
        totalTime: number;
        isActive: boolean;
        startedAt?: Date;
    };
    teams: {
        blue: Team;
        red: Team;
    };
    actions?: PickbanAction[];
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    createdBy: string;
    spectators?: string[];
}

export interface ChampSelectPlayer {
    cellId: number;
    championId: number;
    summonerId: number;
    summonerName: string;
    puuid: string;
    isBot: boolean;
    isActingNow: boolean;
    pickTurn: number;
    banTurn: number;
    team: number;
}

export interface ChampSelectAction {
    id: number;
    actorCellId: number;
    championId: number;
    completed: boolean;
    type: 'pick' | 'ban';
    isInProgress: boolean;
}

export interface ChampSelectTimer {
    adjustedTimeLeftInPhase: number;
    totalTimeInPhase: number;
    phase: string;
    isInfinite: boolean;
}

export interface ChampSelectSession {
    phase: string;
    timer: ChampSelectTimer;
    chatDetails: {
        chatRoomName: string;
        chatRoomPassword: string;
    };
    myTeam: ChampSelectPlayer[];
    theirTeam: ChampSelectPlayer[];
    trades: unknown[];
    actions: ChampSelectAction[][];
    bans: {
        myTeamBans: number[];
        theirTeamBans: number[];
    };
    localPlayerCellId: number;
    isSpectating: boolean;
}

export interface LCUStatus {
    connected: boolean;
    gameflowPhase?: string;
    inChampSelect?: boolean;
    currentSummoner?: {
        displayName: string;
        puuid: string;
        summonerId: number;
    };
    championSelectSession?: {
        timer: {
            adjustedTimeLeftInPhase: number;
            totalTimeInPhase: number;
            phase: string;
        };
        myTeam: Array<{
            championId: number;
            championPickIntent: number;
            summonerId: number;
            displayName: string;
        }>;
        theirTeam: Array<{
            championId: number;
            summonerId: number;
            displayName: string;
        }>;
        bans: {
            myTeamBans: number[];
            theirTeamBans: number[];
        };
    };
    lastUpdated: Date;
}
