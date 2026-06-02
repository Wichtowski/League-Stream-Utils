import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, error, unauthorized, forbidden, notFound, parseBody } from '@/api/_helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const { id } = await params;
  const body = await parseBody<{
    status?: string;
    organizerId?: string;
  }>(request);
  if (!body) return error('Request body required');

  const db = getDbForRequest(request);
  const set: Record<string, unknown> = { updated_at: new Date() };
  if (body.status) set.status = body.status;
  if (body.organizerId) set.organizer_id = body.organizerId;

  const updated = await db
    .updateTable('tournaments')
    .set(set)
    .where('id', '=', id)
    .returning(['id', 'name', 'status', 'organizer_id'])
    .executeTakeFirst();

  if (!updated) return notFound('Tournament not found');

  await db
    .insertInto('permission_audit')
    .values({
      user_id: null,
      action: 'admin_tournament_update',
      resource: 'tournaments',
      resource_id: id,
      metadata: JSON.stringify(body),
      performed_by: auth.user.userId,
    })
    .execute();

  return json(updated);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);
  if (!auth.user.isAdmin) return forbidden();

  const { id } = await params;
  const db = getDbForRequest(request);

  const tournament = await db
    .selectFrom('tournaments')
    .select('id')
    .where('id', '=', id)
    .executeTakeFirst();
  if (!tournament) return notFound('Tournament not found');

  await db.deleteFrom('tournaments').where('id', '=', id).execute();

  await db
    .insertInto('permission_audit')
    .values({
      user_id: null,
      action: 'admin_tournament_delete',
      resource: 'tournaments',
      resource_id: id,
      performed_by: auth.user.userId,
    })
    .execute();

  return json({ success: true });
}
