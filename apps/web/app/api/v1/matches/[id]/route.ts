import type { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { getMatch, updateMatch } from '@lsu/tournament/queries';
import { json, error, unauthorized, notFound, parseBody } from '@/api/_helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);
  const match = await getMatch(db, id);
  if (!match) return notFound('Match not found');
  return json(match);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const body = await parseBody<{
    status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
    scoreBlue?: number;
    scoreRed?: number;
  }>(request);
  if (!body) return error('Request body required');

  const db = getDbForRequest(request);
  const match = await updateMatch(db, id, {
    ...body,
    completedAt: body.status === 'completed' ? new Date() : undefined,
  });
  if (!match) return notFound('Match not found');
  return json(match);
}
