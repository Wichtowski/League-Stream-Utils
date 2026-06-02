import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { checkPlanLimit } from '@lsu/auth/plan';
import { getDbForRequest } from '@lsu/db';
import { getTournaments, createTournament } from '@lsu/tournament/queries';
import { json, error, unauthorized, forbidden, parseBody } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const db = getDbForRequest(request);
  const tournaments = await getTournaments(db);
  return json(tournaments);
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const body = await parseBody<{
    name: string;
    type: 'ladder' | 'swiss' | 'round_robin' | 'groups';
    format: 'bo1' | 'bo3' | 'bo5';
    description?: string;
    startDate?: string;
    endDate?: string;
  }>(request);

  if (!body?.name || !body?.type || !body?.format) {
    return error('Name, type, and format required');
  }

  const db = getDbForRequest(request);

  const planCheck = await checkPlanLimit(db, auth.user.userId, 'maxTournamentsAsOrganizer');
  if (!planCheck.allowed) return forbidden(planCheck.reason);

  const tournament = await createTournament(db, {
    ...body,
    organizerId: auth.user.userId,
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    endDate: body.endDate ? new Date(body.endDate) : undefined,
  });
  return json(tournament, 201);
}
