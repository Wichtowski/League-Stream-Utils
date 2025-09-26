import { MatchFormat } from "@libTournament/types/matches";
import { TournamentFormat } from "./";

export interface TournamentTemplate {
  _id: string;
  name: string;
  description: string;
  matchFormat: MatchFormat;
  tournamentFormat: TournamentFormat;
  maxTeams: number;
  isActive: boolean;
  createdAt: Date;
}
