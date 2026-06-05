import type { Generated, ColumnType, JSONColumnType } from "kysely";

// ── Sync metadata (shared by all synced tables) ─────────────

export interface SyncFields {
  sync_status: ColumnType<"synced" | "pending" | "conflict", string | undefined, string>;
  last_synced_at: Date | null;
  cloud_id: string | null;
}

// ── Users & Auth ────────────────────────────────────────────

export interface UsersTable {
  id: Generated<string>;
  username: string;
  email: string;
  password_hash: string;
  is_admin: ColumnType<boolean, boolean | undefined, boolean>;
  is_locked: ColumnType<boolean, boolean | undefined, boolean>;
  email_verified: ColumnType<boolean, boolean | undefined, boolean>;
  locked_until: Date | null;
  last_login_at: Date | null;
  last_login_ip: string | null;
  sessions_created_today: ColumnType<number, number | undefined, number>;
  last_session_date: Date | null;
  plan: ColumnType<"free" | "pro", "free" | "pro" | undefined, "free" | "pro">;
  plan_expires_at: Date | null;
  must_change_password: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export interface SessionsTable {
  id: Generated<string>;
  user_id: string;
  refresh_token: string;
  ip: string | null;
  user_agent: string | null;
  expires_at: Date;
  created_at: ColumnType<Date, Date | undefined, never>;
  last_used_at: ColumnType<Date, Date | undefined, Date>;
  is_valid: ColumnType<boolean, boolean | undefined, boolean>;
  impersonated_by: string | null;
}

export interface EmailVerificationTokensTable {
  id: Generated<string>;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export interface LoginAttemptsTable {
  id: Generated<string>;
  ip: string;
  username: string;
  success: boolean;
  attempted_at: ColumnType<Date, Date | undefined, never>;
}

export interface SecurityEventsTable {
  id: Generated<string>;
  user_id: string | null;
  event_type: string;
  ip: string | null;
  metadata: JSONColumnType<Record<string, unknown>> | null;
  created_at: ColumnType<Date, Date | undefined, never>;
}

// ── Teams ───────────────────────────────────────────────────

export interface TeamsTable extends SyncFields {
  id: Generated<string>;
  name: string;
  tag: string;
  logo: JSONColumnType<unknown> | null;
  colors: JSONColumnType<{ primary: string; secondary: string; accent: string }>;
  country: string | null;
  owner_id: string;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export interface PlayersTable extends SyncFields {
  id: Generated<string>;
  team_id: string;
  in_game_name: string;
  tag: string;
  role: "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
  is_sub: ColumnType<boolean, boolean | undefined, boolean>;
  profile_image: JSONColumnType<unknown> | null;
  puuid: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  rank: string | null;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export interface StaffTable extends SyncFields {
  id: Generated<string>;
  team_id: string;
  name: string;
  role: string;
  profile_image: JSONColumnType<unknown> | null;
  created_at: ColumnType<Date, Date | undefined, never>;
}

// ── Tournaments ─────────────────────────────────────────────

export interface TournamentsTable extends SyncFields {
  id: Generated<string>;
  name: string;
  type: "ladder" | "swiss" | "round_robin" | "groups";
  format: "bo1" | "bo3" | "bo5";
  status: ColumnType<
    "draft" | "registration" | "active" | "completed" | "cancelled",
    string | undefined,
    string
  >;
  logo: JSONColumnType<unknown> | null;
  description: string | null;
  organizer_id: string;
  start_date: Date | null;
  end_date: Date | null;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export interface TournamentTeamsTable extends SyncFields {
  id: Generated<string>;
  tournament_id: string;
  team_id: string;
  seed: number | null;
  registered_at: ColumnType<Date, Date | undefined, never>;
}

export interface BracketsTable extends SyncFields {
  id: Generated<string>;
  tournament_id: string;
  data: JSONColumnType<unknown>;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export interface MatchesTable extends SyncFields {
  id: Generated<string>;
  tournament_id: string;
  blue_team_id: string | null;
  red_team_id: string | null;
  format: "bo1" | "bo3" | "bo5";
  status: ColumnType<"scheduled" | "live" | "completed" | "cancelled", string | undefined, string>;
  score_blue: ColumnType<number, number | undefined, number>;
  score_red: ColumnType<number, number | undefined, number>;
  round_number: number | null;
  round_name: string | null;
  match_number: number | null;
  scheduled_at: Date | null;
  completed_at: Date | null;
  created_at: ColumnType<Date, Date | undefined, never>;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

export interface MatchGamesTable extends SyncFields {
  id: Generated<string>;
  match_id: string;
  game_number: number;
  winner_id: string | null;
  draft_session_id: string | null;
  duration: number | null;
  completed_at: Date | null;
}

// ── Commentators ────────────────────────────────────────────

export interface CommentatorsTable extends SyncFields {
  id: Generated<string>;
  name: string;
  profile_image: JSONColumnType<unknown> | null;
  social_links: JSONColumnType<Record<string, string>> | null;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export interface MatchCommentatorsTable extends SyncFields {
  id: Generated<string>;
  match_id: string;
  commentator_id: string;
  assigned_at: ColumnType<Date, Date | undefined, never>;
}

// ── Champions ───────────────────────────────────────────────

export interface ChampionsTable {
  id: Generated<string>;
  riot_id: number;
  name: string;
  key: string;
  image: string;
  title: string | null;
  tags: JSONColumnType<string[]> | null;
  spells: JSONColumnType<unknown> | null;
  patch_version: string;
  updated_at: ColumnType<Date, Date | undefined, Date>;
}

// ── Permissions ─────────────────────────────────────────────

export interface UserPermissionsTable {
  id: Generated<string>;
  user_id: string;
  role: "admin" | "organizer" | "moderator" | "commentator" | "viewer";
  granted_at: ColumnType<Date, Date | undefined, never>;
  granted_by: string | null;
}

export interface TournamentPermissionsTable extends SyncFields {
  id: Generated<string>;
  user_id: string;
  tournament_id: string;
  role: "organizer" | "moderator" | "commentator" | "viewer";
  granted_at: ColumnType<Date, Date | undefined, never>;
  granted_by: string | null;
}

export interface PermissionAuditTable {
  id: Generated<string>;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  metadata: JSONColumnType<Record<string, unknown>> | null;
  performed_by: string | null;
  created_at: ColumnType<Date, Date | undefined, never>;
}

// ── Predictions ─────────────────────────────────────────────

export interface PredictionsTable {
  id: Generated<string>;
  match_id: string;
  user_id: string;
  predicted_winner: "blue" | "red";
  created_at: ColumnType<Date, Date | undefined, never>;
}

// ── Tournament Join Requests & Invitations ──────────────────

export interface TournamentJoinRequestsTable {
  id: Generated<string>;
  tournament_id: string;
  team_id: string;
  requested_by: string;
  status: ColumnType<
    "pending" | "approved" | "rejected",
    "pending" | undefined,
    "pending" | "approved" | "rejected"
  >;
  message: string | null;
  responded_by: string | null;
  responded_at: Date | null;
  created_at: ColumnType<Date, Date | undefined, never>;
}

export interface TournamentInvitationsTable {
  id: Generated<string>;
  tournament_id: string;
  team_id: string;
  invited_by: string;
  status: ColumnType<
    "pending" | "accepted" | "declined",
    "pending" | undefined,
    "pending" | "accepted" | "declined"
  >;
  message: string | null;
  responded_at: Date | null;
  created_at: ColumnType<Date, Date | undefined, never>;
}

// ── Sync Log ────────────────────────────────────────────────

export interface SyncLogTable {
  id: Generated<number>;
  table_name: string;
  record_id: string;
  action: "insert" | "update" | "delete";
  data: string;
  created_at: ColumnType<Date, Date | undefined, never>;
  synced_at: Date | null;
}

// ── Database (root interface) ───────────────────────────────

export interface Database {
  users: UsersTable;
  sessions: SessionsTable;
  email_verification_tokens: EmailVerificationTokensTable;
  login_attempts: LoginAttemptsTable;
  security_events: SecurityEventsTable;
  teams: TeamsTable;
  players: PlayersTable;
  staff: StaffTable;
  tournaments: TournamentsTable;
  tournament_teams: TournamentTeamsTable;
  brackets: BracketsTable;
  matches: MatchesTable;
  match_games: MatchGamesTable;
  commentators: CommentatorsTable;
  match_commentators: MatchCommentatorsTable;
  champions: ChampionsTable;
  user_permissions: UserPermissionsTable;
  tournament_permissions: TournamentPermissionsTable;
  permission_audit: PermissionAuditTable;
  predictions: PredictionsTable;
  tournament_join_requests: TournamentJoinRequestsTable;
  tournament_invitations: TournamentInvitationsTable;
  sync_log: SyncLogTable;
}
