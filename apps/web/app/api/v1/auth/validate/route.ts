import type { NextRequest } from 'next/server';
import { validateSession } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (!refreshToken) return json({ user: null });

  const db = getDbForRequest(request);
  const result = await validateSession(db, refreshToken);
  if (!result) return json({ user: null });

  const response = json({ user: result.user });
  response.cookies.set('access_token', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });
  return response;
}
