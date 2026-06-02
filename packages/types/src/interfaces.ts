import type {
  PlayerRole,
  GamePhase,
  TeamSide,
  ActionType,
  SessionType,
  SessionStatus,
  TournamentFormat,
  TournamentType,
  TournamentStatus,
  ImageFormat,
  WSMessageType,
} from './enums';

export interface ImageUpload {
  type: 'upload';
  data: string;
  size: number;
  format: ImageFormat;
}

export interface ImageUrl {
  type: 'url';
  url: string;
  size?: number;
  format?: ImageFormat;
}

export type ImageStorage = ImageUpload | ImageUrl;

export interface Champion {
  id: number;
  name: string;
  key: string;
  image: string;
  title?: string;
  tags?: string[];
  splashImg?: string;
  loadingImg?: string;
  squareImg?: string;
  spells?: ChampionSpell[];
}

export interface ChampionSpell {
  spellName: string;
  iconAsset: string;
  iconName: string;
  isPassive?: boolean;
}

export interface Player {
  id: string;
  inGameName: string;
  tag: string;
  role: PlayerRole;
  profileImage?: ImageStorage;
  puuid?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  rank?: string;
}

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Coach {
  name: string;
  profileImage?: ImageStorage;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo?: ImageStorage;
  colors: TeamColors;
  players: Player[];
  subs?: Player[];
  coach?: Coach;
  country?: string;
}

export interface draftAction {
  id: string;
  type: ActionType;
  championId: number;
  teamSide: TeamSide;
  phase: GamePhase;
  timestamp: Date;
  undone?: boolean;
}

export interface DraftTimer {
  remaining: number;
  totalTime: number;
  isActive: boolean;
  startedAt?: Date;
}

export interface draftConfig {
  seriesType: TournamentFormat;
  currentGame: number;
  totalGames: number;
  isFearlessDraft: boolean;
  patchName: string;
  teams: {
    blue: { name: string; prefix?: string; coach?: Coach; logoUrl?: string };
    red: { name: string; prefix?: string; coach?: Coach; logoUrl?: string };
  };
  tournament?: {
    id: string;
    name: string;
    logo?: ImageStorage;
    matchInfo?: {
      roundName?: string;
      matchNumber?: number;
      bestOf: number;
      blueTeamScore?: number;
      redTeamScore?: number;
    };
  };
  timers: { pickPhase: number; banPhase: number };
}

export interface draftSession {
  id: string;
  type?: SessionType;
  config: draftConfig;
  status: SessionStatus;
  currentPhase: GamePhase;
  currentTeam: TeamSide;
  turnNumber: number;
  timer: DraftTimer;
  teams: { blue: Team; red: Team };
  actions?: draftAction[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: string;
  password?: string;
}

// ── Tournament ───────────────────────────────────────────────
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
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
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

// ── Auth ─────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface JWTPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

// ── WebSocket ────────────────────────────────────────────────
export interface WSMessage {
  type: WSMessageType;
  payload: Record<string, unknown>;
  sessionId?: string;
  teamSide?: TeamSide;
}

// ── Camera ───────────────────────────────────────────────────
export interface CameraConfig {
  id: string;
  teamId: string;
  userId: string;
  players: {
    role: PlayerRole;
    streamUrl: string;
    playerName?: string;
  }[];
  updatedAt: Date;
}

// ── Commentator ──────────────────────────────────────────────
export interface Commentator {
  id: string;
  name: string;
  profileImage?: ImageStorage;
  socialLinks?: Record<string, string>;
}

// ── Prediction ───────────────────────────────────────────────
export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  predictedWinner: TeamSide;
  createdAt: Date;
}

// ── LCU ──────────────────────────────────────────────────────
export interface LCUStatus {
  connected: boolean;
  gameflowPhase?: string;
  inChampSelect?: boolean;
  currentSummoner?: {
    displayName: string;
    puuid: string;
    summonerId: number;
  };
  lastUpdated: Date;
}
