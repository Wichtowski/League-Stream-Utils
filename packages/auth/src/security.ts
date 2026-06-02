import type { Kysely } from 'kysely';
import type { Database } from '@lsu/db/types';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

export async function recordLoginAttempt(
  db: Kysely<Database>,
  ip: string,
  username: string,
  success: boolean,
) {
  await db.insertInto('login_attempts').values({ ip, username, success }).execute();
}

export async function isLockedOut(db: Kysely<Database>, username: string): Promise<boolean> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS);
  const result = await db
    .selectFrom('login_attempts')
    .select((eb) => eb.fn.countAll<number>().as('total'))
    .where('username', '=', username)
    .where('success', '=', false)
    .where('attempted_at', '>=', since)
    .executeTakeFirst();
  return (result?.total ?? 0) >= LOCKOUT_THRESHOLD;
}

export async function clearFailedAttempts(db: Kysely<Database>, username: string) {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS);
  await db
    .deleteFrom('login_attempts')
    .where('username', '=', username)
    .where('success', '=', false)
    .where('attempted_at', '>=', since)
    .execute();
}

export async function logSecurityEvent(
  db: Kysely<Database>,
  eventType: string,
  ip: string | null,
  userId?: string,
  metadata?: Record<string, unknown>,
) {
  await db
    .insertInto('security_events')
    .values({
      event_type: eventType,
      ip,
      user_id: userId ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
    .execute();
}

export async function getRecentSecurityEvents(db: Kysely<Database>, userId: string, limit = 20) {
  return db
    .selectFrom('security_events')
    .selectAll()
    .where('user_id', '=', userId)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .execute();
}
