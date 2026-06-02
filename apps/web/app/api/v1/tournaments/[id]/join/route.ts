import type { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { isTeamOwner } from '@lsu/auth/permissions';
import { getDbForRequest } from '@lsu/db';
import { json, error, unauthorized, forbidden, notFound, parseBody } from '@/api/_helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id: tournamentId } = await params;
  const body = await parseBody<{ teamId: string; message?: string }>(request);
  if (!body?.teamId) return error('teamId required');

  const db = getDbForRequest(request);

  const tournament = await db
    .selectFrom('tournaments')
    .select('id')
    .where('id', '=', tournamentId)
    .executeTakeFirst();
  if (!tournament) return notFound('Tournament not found');

  if (!(await isTeamOwner(db, auth.user.userId, body.teamId))) {
    return forbidden('Only the team owner can submit join requests');
  }

  const existing = await db
    .selectFrom('tournament_join_requests')
    .select('id')
    .where('tournament_id', '=', tournamentId)
    .where('team_id', '=', body.teamId)
    .where('status', '=', 'pending')
    .executeTakeFirst();

  if (existing) return error('A pending join request already exists for this team', 409);

  const alreadyRegistered = await db
    .selectFrom('tournament_teams')
    .select('id')
    .where('tournament_id', '=', tournamentId)
    .where('team_id', '=', body.teamId)
    .executeTakeFirst();

  if (alreadyRegistered) return error('Team is already registered in this tournament', 409);

  const joinRequest = await db
    .insertInto('tournament_join_requests')
    .values({
      tournament_id: tournamentId,
      team_id: body.teamId,
      requested_by: auth.user.userId,
      message: body.message ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return json(joinRequest, 201);
}
