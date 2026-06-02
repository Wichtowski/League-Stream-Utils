import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, unauthorized, forbidden } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const db = getDbForRequest(request);

  const { count: activeSessions } = await db
    .selectFrom('sessions')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('is_valid', '=', true)
    .where('expires_at', '>', new Date())
    .executeTakeFirstOrThrow();

  const { count: totalUsers } = await db
    .selectFrom('users')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  const recentSessions = await db
    .selectFrom('sessions')
    .innerJoin('users', 'users.id', 'sessions.user_id')
    .select([
      'sessions.id',
      'sessions.ip',
      'sessions.user_agent',
      'sessions.created_at',
      'sessions.last_used_at',
      'sessions.impersonated_by',
      'users.username',
    ])
    .where('sessions.is_valid', '=', true)
    .where('sessions.expires_at', '>', new Date())
    .orderBy('sessions.last_used_at', 'desc')
    .limit(50)
    .execute();

  return json({ activeSessions, totalUsers, recentSessions });
}
