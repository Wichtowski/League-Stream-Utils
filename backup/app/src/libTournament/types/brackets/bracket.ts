export interface BracketSettings {
  type: "single" | "double";
  seeding: "manual" | "ranked" | "random";
  grandFinalReset: boolean;
  thirdPlaceMatch: boolean;
  autoAdvancement: boolean;
  bracketVisibility: "public" | "private" | "participants-only";
}

// Bracket System Types
export interface BracketNode {
  _id: string;
  round: number;
  position: number;
  team1?: string; // Team ID
  team2?: string; // Team ID
  winner?: string; // Team ID
  score1?: number;
  score2?: number;
  status: "pending" | "in-progress" | "completed";
  scheduledTime?: Date;
  completedAt?: Date;
  nextMatchId?: string; // Where winner advances
  loserNextMatchId?: string; // For double elimination
  bracketType: "winner" | "loser" | "grand-final";
}

export interface BracketStructure {
  _id: string;
  tournamentId: string;
  format: "single-elimination" | "double-elimination";
  nodes: BracketNode[];
  metadata: {
    totalRounds: number;
    teamsCount: number;
    currentRound: number;
    status: "setup" | "active" | "completed";
  };
  createdAt: Date;
  updatedAt: Date;
}

// Legacy Bracket Type (for backward compatibility)
export interface Bracket {
  _id: string;
  tournamentId: string;
  format: "single-elimination" | "double-elimination";
  nodes: BracketNode[];
  metadata: {
    totalRounds: number;
    teamsCount: number;
    currentRound: number;
    status: "setup" | "active" | "completed";
  };
  createdAt: Date;
  updatedAt: Date;
}
