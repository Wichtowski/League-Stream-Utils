import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('tournament_join_requests')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('tournament_id', 'uuid', (c) =>
      c.notNull().references('tournaments.id').onDelete('cascade'),
    )
    .addColumn('team_id', 'uuid', (c) =>
      c.notNull().references('teams.id').onDelete('cascade'),
    )
    .addColumn('requested_by', 'uuid', (c) =>
      c.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('status', 'varchar(16)', (c) => c.notNull().defaultTo('pending'))
    .addColumn('message', 'text')
    .addColumn('responded_by', 'uuid', (c) => c.references('users.id').onDelete('set null'))
    .addColumn('responded_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_join_requests_tournament')
    .ifNotExists()
    .on('tournament_join_requests')
    .column('tournament_id')
    .execute();

  await db.schema
    .createIndex('idx_join_requests_team')
    .ifNotExists()
    .on('tournament_join_requests')
    .column('team_id')
    .execute();

  await db.schema
    .createTable('tournament_invitations')
    .ifNotExists()
    .addColumn('id', 'uuid', (c) => c.primaryKey().defaultTo(sql`uuid_generate_v4()`))
    .addColumn('tournament_id', 'uuid', (c) =>
      c.notNull().references('tournaments.id').onDelete('cascade'),
    )
    .addColumn('team_id', 'uuid', (c) =>
      c.notNull().references('teams.id').onDelete('cascade'),
    )
    .addColumn('invited_by', 'uuid', (c) =>
      c.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('status', 'varchar(16)', (c) => c.notNull().defaultTo('pending'))
    .addColumn('message', 'text')
    .addColumn('responded_at', 'timestamptz')
    .addColumn('created_at', 'timestamptz', (c) => c.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_invitations_tournament')
    .ifNotExists()
    .on('tournament_invitations')
    .column('tournament_id')
    .execute();

  await db.schema
    .createIndex('idx_invitations_team')
    .ifNotExists()
    .on('tournament_invitations')
    .column('team_id')
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('tournament_invitations').ifExists().execute();
  await db.schema.dropTable('tournament_join_requests').ifExists().execute();
}
