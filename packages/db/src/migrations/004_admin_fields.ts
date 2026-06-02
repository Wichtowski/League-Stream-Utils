import type { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('must_change_password', 'boolean', (c) => c.notNull().defaultTo(false))
    .execute();

  await db.schema
    .alterTable('sessions')
    .addColumn('impersonated_by', 'uuid', (c) => c.references('users.id').onDelete('set null'))
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('sessions').dropColumn('impersonated_by').execute();
  await db.schema.alterTable('users').dropColumn('must_change_password').execute();
}
