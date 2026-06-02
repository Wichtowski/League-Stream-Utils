import type { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, error, unauthorized, notFound, parseBody } from '@/api/_helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);
  const commentator = await db
    .selectFrom('commentators')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
  if (!commentator) return notFound('Commentator not found');
  return json(commentator);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const body = await parseBody<{ name?: string; socialLinks?: Record<string, string> }>(request);
  if (!body) return error('Request body required');

  const db = getDbForRequest(request);
  const set: Record<string, unknown> = {};
  if (body.name !== undefined) set.name = body.name;
  if (body.socialLinks !== undefined) set.social_links = JSON.stringify(body.socialLinks);

  const updated = await db
    .updateTable('commentators')
    .set(set)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst();
  if (!updated) return notFound('Commentator not found');
  return json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { id } = await params;
  const db = getDbForRequest(request);
  await db.deleteFrom('commentators').where('id', '=', id).execute();
  return json({ success: true });
}
