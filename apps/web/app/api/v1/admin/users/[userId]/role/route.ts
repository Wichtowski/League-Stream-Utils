import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, error, unauthorized, forbidden, notFound, parseBody } from '@/api/_helpers';

interface Params {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const { userId } = await params;
  const body = await parseBody<{
    role: 'admin' | 'organizer' | 'moderator' | 'commentator' | 'viewer';
  }>(request);

  if (!body?.role) return error('role required');

  const validRoles = ['admin', 'organizer', 'moderator', 'commentator', 'viewer'];
  if (!validRoles.includes(body.role)) return error('Invalid role');

  const db = getDbForRequest(request);

  const user = await db
    .selectFrom('users')
    .select('id')
    .where('id', '=', userId)
    .executeTakeFirst();
  if (!user) return notFound('User not found');

  await db
    .deleteFrom('user_permissions')
    .where('user_id', '=', userId)
    .execute();

  const perm = await db
    .insertInto('user_permissions')
    .values({ user_id: userId, role: body.role, granted_by: auth.user.userId })
    .returningAll()
    .executeTakeFirstOrThrow();

  await db
    .insertInto('permission_audit')
    .values({
      user_id: userId,
      action: 'role_changed',
      resource: 'user_permissions',
      metadata: JSON.stringify({ role: body.role }),
      performed_by: auth.user.userId,
    })
    .execute();

  return json(perm);
}
