import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { isTeamOwner, requirePermission } from '@lsu/auth/permissions';
import { getDbForRequest } from '@lsu/db';
import { getTeam, updateTeam, deleteTeam } from '@lsu/team/queries';
import { json, error, unauthorized, forbidden, notFound, parseBody } from '@/api/_helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);
  const team = await getTeam(db, id);
  if (!team) return notFound('Team not found');
  return json(team);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);

  const isOwner = await isTeamOwner(db, auth.user.userId, id);
  const isAdmin = await requirePermission(db, auth.user.userId, 'admin');
  if (!isOwner && !isAdmin) return forbidden();

  const body = await parseBody<{
    name?: string;
    tag?: string;
    colors?: { primary: string; secondary: string; accent: string };
    country?: string;
  }>(request);

  if (!body) return error('Request body required');

  const team = await updateTeam(db, id, body);
  if (!team) return notFound('Team not found');
  return json(team);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);

  const isOwner = await isTeamOwner(db, auth.user.userId, id);
  const isAdmin = await requirePermission(db, auth.user.userId, 'admin');
  if (!isOwner && !isAdmin) return forbidden();

  await deleteTeam(db, id);
  return json({ success: true });
}
