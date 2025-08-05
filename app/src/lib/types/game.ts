import { MatchFormat } from "./tournament";
import { GamePhase, PlayerRole } from "./common";
import { ImageStorage } from "./tournament";
import { Staff } from "./tournament";
import { TeamTier } from "./tournament";

export interface Champion {
  id: number;
  name: string;
  key: string;
  image: string;
  // Extended champion data for comprehensive caching
  title?: string;
  attackSpeed?: number;
  splashCenteredImg?: string;
  splashImg?: string;
  loadingImg?: string;
  squareImg?: string;
  spells?: ChampionSpell[];
  tags?: string[];
}

export interface ChampionSpell {
  spellName: string;
  iconAsset: string;
  iconName: string;
  isPassive?: boolean;
  isRecast?: boolean;
  baseSpell?: string;
}

export interface Coach {
  name: string;
  id?: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo: ImageStorage;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  players: {
    main: Player[];
    substitutes: Player[];
  };
  staff?: {
    coach?: Staff;
    analyst?: Staff;
    manager?: Staff;
  };
  region: string;
  tier: TeamTier;
  founded: Date;
  verified: boolean;
  verificationSubmittedAt?: Date;
  socialMedia?: {
    twitter?: string;
    discord?: string;
    website?: string;
  };
  userId: string;
  createdAt: Date;
  updatedAt: Date;

  // In-game draft fields (optional so tournament objects remain valid)
  side?: "blue" | "red";
  bans?: Champion[];
  picks?: Champion[];
  isReady?: boolean;
  usedChampions?: Champion[];
  coach?: Coach;
}

export interface GameConfig {
  seriesType: MatchFormat;
  currentGame: number;
  totalGames: number;
  isFearlessDraft: boolean;
  patchName: string;
  blueTeamName?: string;
  redTeamName?: string;
  blueTeamPrefix?: string;
  redTeamPrefix?: string;
  blueCoach?: Coach;
  redCoach?: Coach;
  blueTeamLogo?: string;
  redTeamLogo?: string;
  tournamentName?: string;
  tournamentLogo?: string;
}

export interface GameSession {
  id: string;
  type?: "static" | "lcu" | "tournament" | "web";
  teams: {
    blue: SessionTeam;
    red: SessionTeam;
  };
  phase: GamePhase;
  currentTeam: "blue" | "red";
  turnNumber: number;
  createdAt: Date;
  lastActivity: Date;
  name?: string;
  timer: {
    remaining: number;
    totalTime: number;
    isActive: boolean;
    startedAt?: Date;
  };
  bothTeamsReady: boolean;
  config: GameConfig;
  // series tracking
  gameHistory?: GameSession[];
  seriesScore?: { blue: number; red: number };
  // Hover state for champion selection
  hoverState?: {
    blueTeam?: {
      hoveredChampionId: number | null;
      actionType: "pick" | "ban" | null;
    };
    redTeam?: {
      hoveredChampionId: number | null;
      actionType: "pick" | "ban" | null;
    };
  };
}

export type TeamSide = "blue" | "red";
export type ActionType = "pick" | "ban";

export interface Player {
  id: string;
  inGameName: string;
  tag: string;
  role: PlayerRole;
  profileImage?: string;
  puuid?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  summonerLevel?: number;
  rank?: string;
  lastGameAt?: Date;
  verified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentTeam {
  id: string;
  name: string;
  tag: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  players: Player[];
  coach?: {
    name: string;
    profileImage?: string;
  };
}

export interface PickbanPlayer {
  id: string;
  name: string;
  role: PlayerRole;
  profileImage?: string;
  rank?: string;
  puuid?: string;
}

export interface PickbanTournamentTeam {
  id: string;
  name: string;
  tag: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  players: PickbanPlayer[];
  coach?: {
    name: string;
    profileImage?: string;
  };
}

// Pickban specific types
export interface PickbanConfig {
  seriesType: MatchFormat;
  currentGame: number;
  totalGames: number;
  isFearlessDraft: boolean;
  patchName: string;
  teams: {
    blue: {
      name: string;
      prefix?: string;
      coach?: Coach;
      logoUrl?: string;
      // Enhanced tournament team data
      tournamentTeam?: PickbanTournamentTeam;
    };
    red: {
      name: string;
      prefix?: string;
      coach?: Coach;
      logoUrl?: string;
      // Enhanced tournament team data
      tournamentTeam?: PickbanTournamentTeam;
    };
  };
  tournament?: {
    id: string;
    name: string;
    logoUrl?: string;
    matchInfo?: {
      roundName?: string;
      matchNumber?: number;
      bestOf: number;
      blueTeamScore?: number;
      redTeamScore?: number;
    };
  };
  timers: {
    pickPhase: number;
    banPhase: number;
  };
}

export interface PickbanAction {
  id: string;
  type: ActionType;
  championId: number;
  teamSide: TeamSide;
  phase: GamePhase;
  timestamp: Date;
  undone?: boolean;
}

export interface PickbanSession {
  id: string;
  config: PickbanConfig;
  status: "waiting" | "active" | "paused" | "completed";
  currentPhase: GamePhase;
  currentTeam: TeamSide;
  turnNumber: number;
  timer: {
    remaining: number;
    totalTime: number;
    isActive: boolean;
    startedAt?: Date;
  };
  teams: {
    blue: Team;
    red: Team;
  };
  actions?: PickbanAction[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  spectators?: string[];
}

export interface ChampSelectPlayer {
  cellId: number;
  championId: number;
  summonerId: number;
  summonerName: string;
  puuid: string;
  isBot: boolean;
  isActingNow: boolean;
  pickTurn: number;
  banTurn: number;
  team: number;
}

export interface ChampSelectAction {
  id: number;
  actorCellId: number;
  championId: number;
  completed: boolean;
  type: "pick" | "ban";
  isInProgress: boolean;
}

export interface ChampSelectTimer {
  adjustedTimeLeftInPhase: number;
  totalTimeInPhase: number;
  phase: string;
  isInfinite: boolean;
}

export interface ChampSelectSession {
  phase: string;
  timer: ChampSelectTimer;
  chatDetails: {
    chatRoomName: string;
    chatRoomPassword: string;
  };
  myTeam: ChampSelectPlayer[];
  theirTeam: ChampSelectPlayer[];
  trades: unknown[];
  actions: ChampSelectAction[][];
  bans: {
    myTeamBans: number[];
    theirTeamBans: number[];
  };
  localPlayerCellId: number;
  isSpectating: boolean;
}

export interface EnhancedChampSelectPlayer extends ChampSelectPlayer {
  // Additional tournament data
  playerInfo?: PickbanPlayer;
  role?: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
  profileImage?: string;
}

export interface EnhancedChampSelectSession
  extends Omit<ChampSelectSession, "myTeam" | "theirTeam"> {
  myTeam: EnhancedChampSelectPlayer[];
  theirTeam: EnhancedChampSelectPlayer[];
  // Tournament context
  tournamentData?: {
    tournament: PickbanConfig["tournament"];
    blueTeam: PickbanTournamentTeam;
    redTeam: PickbanTournamentTeam;
  };
  // Hover and selection state for dynamic mock
  hoverState?: {
    isHovering: boolean;
    isSelecting: boolean;
    hoveredChampionId: number | null;
    currentTeam: "blue" | "red" | null;
    currentActionType: "pick" | "ban" | null;
    currentTurn?: number;
  };
  // Series data for Fearless Draft
  isFearlessDraft?: boolean;
  usedChampions?: Champion[];
  fearlessBans?: {
    blue: {
      championId: number;
      role: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
    }[];
    red: {
      championId: number;
      role: "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
    }[];
  };
}

export interface LCUStatus {
  connected: boolean;
  gameflowPhase?: string;
  inChampSelect?: boolean;
  currentSummoner?: {
    displayName: string;
    puuid: string;
    summonerId: number;
  };
  championSelectSession?: {
    timer: {
      adjustedTimeLeftInPhase: number;
      totalTimeInPhase: number;
      phase: string;
    };
    myTeam: Array<{
      championId: number;
      championPickIntent: number;
      summonerId: number;
      displayName: string;
    }>;
    theirTeam: Array<{
      championId: number;
      summonerId: number;
      displayName: string;
    }>;
    bans: {
      myTeamBans: number[];
      theirTeamBans: number[];
    };
  };
  lastUpdated: Date;
}

// Team representation used within an in-progress GameSession (simplified vs full tournament Team).
export interface SessionTeam {
  id: string;
  name: string;
  side: "blue" | "red";
  bans: Champion[];
  picks: Champion[];
  isReady: boolean;
  usedChampions: Champion[];
  prefix?: string;
  coach?: Coach;
  logo: ImageStorage;
}
