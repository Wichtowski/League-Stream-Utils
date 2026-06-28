import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("plan", "varchar(8)", (c) => c.notNull().defaultTo("free"))
    .execute();

  await db.schema.alterTable("users").addColumn("plan_expires_at", "timestamptz").execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable("users").dropColumn("plan_expires_at").execute();
  await db.schema.alterTable("users").dropColumn("plan").execute();
}
