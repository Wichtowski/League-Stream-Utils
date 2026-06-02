import type { NextRequest } from 'next/server';
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
    isAdmin?: boolean;
    isLocked?: boolean;
  }>(request);
  if (!body) return error('Request body required');

  const db = getDbForRequest(request);
  const set: Record<string, unknown> = { updated_at: new Date() };
  if (body.isAdmin !== undefined) set.is_admin = body.isAdmin;
  if (body.isLocked !== undefined) set.is_locked = body.isLocked;

  const updated = await db
    .updateTable('users')
    .set(set)
    .where('id', '=', userId)
    .returning(['id', 'username', 'email', 'is_admin', 'is_locked'])
    .executeTakeFirst();

  if (!updated) return notFound('User not found');
  return json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const { userId } = await params;
  if (userId === auth.user.userId) return error('Cannot delete yourself');

  const db = getDbForRequest(request);
  await db.deleteFrom('users').where('id', '=', userId).execute();
  return json({ success: true });
}
