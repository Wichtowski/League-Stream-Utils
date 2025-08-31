export type MatchFormat = "BO1" | "BO3" | "BO5";

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
  isFearlessDraft: boolean;
  patchName: string;

  // Scheduling
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;

  // Status and results
  status: MatchStatus;
  winner?: "blue" | "red";

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

export interface MatchCommentator {
  _id: string;
  name: string;
  role: "play-by-play" | "color" | "analyst";
  email?: string;
  phone?: string;
  assignedAt: Date;
}

export interface MatchPrediction {
  userId: string;
  username: string;
  prediction: "blue" | "red";
  confidence?: number;
  submittedAt: Date;
}

export interface GameResult {
  _id: string;
  gameNumber: number;
  winner: "blue" | "red";
  duration?: number;
  blueScore: number;
  redScore: number;
  blueTeam: string;
  redTeam: string;
  startTime?: Date;
  endTime?: Date;
  completedAt?: Date;
}

export type MatchStatus = "scheduled" | "in-progress" | "completed" | "cancelled";

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
  createdBy: string;
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
  matchId: string;
  assignedBy?: string;
}

export interface SubmitPredictionRequest {
  userId: string;
  username: string;
  prediction: "blue" | "red";
  confidence?: number;
}
