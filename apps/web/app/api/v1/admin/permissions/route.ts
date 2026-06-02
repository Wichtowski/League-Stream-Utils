import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, error, unauthorized, forbidden, parseBody } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const db = getDbForRequest(request);
  const permissions = await db.selectFrom('user_permissions').selectAll().orderBy('granted_at', 'desc').execute();
  return json(permissions);
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const body = await parseBody<{
    userId: string;
    role: 'admin' | 'organizer' | 'moderator' | 'commentator' | 'viewer';
  }>(request);

  if (!body?.userId || !body?.role) return error('userId and role required');

  const db = getDbForRequest(request);
  const perm = await db
    .insertInto('user_permissions')
    .values({ user_id: body.userId, role: body.role, granted_by: auth.user.userId })
    .returningAll()
    .executeTakeFirstOrThrow();

  await db.insertInto('permission_audit').values({
    user_id: body.userId,
    action: 'grant',
    resource: 'role',
    metadata: JSON.stringify({ role: body.role }),
    performed_by: auth.user.userId,
  }).execute();

  return json(perm, 201);
}
