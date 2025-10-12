import { ChampionStats } from "@lib/types/championStats";

export interface TournamentChampionStats {
  tournamentId: string;
  totalGames: number;
  totalMatches: number;
  lastUpdated: Date;
  championStats: ChampionStats[];
}

// Analytics Types
export interface TournamentAnalytics {
  tournamentId: string;
  totalMatches: number;
  totalGames: number;
  averageGameDuration: number;
  totalViewers: number;
  peakViewers: number;
  averageViewers: number;
  engagementRate: number;
  socialMediaMentions: number;
  revenue: number;
  costs: number;
  profit: number;
  roi: number;
}

export interface TournamentStats {
  tournamentId: string;
  totalTeams: number;
  registeredTeams: number;
  activeTeams: number;
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  totalGames: number;
  averageGameDuration: number;
  totalPrizePool: number;
  distributedPrizes: number;
  averageViewers: number;
  peakViewers: number;
  totalViewers: number;
  socialMediaReach: number;
  sponsorExposure: number;
  revenue: number;
  costs: number;
  profit: number;
  roi: number;
}
