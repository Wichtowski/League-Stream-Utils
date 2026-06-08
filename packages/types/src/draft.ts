import type { Coach, ImageStorage, Team } from "./team";
import type { TournamentFormat } from "./tournament";

export type GamePhase =
  | "config"
  | "lobby"
  | "ban1"
  | "pick1"
  | "ban2"
  | "pick2"
  | "finalization"
  | "completed";

export type TeamSide = "blue" | "red";
export type ActionType = "pick" | "ban";
export type SessionType = "static" | "lcu" | "tournament" | "web";
export type SessionStatus = "waiting" | "active" | "paused" | "completed";

export interface DraftAction {
  id: string;
  type: ActionType;
  championId: number;
  teamSide: TeamSide;
  phase: GamePhase;
  timestamp: Date;
  undone?: boolean;
}

export interface DraftTimer {
  remaining: number;
  totalTime: number;
  isActive: boolean;
  startedAt?: Date;
}

export interface DraftConfig {
  seriesType: TournamentFormat;
  currentGame: number;
  totalGames: number;
  isFearlessDraft: boolean;
  patchName: string;
  teams: {
    blue: { name: string; prefix?: string; coach?: Coach; logoUrl?: string };
    red: { name: string; prefix?: string; coach?: Coach; logoUrl?: string };
  };
  tournament?: {
    id: string;
    name: string;
    logo?: ImageStorage;
    matchInfo?: {
      roundName?: string;
      matchNumber?: number;
      bestOf: number;
      blueTeamScore?: number;
      redTeamScore?: number;
    };
  };
  timers: { pickPhase: number; banPhase: number };
}

export interface DraftSession {
  id: string;
  type?: SessionType;
  config: DraftConfig;
  status: SessionStatus;
  currentPhase: GamePhase;
  currentTeam: TeamSide;
  turnNumber: number;
  timer: DraftTimer;
  teams: { blue: Team; red: Team };
  actions?: DraftAction[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  password?: string;
}
