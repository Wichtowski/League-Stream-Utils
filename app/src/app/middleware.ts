import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Strict Transport Security (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Remove unsafe-* for production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Add CSRF protection for state-changing methods
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  
  if (isStateChanging && isApiRoute) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');
    
    // Simple CSRF check - ensure requests come from same origin
    if (origin && !origin.includes(host || '')) {
      return NextResponse.json(
        { error: 'CSRF protection: Invalid origin' },
        { status: 403 }
      );
    }
    
    if (referer && !referer.includes(host || '')) {
      return NextResponse.json(
        { error: 'CSRF protection: Invalid referer' },
        { status: 403 }
      );
    }
  }

  return response;
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