import { getGoogleAuthUrl } from '@lsu/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const url = getGoogleAuthUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 503 });
  }
}
