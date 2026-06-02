import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, unauthorized, forbidden } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const db = getDbForRequest(request);
  const checks: Record<string, { status: string; detail?: string }> = {};

  try {
    await db.selectFrom('users').select('id').limit(1).execute();
    checks.database = { status: 'ok' };
  } catch (e: any) {
    checks.database = { status: 'error', detail: e.message };
  }

  const { count: userCount } = await db
    .selectFrom('users')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  const { count: tournamentCount } = await db
    .selectFrom('tournaments')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  const { count: teamCount } = await db
    .selectFrom('teams')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .executeTakeFirstOrThrow();

  const { count: sessionCount } = await db
    .selectFrom('sessions')
    .select((eb) => eb.fn.countAll<number>().as('count'))
    .where('is_valid', '=', true)
    .where('expires_at', '>', new Date())
    .executeTakeFirstOrThrow();

  return json({
    status: Object.values(checks).every((c) => c.status === 'ok') ? 'healthy' : 'degraded',
    checks,
    stats: {
      users: userCount,
      tournaments: tournamentCount,
      teams: teamCount,
      activeSessions: sessionCount,
    },
    runtime: {
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  });
}
