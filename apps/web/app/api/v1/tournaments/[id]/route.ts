import type { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { canManageTournament } from '@lsu/auth/permissions';
import { getDbForRequest } from '@lsu/db';
import { getTournament, updateTournament, deleteTournament } from '@lsu/tournament/queries';
import { json, error, unauthorized, forbidden, notFound, parseBody } from '@/api/_helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);
  const tournament = await getTournament(db, id);
  if (!tournament) return notFound('Tournament not found');
  return json(tournament);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);

  if (!(await canManageTournament(db, auth.user.userId, id))) return forbidden();

  const body = await parseBody<Record<string, unknown>>(request);
  if (!body) return error('Request body required');

  if (body.startDate && typeof body.startDate === 'string')
    {body.startDate = new Date(body.startDate) as any;}
  if (body.endDate && typeof body.endDate === 'string')
    {body.endDate = new Date(body.endDate) as any;}

  const tournament = await updateTournament(db, id, body as any);
  if (!tournament) return notFound('Tournament not found');
  return json(tournament);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);

  if (!(await canManageTournament(db, auth.user.userId, id))) return forbidden();

  await deleteTournament(db, id);
  return json({ success: true });
}
