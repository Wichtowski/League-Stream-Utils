import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow OBS routes to bypass authentication
  if (pathname.includes('/obs')) {
    return NextResponse.next();
  }
  
  // Allow API routes to pass through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // For all other routes, continue with normal processing
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
