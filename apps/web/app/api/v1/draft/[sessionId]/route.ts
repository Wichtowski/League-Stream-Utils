import { NextRequest } from 'next/server';
import { withAuth } from '@lsu/auth';
import { getSession, deleteSession } from '@lsu/draft/queries';
import { json, unauthorized, notFound } from '@/api/_helpers';

interface Params {
  params: Promise<{ sessionId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { sessionId } = await params;
  const session = await getSession(sessionId);
  if (!session) return notFound('Session not found');
  return json(session);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const auth = await withAuth(request);
  if (!auth.authenticated) return unauthorized(auth.error);

  const { sessionId } = await params;
  await deleteSession(sessionId);
  return json({ success: true });
}
