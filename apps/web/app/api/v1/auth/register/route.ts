import type { NextRequest } from 'next/server';
import { register, getClientIp } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, error, parseBody } from '@/api/_helpers';

export async function POST(request: NextRequest) {
  const body = await parseBody<{ username: string; email: string; password: string }>(request);
  if (!body?.username || !body?.email || !body?.password) {
    return error('Username, email, and password required');
  }

  const db = getDbForRequest(request);
  const ip = getClientIp(request);
  const result = await register(db, body.username, body.email, body.password, ip);

  if (!result.success) {
    return error(result.error, 409);
  }

  return json({ user: result.user }, 201);
}
