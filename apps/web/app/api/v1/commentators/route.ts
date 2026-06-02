import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, error, unauthorized, notFound, parseBody } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const db = getDbForRequest(request);
  const all = await db.selectFrom('commentators').selectAll().orderBy('created_at', 'desc').execute();
  return json(all);
}

export async function POST(request: NextRequest) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const body = await parseBody<{
    name: string;
    socialLinks?: Record<string, string>;
  }>(request);

  if (!body?.name) return error('name required');

  const db = getDbForRequest(request);
  const created = await db
    .insertInto('commentators')
    .values({ name: body.name, social_links: body.socialLinks ? JSON.stringify(body.socialLinks) : null })
    .returningAll()
    .executeTakeFirstOrThrow();
  return json(created, 201);
}
