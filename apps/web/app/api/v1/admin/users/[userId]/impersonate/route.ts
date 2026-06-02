import { NextRequest } from 'next/server';
import { withAuth, getClientIp } from '@lsu/auth';
import { generateTokens } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, error, unauthorized, forbidden, notFound } from '@/api/_helpers';
import { setCookies } from '@/api/_helpers';

interface Params {
  params: Promise<{ userId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const { userId } = await params;
  if (userId === auth.user.userId) return error('Cannot impersonate yourself');

  const db = getDbForRequest(request);
  const ip = getClientIp(request);

  const target = await db
    .selectFrom('users')
    .select(['id', 'username', 'is_admin'])
    .where('id', '=', userId)
    .executeTakeFirst();

  if (!target) return notFound('User not found');
  if (target.is_admin) return forbidden('Cannot impersonate other admins');

  const sessionId = crypto.randomUUID();
  const tokens = await generateTokens({
    userId: target.id,
    username: target.username,
    isAdmin: target.is_admin,
    sessionId,
    impersonatedBy: auth.user.userId,
  });

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await db
    .insertInto('sessions')
    .values({
      user_id: target.id,
      refresh_token: tokens.refreshToken,
      ip,
      user_agent: request.headers.get('user-agent'),
      expires_at: expiresAt,
      impersonated_by: auth.user.userId,
    })
    .execute();

  await db
    .insertInto('permission_audit')
    .values({
      user_id: userId,
      action: 'impersonation_started',
      resource: 'sessions',
      metadata: JSON.stringify({ impersonatedBy: auth.user.userId, adminUsername: auth.user.username }),
      performed_by: auth.user.userId,
    })
    .execute();

  const response = json({ success: true, username: target.username });
  setCookies(response, tokens);
  return response;
}
