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
  patchName: string;

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
  xHandle?: string;
  instagramHandle?: string;
  twitchHandle?: string;
  assignedAt: Date;
  assignedBy: string;
}

export interface MatchPrediction {
  userId: string;
  username: string;
  prediction: "blue" | "red";
  blueScore?: number;
  redScore?: number;
  confidence?: number;
  submittedAt: Date;
}

export interface GameResult {
  _id: string;
  gameNumber: number;
  winner: "blue" | "red" | "ongoing";
  duration?: number;
  blueScore: number;
  redScore: number;
  blueTeam: string;
  redTeam: string;
  championsPlayed?: {
    [teamId: string]: { [playerId: string]: number };
  };
  startTime?: Date;
  endTime?: Date;
  completedAt?: Date;
}

export type MatchStatus = "scheduled" | "in-progress" | "ongoing" | "completed" | "cancelled";

export interface CreateMatchRequest {
  name: string;
  type: "tournament" | "standalone";
  tournamentId?: string;
  bracketNodeId?: string;
  blueTeamId: string;
  redTeamId: string;
  format: MatchFormat;
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
