import { PlayerRole } from "@lib/types";
import { Commentator, MatchPrediction } from "@libTournament/types";

export type MatchFormat = "BO1" | "BO3" | "BO5";

export interface PhaseMatchFormats {
  roundRobin?: MatchFormat; // For Round Robin phase
  swiss?: MatchFormat; // For Swiss phase
  groups?: MatchFormat; // For Group stage
  ladder?: MatchFormat; // For Ladder/Playoff phase
  semifinals?: MatchFormat; // For Semifinals
  finals?: MatchFormat; // For Finals
  default: MatchFormat;
}

export interface Match {
  _id: string;
  name: string;
  type: "tournament" | "standalone";

  // Tournament context (only for tournament matches)
  tournamentId?: string;
  bracketNodeId?: string;
  roundName?: string;
  matchNumber?: number;

  // Teams
  blueTeamId: string;
  redTeamId: string;

  // Match configuration
  format: MatchFormat;
  patchName: string;
  isFearlessDraft: boolean;

  // Scheduling
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;

  // Status and results
  status: MatchStatus;
  winner?: "blue" | "red";
  score?: { blue: number; red: number };

  // Game results (for BO3/BO5)
  games: GameResult[];

  // Commentators assigned to this match
  commentators: Commentator[];

  // Predictions
  predictions: MatchPrediction[];

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameResult {
  _id: string;
  sessionId?: string;
  tournamentId?: string;
  gameNumber: number;
  winner: "blue" | "red" | "ongoing";
  duration?: number;
  gameDuration?: number;
  patch?: string;
  blueScore: number;
  redScore: number;
  playerSwapOrder?: { [teamId: string]: string[] };
  blueTeam: string | {
    teamId?: string;
    teamName: string;
    won: boolean;
    picks: {
      championId: number;
      role?: PlayerRole;
      player?: string;
    }[];
    bans: number[];
  };
  redTeam: string | {
    teamId?: string;
    teamName: string;
    won: boolean;
    picks: {
      championId: number;
      role?: PlayerRole;
      player?: string;
    }[];
    bans: number[];
  };
  championsPlayed?: {
    [teamId: string]: { [playerId: string]: number };
  };
  startTime?: Date;
  endTime?: Date;
  completedAt?: Date;
}

export type MatchStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

export type {
  UpdateMatchResultRequest,
  CreateMatchRequest,
  AssignCommentatorRequest,
  SubmitPredictionRequest,
  UpdateMatchRequest
} from "./requests";
