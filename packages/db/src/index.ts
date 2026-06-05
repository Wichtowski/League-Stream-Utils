import BetterSqlite3 from "better-sqlite3";
import { Kysely, PostgresDialect, SqliteDialect } from "kysely";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pg from "pg";

import type { Database } from "./types";

export type { Database } from "./types";
export type AppDb = Kysely<Database>;

let onlineDb: Kysely<Database> | null = null;
let offlineDb: Kysely<Database> | null = null;

function initSqliteSchema(db: BetterSqlite3.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL DEFAULT '',
      is_admin INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      email_verified INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      last_login_at TEXT,
      last_login_ip TEXT,
      sessions_created_today INTEGER NOT NULL DEFAULT 0,
      last_session_date TEXT,
      plan TEXT NOT NULL DEFAULT 'free',
      plan_expires_at TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      refresh_token TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used_at TEXT NOT NULL DEFAULT (datetime('now')),
      is_valid INTEGER NOT NULL DEFAULT 1,
      impersonated_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      ip TEXT NOT NULL,
      username TEXT NOT NULL,
      success INTEGER NOT NULL,
      attempted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      event_type TEXT NOT NULL,
      ip TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      name TEXT NOT NULL,
      tag TEXT NOT NULL,
      logo TEXT,
      colors TEXT NOT NULL DEFAULT '{}',
      country TEXT,
      owner_id TEXT NOT NULL DEFAULT 'local',
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      in_game_name TEXT NOT NULL,
      tag TEXT NOT NULL,
      role TEXT NOT NULL,
      is_sub INTEGER NOT NULL DEFAULT 0,
      profile_image TEXT,
      puuid TEXT,
      first_name TEXT,
      last_name TEXT,
      country TEXT,
      rank TEXT,
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      profile_image TEXT,
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tournaments (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      format TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      logo TEXT,
      description TEXT,
      organizer_id TEXT NOT NULL DEFAULT 'local',
      start_date TEXT,
      end_date TEXT,
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tournament_teams (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      seed INTEGER,
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      registered_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS brackets (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE UNIQUE,
      data TEXT NOT NULL DEFAULT '{}',
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      blue_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
      red_team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
      format TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      score_blue INTEGER NOT NULL DEFAULT 0,
      score_red INTEGER NOT NULL DEFAULT 0,
      round_number INTEGER,
      round_name TEXT,
      match_number INTEGER,
      scheduled_at TEXT,
      completed_at TEXT,
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS match_games (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      game_number INTEGER NOT NULL,
      winner_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
      draft_session_id TEXT,
      duration INTEGER,
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS commentators (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      name TEXT NOT NULL,
      profile_image TEXT,
      social_links TEXT,
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS match_commentators (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      commentator_id TEXT NOT NULL REFERENCES commentators(id) ON DELETE CASCADE,
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS champions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      riot_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      key TEXT NOT NULL,
      image TEXT NOT NULL,
      title TEXT,
      tags TEXT,
      spells TEXT,
      patch_version TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_permissions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      granted_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tournament_permissions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      sync_status TEXT DEFAULT 'synced',
      last_synced_at TEXT,
      cloud_id TEXT,
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      granted_by TEXT REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS permission_audit (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      resource_id TEXT,
      metadata TEXT,
      performed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      predicted_winner TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tournament_join_requests (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      message TEXT,
      responded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      responded_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tournament_invitations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))),
      tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      invited_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      message TEXT,
      responded_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      action TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_join_requests_tournament ON tournament_join_requests(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_join_requests_team ON tournament_join_requests(team_id);
    CREATE INDEX IF NOT EXISTS idx_invitations_tournament ON tournament_invitations(tournament_id);
    CREATE INDEX IF NOT EXISTS idx_invitations_team ON tournament_invitations(team_id);
    CREATE INDEX IF NOT EXISTS idx_sync_log_unsynced ON sync_log(synced_at);
  `);
}

function getDefaultSqlitePath(): string {
  const platform = process.platform;
  let base: string;
  if (platform === "win32") {
    base = path.join(
      process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming"),
      "league-stream-utils",
    );
  } else if (platform === "darwin") {
    base = path.join(os.homedir(), "Library", "Application Support", "league-stream-utils");
  } else {
    base = path.join(
      process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share"),
      "league-stream-utils",
    );
  }
  fs.mkdirSync(base, { recursive: true });

  return path.join(base, "local.db");
}

export function getDb(mode: "online" | "offline" = "online"): Kysely<Database> {
  if (mode === "offline") {
    if (!offlineDb) {
      const sqlitePath = process.env.SQLITE_PATH ?? getDefaultSqlitePath();
      const sqlite = new BetterSqlite3(sqlitePath);
      sqlite.pragma("journal_mode = WAL");
      sqlite.pragma("foreign_keys = ON");
      initSqliteSchema(sqlite);
      offlineDb = new Kysely<Database>({
        dialect: new SqliteDialect({ database: sqlite }),
      });
    }

    return offlineDb;
  }

  if (!onlineDb) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL environment variable is not set");
    onlineDb = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new pg.Pool({ connectionString }),
      }),
    });
  }

  return onlineDb;
}

export function getDbForRequest(request: Request): Kysely<Database> {
  const cookies = request.headers.get("cookie") ?? "";
  const isOffline = cookies.includes("app_mode=offline");

  return getDb(isOffline ? "offline" : "online");
}

export { sql } from "kysely";
