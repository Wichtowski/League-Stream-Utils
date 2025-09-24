import { MatchFormat } from "./match";
import { ImageStorage } from "./common";
import { Player } from "./game";
import { Ticker, EmbeddedTicker } from "@libTournament/types"
import { Sponsorship } from "@libTournament/types"

export type TournamentFormat = "Ladder" | "Swiss into Ladder" | "Round Robin into Ladder" | "Groups";

export interface PhaseMatchFormats {
  roundRobin?: MatchFormat; // For Round Robin phase
  swiss?: MatchFormat; // For Swiss phase
  groups?: MatchFormat; // For Group stage
  ladder?: MatchFormat; // For Ladder/Playoff phase
  semifinals?: MatchFormat; // For Semifinals
  finals?: MatchFormat; // For Finals
  default: MatchFormat;
}
export type TournamentStatus = "draft" | "registration" | "ongoing" | "completed" | "cancelled";
export type TeamTier = "amateur" | "semi-pro" | "professional";

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

export interface Staff {
  _id: string;
  name: string;
  role: "coach" | "analyst" | "manager";
  contact?: string;
}

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

export interface CreateTeamRequest {
  name: string;
  tag: string;
  logo: ImageStorage;
  colors: TeamColors;
  players: {
    main: Omit<Player, "_id" | "createdAt" | "updatedAt">[];
    substitutes: Omit<Player, "_id" | "createdAt" | "updatedAt">[];
  };
  staff?: {
    coach?: Omit<Staff, "_id">;
    analyst?: Omit<Staff, "_id">;
    manager?: Omit<Staff, "_id">;
  };
  region: string;
  tier: TeamTier;
  socialMedia?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  // Standalone team fields
  isStandalone?: boolean;
  tournamentId?: string;
}

export type UpdateTeamRequest = Partial<CreateTeamRequest> & {
  _id: string;
};

export const createDefaultTeamRequest = (): Partial<CreateTeamRequest> => {
  const result = {
    name: "",
    tag: "",
    logo: {
      type: "url" as const,
      url: "",
      format: "png" as const
    },
    colors: {
      primary: "#3B82F6",
      secondary: "#1E40AF",
      accent: "#F59E0B"
    },
    players: {
      main: [
        { role: "TOP" as const, inGameName: "", tag: "" },
        { role: "JUNGLE" as const, inGameName: "", tag: "" },
        { role: "MID" as const, inGameName: "", tag: "" },
        { role: "BOTTOM" as const, inGameName: "", tag: "" },
        { role: "SUPPORT" as const, inGameName: "", tag: "" }
      ],
      substitutes: []
    },
    region: "",
    tier: "amateur" as const,
    socialMedia: {
      twitter: "",
      discord: "",
      website: ""
    },
    isStandalone: true
  };

  return result;
};

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

// Champion Statistics for tournaments
export interface ChampionStats {
  championId: number;
  championName: string;
  championKey: string;
  image: string;

  totalPicks: number;
  totalBans: number;
  blueSidePicks: number;
  blueSideBans: number;
  redSidePicks: number;
  redSideBans: number;

  wins: number;
  losses: number;

  pickRate: number;
  banRate: number;
  presenceRate: number;

  roleDistribution: {
    TOP: number;
    JUNGLE: number;
    MID: number;
    BOTTOM: number;
    SUPPORT: number;
  };

  lastUpdated: Date;
}

export interface TournamentChampionStats {
  tournamentId: string;
  totalGames: number;
  totalMatches: number;
  lastUpdated: Date;
  championStats: ChampionStats[];
}

export interface GameResult {
  sessionId: string;
  tournamentId?: string;
  gameNumber: number;
  gameDuration?: number;
  patch: string;
  completedAt: Date;

  blueTeam: {
    teamId?: string;
    teamName: string;
    won: boolean;
    picks: {
      championId: number;
      role?: "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
      player?: string;
    }[];
    bans: number[];
  };

  redTeam: {
    teamId?: string;
    teamName: string;
    won: boolean;
    picks: {
      championId: number;
      role?: "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
      player?: string;
    }[];
    bans: number[];
  };
}

// Advanced Tournament Format Types
export type AdvancedTournamentFormat = "swiss" | "groups" | "league" | "hybrid";

export interface BracketSettings {
  type: "single" | "double";
  seeding: "manual" | "ranked" | "random";
  grandFinalReset: boolean;
  thirdPlaceMatch: boolean;
  autoAdvancement: boolean;
  bracketVisibility: "public" | "private" | "participants-only";
}

export interface SwissSettings {
  rounds: number;
  tiebreakers: ("buchholz" | "sonnebornBerger" | "headToHead")[];
  preventRematches: boolean;
  pairingMethod: "swiss" | "modified";
  cutToPlayoffs?: number; // Top N teams advance to playoffs
  playoffFormat?: "single-elimination" | "double-elimination";
}

export interface GroupSettings {
  groupCount: number;
  teamsPerGroup: number;
  roundRobin: boolean;
  advancePerGroup: number; // Teams advancing from each group
  playoffFormat: "single-elimination" | "double-elimination";
  groupNaming: "letters" | "numbers" | "custom";
  customGroupNames?: string[];
}

export interface LeagueSettings {
  seasonLength: number; // Number of weeks
  matchesPerWeek: number;
  playoffTeams: number;
  regularSeasonFormat: "round-robin" | "double-round-robin";
  playoffFormat: "single-elimination" | "double-elimination";
  splits?: number; // Multiple seasons per year
}

// Payment Integration Types
export interface PaymentConfig {
  stripeAccountId?: string;
  currency: string;
  processingFee: number;
  platformCommission: number;
  refundPolicy: string;
  paymentMethods: ("card" | "bank" | "paypal")[];
}

export interface PrizeDistribution {
  position: number; // 1st, 2nd, 3rd, etc.
  percentage: number; // Percentage of prize pool
  amount?: number; // Fixed amount (overrides percentage)
  description: string; // "1st Place", "Top 4", etc.
}

export interface StreamConfig {
  platform: "twitch" | "youtube" | "custom";
  channelUrl: string;
  embedCode?: string;
  autoStart: boolean;
  chatIntegration: boolean;
}


export interface BrandingConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo: ImageStorage;
  background?: ImageStorage;
  customCSS?: string;
  fontFamily?: string;
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

export interface AdvancedTournament extends Tournament {
  // Advanced format settings
  advancedFormat?: AdvancedTournamentFormat;
  bracketSettings?: BracketSettings;
  swissSettings?: SwissSettings;
  groupSettings?: GroupSettings;
  leagueSettings?: LeagueSettings;

  // Payment integration
  paymentConfig?: PaymentConfig;
  entryFee?: number;
  prizePool?: number;
  prizeDistribution?: PrizeDistribution[];
  paymentRequired: boolean;

  // Enhanced features
  streamIntegration?: StreamConfig;
  sponsorships?: Sponsorship[];
  customBranding?: BrandingConfig;

  // Advanced settings
  checkInRequired: boolean;
  checkInDeadline?: Date;
  latePenalty?: number; // Minutes before DQ
  discordIntegration?: {
    serverId: string;
    channelId: string;
    roleId: string;
  };

  // Analytics and reporting
  analytics?: TournamentAnalytics;
  reporting?: {
    autoGenerateReports: boolean;
    reportFrequency: "daily" | "weekly" | "end-of-tournament";
    customMetrics?: string[];
  };
}

export interface CreateAdvancedTournamentRequest extends CreateTournamentRequest {
  advancedFormat?: AdvancedTournamentFormat;
  bracketSettings?: BracketSettings;
  swissSettings?: SwissSettings;
  groupSettings?: GroupSettings;
  leagueSettings?: LeagueSettings;
  paymentConfig?: PaymentConfig;
  entryFee?: number;
  prizeDistribution?: PrizeDistribution[];
  streamIntegration?: StreamConfig;
  sponsorships?: Sponsorship[];
  customBranding?: BrandingConfig;
  checkInRequired?: boolean;
  checkInDeadline?: string;
  discordIntegration?: {
    serverId: string;
    channelId: string;
    roleId: string;
  };
}

// API Response Types
export interface BracketAPIResponse {
  bracket: BracketStructure;
  standings?: SwissStandings[];
  nextMatches?: BracketNode[];
  completedMatches?: BracketNode[];
}

export interface UpdateMatchResultRequest {
  matchId: string;
  winner: string;
  score: { blue: number; red: number };
  gameResults?: GameResult[];
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
