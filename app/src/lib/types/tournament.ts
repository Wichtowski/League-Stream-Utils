import { Player } from "./game";
import { PlayerRole } from "./common";

export type MatchFormat = 'BO1' | 'BO3' | 'BO5';
export type TournamentFormat = 'Ladder' | 'Swiss into Ladder' | 'Round Robin into Ladder' | 'Groups';

export interface PhaseMatchFormats {
    roundRobin?: MatchFormat;     // For Round Robin phase
    swiss?: MatchFormat;          // For Swiss phase
    groups?: MatchFormat;         // For Group stage
    ladder?: MatchFormat;         // For Ladder/Playoff phase
    semifinals?: MatchFormat;     // For Semifinals
    finals?: MatchFormat;         // For Finals
    default: MatchFormat;
}
export type TournamentStatus = 'draft' | 'registration' | 'ongoing' | 'completed' | 'cancelled';
export type TeamTier = 'amateur' | 'semi-pro' | 'professional';

export type ImageStorage =
  | {
      type: 'upload';
      data: string; // base64 string
      size: number;
      format: 'png' | 'jpg' | 'webp';
      url?: never;
    }
  | {
      type: 'url';
      url: string; // external or CDN url
      size?: number;
      format?: 'png' | 'jpg' | 'webp';
      data?: never;
    };

export interface TournamentTemplate {
    id: string;
    name: string;
    description: string;
    logo: ImageStorage;
}

export interface Staff {
    id: string;
    name: string;
    role: 'coach' | 'analyst' | 'manager';
    contact?: string;
}

export interface Tournament {
    id: string;
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
    streamUrl?: string;
    broadcastLanguage?: string;

    // Sponsors
    sponsors?: Sponsorship[];

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
    sponsors?: Sponsorship[];
}

export interface TeamColors {
    primary: string;
    secondary: string;
    accent: string;
}

export interface CreateTeamRequest {
    name: string;
    tag: string;
    logo: ImageStorage;
    colors: TeamColors;
    players: {
        main: Omit<Player, 'id' | 'createdAt' | 'updatedAt' | 'verified' | 'verifiedAt'>[];
        substitutes: Omit<Player, 'id' | 'createdAt' | 'updatedAt' | 'verified' | 'verifiedAt'>[];
    };
    staff?: {
        coach?: Omit<Staff, 'id'>;
        analyst?: Omit<Staff, 'id'>;
        manager?: Omit<Staff, 'id'>;
    };
    region: string;
    tier: TeamTier;
    socialMedia?: {
        twitter?: string;
        discord?: string;
        website?: string;
    };
}

export type UpdateTeamRequest = Partial<CreateTeamRequest> & {
    id: string;
    logo?: ImageStorage;
};

export const createDefaultTeamRequest = (): Partial<CreateTeamRequest> => ({
  name: '',
  tag: '',
  colors: {
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#FFFFFF'
  },
  players: {
    main: [
      { role: 'TOP', inGameName: '', tag: '' },
      { role: 'JUNGLE', inGameName: '', tag: '' },
      { role: 'MID', inGameName: '', tag: '' },
      { role: 'ADC', inGameName: '', tag: '' },
      { role: 'SUPPORT', inGameName: '', tag: '' }
    ],
    substitutes: []
  },
  region: '',
  tier: 'amateur',
  logo: {
    type: 'url',
    url: '',
    format: 'png'
  }
});

// Riot API integration types
export interface RiotPlayerData {
    puuid: string;
    summonerLevel: number;
    rank: string;
    tier: string;
    leaguePoints: number;
    wins: number;
    losses: number;
}

export interface PlayerVerificationResult {
    player: Player;
    success: boolean;
    riotData?: RiotPlayerData;
    error?: string;
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
        ADC: number;
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

    topPicks: ChampionStats[];
    topBans: ChampionStats[];
    topPresence: ChampionStats[];

    blueSidePriority: ChampionStats[];
    redSidePriority: ChampionStats[];
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
        picks: Array<{
            championId: number;
            role?: PlayerRole;
            player?: string;
        }>;
        bans: number[];
    };
    redTeam: {
        teamId?: string;
        teamName: string;
        won: boolean;
        picks: Array<{
            championId: number;
            role?: PlayerRole;
            player?: string;
        }>;
        bans: number[];
    };
}

// Phase 3: Advanced Tournament Formats
export type AdvancedTournamentFormat =
    | 'single-elimination'
    | 'double-elimination'
    | 'swiss-system'
    | 'group-stage-playoffs'
    | 'league-season'
    | TournamentFormat; // Include existing formats

export interface BracketSettings {
    type: 'single' | 'double';
    seeding: 'manual' | 'ranked' | 'random';
    grandFinalReset: boolean;
    thirdPlaceMatch: boolean;
    autoAdvancement: boolean;
    bracketVisibility: 'public' | 'private' | 'participants-only';
}

export interface SwissSettings {
    rounds: number;
    tiebreakers: ('buchholz' | 'sonnebornBerger' | 'headToHead')[];
    preventRematches: boolean;
    pairingMethod: 'swiss' | 'modified';
    cutToPlayoffs?: number; // Top N teams advance to playoffs
    playoffFormat?: 'single-elimination' | 'double-elimination';
}

export interface GroupSettings {
    groupCount: number;
    teamsPerGroup: number;
    roundRobin: boolean;
    advancePerGroup: number; // Teams advancing from each group
    playoffFormat: 'single-elimination' | 'double-elimination';
    groupNaming: 'letters' | 'numbers' | 'custom';
    customGroupNames?: string[];
}

export interface LeagueSettings {
    seasonLength: number; // Number of weeks
    matchesPerWeek: number;
    playoffTeams: number;
    regularSeasonFormat: 'round-robin' | 'double-round-robin';
    playoffFormat: 'single-elimination' | 'double-elimination';
    splits?: number; // Multiple seasons per year
}

// Payment Integration Types
export interface PaymentConfig {
    stripeAccountId?: string;
    currency: string;
    processingFee: number;
    platformCommission: number;
    refundPolicy: string;
    paymentMethods: ('card' | 'bank' | 'paypal')[];
}

export interface PrizeDistribution {
    position: number; // 1st, 2nd, 3rd, etc.
    percentage: number; // Percentage of prize pool
    amount?: number; // Fixed amount (overrides percentage)
    description: string; // "1st Place", "Top 4", etc.
}

export interface StreamConfig {
    platform: 'twitch' | 'youtube' | 'custom';
    channelUrl: string;
    embedCode?: string;
    autoStart: boolean;
    chatIntegration: boolean;
}

export interface Sponsorship {
    id: string;
    name: string;
    logo: ImageStorage;
    website?: string;
    tier: 'title' | 'presenting' | 'official' | 'partner';
    displayPriority: number;
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
    id: string;
    round: number;
    position: number;
    team1?: string; // Team ID
    team2?: string; // Team ID
    winner?: string; // Team ID
    score1?: number;
    score2?: number;
    status: 'pending' | 'in-progress' | 'completed';
    scheduledTime?: Date;
    completedAt?: Date;
    nextMatchId?: string; // Where winner advances
    loserNextMatchId?: string; // For double elimination
    bracketType: 'winner' | 'loser' | 'grand-final';
}

export interface BracketStructure {
    id: string;
    tournamentId: string;
    format: 'single-elimination' | 'double-elimination';
    nodes: BracketNode[];
    metadata: {
        totalRounds: number;
        teamsCount: number;
        currentRound: number;
        status: 'setup' | 'active' | 'completed';
    };
    createdAt: Date;
    updatedAt: Date;
}

// Swiss System Types
export interface SwissRound {
    roundNumber: number;
    pairings: SwissPairing[];
    status: 'pending' | 'active' | 'completed';
    startTime?: Date;
    endTime?: Date;
}

export interface SwissPairing {
    id: string;
    team1: string; // Team ID
    team2: string; // Team ID
    result?: {
        winner: string; // Team ID
        score1: number;
        score2: number;
        completedAt: Date;
    };
    tableNumber?: number;
    status: 'pending' | 'in-progress' | 'completed';
}

export interface SwissStandings {
    teamId: string;
    points: number;
    wins: number;
    losses: number;
    draws: number;
    buchholzScore?: number;
    sonnebornBergerScore?: number;
    opponents: string[]; // Team IDs they've played
    tiebreakScore: number;
}

// Enhanced Tournament Interface
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
        roleId?: string;
    };

    // Professional features
    isPublic: boolean;
    featured: boolean;
    verified: boolean; // Platform verified tournament
    tier: 'amateur' | 'semi-pro' | 'professional';
}

// API Request/Response types for Advanced Tournaments
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
        roleId?: string;
    };
    tier?: 'amateur' | 'semi-pro' | 'professional';
}

// Bracket API Types
export interface BracketAPIResponse {
    bracket: BracketStructure;
    standings?: SwissStandings[];
    nextMatches?: BracketNode[];
    completedMatches?: BracketNode[];
}

export interface UpdateMatchResultRequest {
    matchId: string;
    winner: string; // Team ID
    score1: number;
    score2: number;
    forfeit?: boolean;
    notes?: string;
}

// Statistics and Analytics Types
export interface TournamentAnalytics {
    tournamentId: string;
    totalParticipants: number;
    totalMatches: number;
    averageMatchDuration: number;
    popularTimes: { hour: number; matches: number }[];
    teamPerformance: {
        teamId: string;
        wins: number;
        losses: number;
        averageGameTime: number;
        championPicks: { champion: string; count: number }[];
    }[];
    prizePoolDistribution?: {
        totalPool: number;
        platformFee: number;
        organizerShare: number;
        prizes: { position: number; amount: number }[];
    };
}

// Additional types for contexts
export interface TournamentStats {
    tournamentId: string;
    totalParticipants: number;
    totalMatches: number;
    completedMatches: number;
    averageMatchDuration?: number;
    championStats: ChampionStats[];
    teamStats: {
        teamId: string;
        teamName: string;
        wins: number;
        losses: number;
        totalGames: number;
        winRate: number;
        averageGameTime?: number;
        favoriteChampions: ChampionStats[];
    }[];
    timeline: {
        date: Date;
        matchesPlayed: number;
        cumulativeMatches: number;
    }[];
    lastUpdated: Date;
}

export interface Bracket {
    id: string;
    tournamentId: string;
    type: 'single-elimination' | 'double-elimination' | 'swiss' | 'round-robin';
    structure: BracketStructure | SwissRound[] | unknown; // Different structure per type
    currentRound: number;
    totalRounds: number;
    status: 'setup' | 'active' | 'completed';
    settings: BracketSettings | SwissSettings | GroupSettings;
    createdAt: Date;
    updatedAt: Date;
} 