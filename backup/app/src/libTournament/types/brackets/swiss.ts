export interface SwissRound {
  roundNumber: number;
  pairings: SwissPairing[];
  status: "pending" | "active" | "completed";
  startTime?: Date;
  endTime?: Date;
}

export interface SwissPairing {
  _id: string;
  team1Id: string;
  team2Id: string;
  team1Score?: number;
  team2Score?: number;
  winner?: string;
  status: "pending" | "in-progress" | "completed";
  scheduledTime?: Date;
  completedAt?: Date;
}

export interface SwissStandings {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  buchholz: number;
  sonnebornBerger: number;
  headToHead: number;
}

export interface SwissSettings {
  rounds: number;
  tiebreakers: ("buchholz" | "sonnebornBerger" | "headToHead")[];
  preventRematches: boolean;
  pairingMethod: "swiss" | "modified";
  cutToPlayoffs?: number; // Top N teams advance to playoffs
  playoffFormat?: "single-elimination" | "double-elimination";
}
