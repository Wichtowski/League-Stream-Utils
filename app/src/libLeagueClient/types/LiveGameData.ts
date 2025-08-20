import { LivePlayer } from "./";

export interface LiveGameData {
    gameData: {
      gameMode: string;
      mapName: string;
      gameTime: number;
      gameLength: number;
      gameStartTime: number;
    };
    allPlayers: LivePlayer[];
    events: GameEvent[];
}

export interface GameEvent {
    EventName: string;
    EventTime: number;
    KillerName?: string;
    KillerTeam?: "ORDER" | "CHAOS";
    VictimName?: string;
    VictimTeam?: "ORDER" | "CHAOS";
    Position?: {
        x: number;
        y: number;
    };
}

export interface GameStatus {
    isInGame: boolean;
    gamePhase: string;
    gameTime: number;
    mapName: string;
}