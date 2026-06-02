import type { Kysely } from 'kysely';
import { sql } from 'kysely';

const SYNCED_TABLES = [
  'teams',
  'players',
  'staff',
  'tournaments',
  'tournament_teams',
  'brackets',
  'matches',
  'match_games',
  'commentators',
  'match_commentators',
  'tournament_permissions',
] as const;

export async function up(db: Kysely<unknown>): Promise<void> {
  for (const table of SYNCED_TABLES) {
    await db.schema
      .alterTable(table)
      .addColumn('sync_status', 'varchar(10)', (c) => c.defaultTo('synced'))
      .execute();
    await db.schema.alterTable(table).addColumn('last_synced_at', 'timestamp').execute();
    await db.schema.alterTable(table).addColumn('cloud_id', 'uuid').execute();
  }

  await db.schema
    .createTable('sync_log')
    .addColumn('id', 'serial', (c) => c.primaryKey())
    .addColumn('table_name', 'varchar(64)', (c) => c.notNull())
    .addColumn('record_id', 'varchar(64)', (c) => c.notNull())
    .addColumn('action', 'varchar(10)', (c) => c.notNull())
    .addColumn('data', 'text', (c) => c.notNull())
    .addColumn('created_at', 'timestamp', (c) => c.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('synced_at', 'timestamp')
    .execute();

  await db.schema.createIndex('idx_sync_log_unsynced').on('sync_log').column('synced_at').execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('sync_log').execute();

  for (const table of SYNCED_TABLES) {
    await db.schema.alterTable(table).dropColumn('cloud_id').execute();
    await db.schema.alterTable(table).dropColumn('last_synced_at').execute();
    await db.schema.alterTable(table).dropColumn('sync_status').execute();
  }
}
