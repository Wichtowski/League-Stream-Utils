import type { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { getTeams, createTeam } from '@lsu/team/queries';
import { json, error, unauthorized, parseBody } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const db = getDbForRequest(request);
  const teams = await getTeams(db);
  return json(teams);
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const body = await parseBody<{
    name: string;
    tag: string;
    colors: { primary: string; secondary: string; accent: string };
    country?: string;
  }>(request);

  if (!body?.name || !body?.tag || !body?.colors) {
    return error('Name, tag, and colors required');
  }

  const team = await createTeam(db, { ...body, ownerId: auth.user.userId });
  return json(team, 201);
}
