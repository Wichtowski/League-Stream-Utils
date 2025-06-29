import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_HEADERS } from '@lib/utils/security';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Apply centralized security headers to all responses
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value);
    }

    // Strict Transport Security (only in production with HTTPS)
    if (process.env.NODE_ENV === 'production') {
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

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