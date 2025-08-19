import { MatchFormat } from "./tournament";
import { Player, Champion } from "./game";
import { ImageStorage } from "./tournament";

export interface Match {
  id: string;
  name: string;
  type: "tournament" | "standalone";

  // Tournament context (only for tournament matches)
  tournamentId?: string;
  tournamentName?: string;
  tournamentLogo?: ImageStorage;
  bracketNodeId?: string;
  roundName?: string;
  matchNumber?: number;

  // Teams
  blueTeam: MatchTeam;
  redTeam: MatchTeam;

  // Match configuration
  format: MatchFormat;
  isFearlessDraft: boolean;
  patchName: string;

  // Scheduling
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;

  // Status and results
  status: MatchStatus;
  winner?: "blue" | "red";
  score: {
    blue: number;
    red: number;
  };

  // Game results (for BO3/BO5)
  games: GameResult[];

  // Commentators assigned to this match
  commentators: MatchCommentator[];

  // Predictions
  predictions: MatchPrediction[];

  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchTeam {
  id: string;
  name: string;
  tag: string;
  logo: ImageStorage;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  players: Player[];
  coach?: {
    name: string;
    profileImage?: string;
  };
}

export interface MatchCommentator {
  id: string;
  name: string;
  xHandle?: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface MatchPrediction {
  commentatorId: string;
  commentatorName: string;
  prediction: string;
  timestamp: Date;
}

export interface GameResult {
  id: string;
  gameNumber: number;
  winner: "blue" | "red";
  // Side mapping for this game: which match team played on each side
  blueSideTeamId: string; // should match Match.blueTeam.id
  redSideTeamId: string;  // should match Match.redTeam.id
  duration: number; // in seconds
  blueTeam: {
    kills: number;
    gold: number;
    towers: number;
    dragons: number;
    barons: number;
    bans: Champion[];
    picks: Champion[];
  };
  redTeam: {
    kills: number;
    gold: number;
    towers: number;
    dragons: number;
    barons: number;
    bans: Champion[];
    picks: Champion[];
  };
  completedAt: Date;
}

export type MatchStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

// API Request/Response types
export interface CreateMatchRequest {
  name: string;
  type: "tournament" | "standalone";
  tournamentId?: string;
  bracketNodeId?: string;
  blueTeamId: string;
  redTeamId: string;
  format: MatchFormat;
  isFearlessDraft: boolean;
  patchName: string;
  scheduledTime?: string;
  commentators?: string[]; // commentator IDs
}

export interface UpdateMatchRequest {
  name?: string;
  scheduledTime?: string;
  status?: MatchStatus;
  winner?: "blue" | "red";
  score?: { blue: number; red: number };
  commentators?: string[];
}

export interface AssignCommentatorRequest {
  commentatorId: string;
  assignedBy: string;
}

export interface SubmitPredictionRequest {
  prediction: string;
}
