import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { canManageTournament } from '@lsu/auth/permissions';
import { getDbForRequest } from '@lsu/db';
import { registerTeam, unregisterTeam } from '@lsu/tournament/queries';
import { json, error, unauthorized, forbidden, parseBody } from '@/api/_helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);

  if (!(await canManageTournament(db, auth.user.userId, id))) return forbidden();

  const body = await parseBody<{ teamId: string; seed?: number }>(request);
  if (!body?.teamId) return error('teamId required');

  const entry = await registerTeam(db, id, body.teamId, body.seed);
  return json(entry, 201);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);

  if (!(await canManageTournament(db, auth.user.userId, id))) return forbidden();

  const body = await parseBody<{ teamId: string }>(request);
  if (!body?.teamId) return error('teamId required');

  await unregisterTeam(db, id, body.teamId);
  return json({ success: true });
}
