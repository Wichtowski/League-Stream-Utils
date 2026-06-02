import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/google',
  '/api/v1/champions',
  '/api/v1/ddragon',
];

const PROTECTED_PATHS = ['/modules', '/settings'];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname === '/') {
    return addSecurityHeaders(NextResponse.next());
  }

  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const isOffline = request.cookies.get('app_mode')?.value === 'offline';
    if (isOffline) {
      return addSecurityHeaders(NextResponse.next());
    }

    const token =
      request.cookies.get('access_token')?.value ?? request.cookies.get('refresh_token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets/).*)'],
};
