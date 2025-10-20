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
  EventID: number;
  EventName: string;
  EventTime: number;
  KillerName?: string;
  TurretKilled?: string;
  Assisters?: string[];
  InhibKilled?: string;
  Stolen?: "False" | "True";
  KillerTeam?: "ORDER" | "CHAOS";
  VictimName?: string;
  Acer?: string;
  AcingTeam?: "ORDER" | "CHAOS";
  KillStreak?: number;
  DragonType?: "Earth" | "Elder" | "Fire" | "Water" | "Air" | "Chemtech" | "Hextech";
}

export interface GameStatus {
  isInGame: boolean;
  gamePhase: string;
  gameTime: number;
  mapName: string;
}
