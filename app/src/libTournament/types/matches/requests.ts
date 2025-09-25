import { MatchFormat, MatchStatus } from "@libTournament/types";
import { GameResult } from "@libTournament/types";

export interface CreateMatchRequest {
  name: string;
  type: "tournament" | "standalone";
  tournamentId?: string;
  bracketNodeId?: string;
  blueTeamId: string;
  redTeamId: string;
  format: MatchFormat;
  fearlessDraft: boolean;
  patchName: string;
  scheduledTime?: string;
  createdBy: string;
}

export interface UpdateMatchRequest {
  name?: string;
  scheduledTime?: string;
  status?: MatchStatus;
  format?: MatchFormat;
  winner?: "blue" | "red";
  score?: { blue: number; red: number };
  commentators?: string[];
}

export interface AssignCommentatorRequest {
  commentatorId: string;
  matchId: string;
  assignedBy?: string;
}

export interface SubmitPredictionRequest {
  userId: string;
  username: string;
  prediction: "blue" | "red";
  blueScore?: number;
  redScore?: number;
  confidence?: number;
}
  
export interface UpdateMatchResultRequest {
  matchId: string;
  winner: string;
  score: { blue: number; red: number };
  gameResults?: GameResult[];
}
