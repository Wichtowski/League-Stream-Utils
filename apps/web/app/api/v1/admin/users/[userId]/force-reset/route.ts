import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, error, unauthorized, forbidden, notFound } from '@/api/_helpers';

interface Params {
  params: Promise<{ userId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const { userId } = await params;
  const db = getDbForRequest(request);

  const updated = await db
    .updateTable('users')
    .set({ must_change_password: true, updated_at: new Date() })
    .where('id', '=', userId)
    .returning(['id', 'username'])
    .executeTakeFirst();

  if (!updated) return notFound('User not found');

  await db
    .insertInto('permission_audit')
    .values({
      user_id: userId,
      action: 'force_password_reset',
      resource: 'users',
      performed_by: auth.user.userId,
    })
    .execute();

  return json({ success: true, username: updated.username });
}
