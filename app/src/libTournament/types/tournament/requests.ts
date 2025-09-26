import { MatchFormat } from "@libTournament/types/matches";
import { TournamentFormat } from "./index";
import { PhaseMatchFormats } from "@libTournament/types/matches";
import { ImageStorage } from "@lib/types/common";
import { Sponsorship, Ticker } from "@libTournament/types";
import { CreateTeamRequest } from "@libTeam/types/team/requests";
import { BracketNode, BracketStructure } from "@libTournament/types/brackets";
import { SwissStandings } from "@libTournament/types/brackets/swiss";

// API Request/Response types
export interface CreateTournamentRequest {
  name: string;
  abbreviation: string;
  startDate: string;
  endDate: string;
  requireRegistrationDeadline: boolean;
  registrationDeadline?: string;
  matchFormat: MatchFormat;
  tournamentFormat: TournamentFormat;
  phaseMatchFormats?: PhaseMatchFormats;
  maxTeams: number;
  prizePool?: number;
  fearlessDraft: boolean;
  logo: ImageStorage;
  selectedTeams: string[];
  timezone: string;
  matchDays: string[];
  defaultMatchTime: string;
  streamUrl?: string;
  broadcastLanguage?: string;
  apiVersion?: string;
  patchVersion?: string;
  sponsors?: Sponsorship[];
  ticker?: Ticker;
}

export type UpdateTeamRequest = Partial<CreateTeamRequest> & {
  _id: string;
};

// API Response Types
export interface BracketAPIResponse {
  bracket: BracketStructure;
  standings?: SwissStandings[];
  nextMatches?: BracketNode[];
  completedMatches?: BracketNode[];
}
