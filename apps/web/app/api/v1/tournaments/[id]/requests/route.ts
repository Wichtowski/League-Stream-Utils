import type { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { canManageTournament } from '@lsu/auth/permissions';
import { getDbForRequest } from '@lsu/db';
import { json, unauthorized, forbidden } from '@/api/_helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id: tournamentId } = await params;
  const db = getDbForRequest(request);

  if (!(await canManageTournament(db, auth.user.userId, tournamentId))) return forbidden();

  const requests = await db
    .selectFrom('tournament_join_requests as tjr')
    .innerJoin('teams', 'teams.id', 'tjr.team_id')
    .innerJoin('users', 'users.id', 'tjr.requested_by')
    .select([
      'tjr.id',
      'tjr.tournament_id',
      'tjr.team_id',
      'tjr.requested_by',
      'tjr.status',
      'tjr.message',
      'tjr.responded_by',
      'tjr.responded_at',
      'tjr.created_at',
      'teams.name as team_name',
      'teams.tag as team_tag',
      'users.username as requested_by_username',
    ])
    .where('tjr.tournament_id', '=', tournamentId)
    .orderBy('tjr.created_at', 'desc')
    .execute();

  return json(requests);
}
