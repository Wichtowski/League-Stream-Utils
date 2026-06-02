import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, unauthorized, forbidden } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const db = getDbForRequest(request);
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 500);
  const offset = Number(url.searchParams.get('offset') ?? 0);
  const successOnly = url.searchParams.get('success');

  let query = db
    .selectFrom('login_attempts')
    .selectAll()
    .orderBy('attempted_at', 'desc')
    .limit(limit)
    .offset(offset);

  if (successOnly === 'true') query = query.where('success', '=', true);
  if (successOnly === 'false') query = query.where('success', '=', false);

  const attempts = await query.execute();
  return json(attempts);
}
