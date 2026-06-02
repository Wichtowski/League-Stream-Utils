import { ImageStorage } from "@lib/types/common";
import { MatchFormat, PhaseMatchFormats } from "@libTournament/types/matches";
import { Sponsorship } from "@libTournament/types/sponsors";
import { EmbeddedTicker } from "@libTournament/types/ticker";

export type TournamentFormat = "Ladder" | "Swiss into Ladder" | "Round Robin into Ladder" | "Groups";
export type TournamentStatus = "registration" | "ongoing" | "completed" | "cancelled";

export interface Tournament {
  _id: string;
  name: string;
  abbreviation: string;

  // Dates
  startDate: Date;
  endDate: Date;
  requireRegistrationDeadline: boolean;
  registrationDeadline?: Date;

  // Format & Rules
  matchFormat: MatchFormat;
  tournamentFormat: TournamentFormat;
  phaseMatchFormats?: PhaseMatchFormats; // Advanced match formats for different phases

  // Settings
  maxTeams: number;
  registrationOpen: boolean;
  prizePool?: number;
  fearlessDraft: boolean;
  apiVersion?: string;
  patchVersion?: string;
  // Visual
  logo: ImageStorage;

  // Teams
  registeredTeams: string[]; // Team IDs
  selectedTeams: string[]; // Teams chosen by organizer

  // Tournament state
  status: TournamentStatus;

  // Matches
  matches?: string[];

  // Advanced settings
  allowSubstitutes: boolean;
  maxSubstitutes: number;

  // Scheduling
  timezone: string;
  matchDays: string[]; // ['monday', 'wednesday', 'friday']
  defaultMatchTime: string; // '19:00'

  // Broadcasting
  broadcastLanguage?: string;

  // Sponsors
  sponsors?: Sponsorship[];

  // Ticker
  ticker?: EmbeddedTicker;

  // Ownership & timestamps
  userId: string; // Tournament organizer
  createdAt: Date;
  updatedAt: Date;
}

export type { TournamentForm } from "./forms";
export type { CreateTournamentRequest } from "./requests";
