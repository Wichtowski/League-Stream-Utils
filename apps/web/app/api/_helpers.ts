import { NextResponse } from 'next/server';
import { createLogger } from '@lsu/logger';

const log = createLogger('api');

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  if (status >= 500) log.error(message, { status });
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized(message = 'Unauthorized') {
  return error(message, 401);
}

export function forbidden(message = 'Forbidden') {
  return error(message, 403);
}

export function notFound(message = 'Not found') {
  return error(message, 404);
}

export async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function setCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
) {
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set('access_token', tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 3600,
  });
  response.cookies.set('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 3600,
  });
}

export function clearCookies(response: NextResponse) {
  response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
  response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
}
