import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.execute(db);

  // ── Users & Auth ──────────────────────────────────────────
  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('username', 'varchar(64)', (c) => c.notNull().unique())
    .addColumn('email', 'varchar(255)', (c) => c.notNull().unique())
    .addColumn('password_hash', 'text', (c) => c.notNull())
    .addColumn('is_admin', 'boolean', (c) => c.notNull().defaultTo(false))
    .addColumn('is_locked', 'boolean', (c) => c.notNull().defaultTo(false))
    .addColumn('email_verified', 'boolean', (c) => c.notNull().defaultTo(false))
    .addColumn('locked_until', 'timestamptz')
    .addColumn('last_login_at', 'timestamptz')
    .addColumn('last_login_ip', 'varchar(45)')
    .addColumn('sessions_created_today', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('last_session_date', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('sessions')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (c) => c.notNull().references('users.id').onDelete('cascade'))
    .addColumn('refresh_token', 'text', (c) => c.notNull())
    .addColumn('ip', 'varchar(45)')
    .addColumn('user_agent', 'text')
    .addColumn('expires_at', 'timestamptz', (c) => c.notNull())
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('last_used_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('is_valid', 'boolean', (c) => c.notNull().defaultTo(true))
    .execute();

  await db.schema
    .createTable('email_verification_tokens')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (c) => c.notNull().references('users.id').onDelete('cascade'))
    .addColumn('token', 'varchar(64)', (c) => c.notNull().unique())
    .addColumn('expires_at', 'timestamptz', (c) => c.notNull())
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('login_attempts')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('ip', 'varchar(45)', (c) => c.notNull())
    .addColumn('username', 'varchar(64)', (c) => c.notNull())
    .addColumn('success', 'boolean', (c) => c.notNull())
    .addColumn('attempted_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('security_events')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (c) => c.references('users.id').onDelete('set null'))
    .addColumn('event_type', 'varchar(64)', (c) => c.notNull())
    .addColumn('ip', 'varchar(45)')
    .addColumn('metadata', 'jsonb')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  // ── Teams ─────────────────────────────────────────────────
  await db.schema
    .createTable('teams')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('name', 'varchar(128)', (c) => c.notNull())
    .addColumn('tag', 'varchar(8)', (c) => c.notNull())
    .addColumn('logo', 'jsonb')
    .addColumn('colors', 'jsonb', (c) => c.notNull())
    .addColumn('country', 'varchar(4)')
    .addColumn('owner_id', 'uuid', (c) => c.notNull().references('users.id').onDelete('cascade'))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('players')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('team_id', 'uuid', (c) => c.notNull().references('teams.id').onDelete('cascade'))
    .addColumn('in_game_name', 'varchar(64)', (c) => c.notNull())
    .addColumn('tag', 'varchar(16)', (c) => c.notNull())
    .addColumn('role', 'varchar(16)', (c) => c.notNull())
    .addColumn('is_sub', 'boolean', (c) => c.notNull().defaultTo(false))
    .addColumn('profile_image', 'jsonb')
    .addColumn('puuid', 'varchar(128)')
    .addColumn('first_name', 'varchar(64)')
    .addColumn('last_name', 'varchar(64)')
    .addColumn('country', 'varchar(4)')
    .addColumn('rank', 'varchar(32)')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('staff')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('team_id', 'uuid', (c) => c.notNull().references('teams.id').onDelete('cascade'))
    .addColumn('name', 'varchar(128)', (c) => c.notNull())
    .addColumn('role', 'varchar(32)', (c) => c.notNull())
    .addColumn('profile_image', 'jsonb')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  // ── Tournaments ───────────────────────────────────────────
  await db.schema
    .createTable('tournaments')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('name', 'varchar(256)', (c) => c.notNull())
    .addColumn('type', 'varchar(32)', (c) => c.notNull())
    .addColumn('format', 'varchar(8)', (c) => c.notNull())
    .addColumn('status', 'varchar(32)', (c) => c.notNull().defaultTo('draft'))
    .addColumn('logo', 'jsonb')
    .addColumn('description', 'text')
    .addColumn('organizer_id', 'uuid', (c) => c.notNull().references('users.id').onDelete('cascade'))
    .addColumn('start_date', 'timestamptz')
    .addColumn('end_date', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('tournament_teams')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('tournament_id', 'uuid', (c) => c.notNull().references('tournaments.id').onDelete('cascade'))
    .addColumn('team_id', 'uuid', (c) => c.notNull().references('teams.id').onDelete('cascade'))
    .addColumn('seed', 'integer')
    .addColumn('registered_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('brackets')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('tournament_id', 'uuid', (c) => c.notNull().references('tournaments.id').onDelete('cascade').unique())
    .addColumn('data', 'jsonb', (c) => c.notNull())
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('matches')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('tournament_id', 'uuid', (c) => c.notNull().references('tournaments.id').onDelete('cascade'))
    .addColumn('blue_team_id', 'uuid', (c) => c.references('teams.id').onDelete('set null'))
    .addColumn('red_team_id', 'uuid', (c) => c.references('teams.id').onDelete('set null'))
    .addColumn('format', 'varchar(8)', (c) => c.notNull())
    .addColumn('status', 'varchar(32)', (c) => c.notNull().defaultTo('scheduled'))
    .addColumn('score_blue', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('score_red', 'integer', (c) => c.notNull().defaultTo(0))
    .addColumn('round_number', 'integer')
    .addColumn('round_name', 'varchar(64)')
    .addColumn('match_number', 'integer')
    .addColumn('scheduled_at', 'timestamptz')
    .addColumn('completed_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('match_games')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('match_id', 'uuid', (c) => c.notNull().references('matches.id').onDelete('cascade'))
    .addColumn('game_number', 'integer', (c) => c.notNull())
    .addColumn('winner_id', 'uuid', (c) => c.references('teams.id').onDelete('set null'))
    .addColumn('draft_session_id', 'varchar(128)')
    .addColumn('duration', 'integer')
    .addColumn('completed_at', 'timestamptz')
    .execute();

  // ── Commentators ──────────────────────────────────────────
  await db.schema
    .createTable('commentators')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('name', 'varchar(128)', (c) => c.notNull())
    .addColumn('profile_image', 'jsonb')
    .addColumn('social_links', 'jsonb')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createTable('match_commentators')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('match_id', 'uuid', (c) => c.notNull().references('matches.id').onDelete('cascade'))
    .addColumn('commentator_id', 'uuid', (c) => c.notNull().references('commentators.id').onDelete('cascade'))
    .addColumn('assigned_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  // ── Champions ─────────────────────────────────────────────
  await db.schema
    .createTable('champions')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('riot_id', 'integer', (c) => c.notNull().unique())
    .addColumn('name', 'varchar(64)', (c) => c.notNull())
    .addColumn('key', 'varchar(64)', (c) => c.notNull())
    .addColumn('image', 'varchar(256)', (c) => c.notNull())
    .addColumn('title', 'varchar(128)')
    .addColumn('tags', 'jsonb')
    .addColumn('spells', 'jsonb')
    .addColumn('patch_version', 'varchar(16)', (c) => c.notNull())
    .addColumn('updated_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  // ── Permissions ───────────────────────────────────────────
  await db.schema
    .createTable('user_permissions')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (c) => c.notNull().references('users.id').onDelete('cascade'))
    .addColumn('role', 'varchar(32)', (c) => c.notNull())
    .addColumn('granted_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('granted_by', 'uuid', (c) => c.references('users.id').onDelete('set null'))
    .execute();

  await db.schema
    .createTable('tournament_permissions')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (c) => c.notNull().references('users.id').onDelete('cascade'))
    .addColumn('tournament_id', 'uuid', (c) => c.notNull().references('tournaments.id').onDelete('cascade'))
    .addColumn('role', 'varchar(32)', (c) => c.notNull())
    .addColumn('granted_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .addColumn('granted_by', 'uuid', (c) => c.references('users.id').onDelete('set null'))
    .execute();

  await db.schema
    .createTable('permission_audit')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('user_id', 'uuid', (c) => c.references('users.id').onDelete('set null'))
    .addColumn('action', 'varchar(32)', (c) => c.notNull())
    .addColumn('resource', 'varchar(32)', (c) => c.notNull())
    .addColumn('resource_id', 'uuid')
    .addColumn('metadata', 'jsonb')
    .addColumn('performed_by', 'uuid', (c) => c.references('users.id').onDelete('set null'))
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  // ── Predictions ───────────────────────────────────────────
  await db.schema
    .createTable('predictions')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('match_id', 'uuid', (c) => c.notNull().references('matches.id').onDelete('cascade'))
    .addColumn('user_id', 'uuid', (c) => c.notNull().references('users.id').onDelete('cascade'))
    .addColumn('predicted_winner', 'varchar(8)', (c) => c.notNull())
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  const tables = [
    'predictions',
    'permission_audit',
    'tournament_permissions',
    'user_permissions',
    'champions',
    'match_commentators',
    'commentators',
    'match_games',
    'matches',
    'brackets',
    'tournament_teams',
    'tournaments',
    'staff',
    'players',
    'teams',
    'security_events',
    'login_attempts',
    'email_verification_tokens',
    'sessions',
    'users',
  ];
  for (const table of tables) {
    await db.schema.dropTable(table).ifExists().execute();
  }
}
