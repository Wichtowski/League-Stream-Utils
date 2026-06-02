import type { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { canManageTournament } from '@lsu/auth/permissions';
import { getDbForRequest } from '@lsu/db';
import { json, error, unauthorized, forbidden, notFound, parseBody } from '@/api/_helpers';

interface Params {
  params: Promise<{ id: string; requestId: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id: tournamentId, requestId } = await params;
  const db = getDbForRequest(request);

  if (!(await canManageTournament(db, auth.user.userId, tournamentId))) return forbidden();

  const body = await parseBody<{ status: 'approved' | 'rejected' }>(request);
  if (!body?.status || !['approved', 'rejected'].includes(body.status)) {
    return error('status must be "approved" or "rejected"');
  }

  const joinRequest = await db
    .selectFrom('tournament_join_requests')
    .selectAll()
    .where('id', '=', requestId)
    .where('tournament_id', '=', tournamentId)
    .where('status', '=', 'pending')
    .executeTakeFirst();

  if (!joinRequest) return notFound('Join request not found or already processed');

  const updated = await db
    .updateTable('tournament_join_requests')
    .set({
      status: body.status,
      responded_by: auth.user.userId,
      responded_at: new Date(),
    })
    .where('id', '=', requestId)
    .returningAll()
    .executeTakeFirstOrThrow();

  if (body.status === 'approved') {
    await db
      .insertInto('tournament_teams')
      .values({
        tournament_id: tournamentId,
        team_id: joinRequest.team_id,
      })
      .execute();
  }

  return json(updated);
}
