import { NextRequest } from 'next/server';
import { logout } from '@lsu/auth';
import { getDbForRequest } from '@lsu/db';
import { json, clearCookies } from '@/api/_helpers';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (refreshToken) {
    const db = getDbForRequest(request);
    await logout(db, refreshToken);
  }

  const response = json({ success: true });
  clearCookies(response);
  return response;
}
