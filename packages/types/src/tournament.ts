import type { ImageStorage, Team } from './team';

export type TournamentFormat = 'bo1' | 'bo3' | 'bo5';
export type TournamentType = 'ladder' | 'swiss' | 'round_robin' | 'groups';
export type TournamentStatus = 'draft' | 'registration' | 'active' | 'completed' | 'cancelled';
export type MatchStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  format: TournamentFormat;
  status: TournamentStatus;
  logo?: ImageStorage;
  description?: string;
  registeredTeams: Team[];
  organizerId: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  tournamentId: string;
  blueTeamId: string;
  redTeamId: string;
  format: TournamentFormat;
  status: MatchStatus;
  score: { blue: number; red: number };
  roundName?: string;
  matchNumber?: number;
  scheduledAt?: Date;
  completedAt?: Date;
}

export interface Bracket {
  id: string;
  tournamentId: string;
  rounds: BracketRound[];
}

export interface BracketRound {
  roundNumber: number;
  name: string;
  matches: Match[];
}
