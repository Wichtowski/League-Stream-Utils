import type { NextRequest } from 'next/server';
import { withAuth, resendVerificationEmail } from '@lsu/auth';
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

  const user = await db
    .selectFrom('users')
    .select(['id', 'email', 'email_verified'])
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!user) return notFound('User not found');
  if (user.email_verified) return error('Email already verified');

  await resendVerificationEmail(db, user.id, user.email);
  return json({ success: true });
}
