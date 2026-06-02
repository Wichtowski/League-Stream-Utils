import type { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, unauthorized, forbidden } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const db = getDbForRequest(request);

  const tournaments = await db
    .selectFrom('tournaments')
    .innerJoin('users', 'users.id', 'tournaments.organizer_id')
    .select([
      'tournaments.id',
      'tournaments.name',
      'tournaments.type',
      'tournaments.format',
      'tournaments.status',
      'tournaments.organizer_id',
      'tournaments.start_date',
      'tournaments.end_date',
      'tournaments.created_at',
      'users.username as organizer_username',
    ])
    .orderBy('tournaments.created_at', 'desc')
    .execute();

  return json(tournaments);
}
