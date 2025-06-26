import { NextRequest, NextResponse } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';
import { canUserCreateSession, updateUserSessionCount } from './database';
import { JWTPayload, SessionData } from './types/auth';
import { config } from '@lib/config';
import { checkRateLimit, getClientIP } from './utils/security';
import { logSecurityEvent } from './database/security';

const activeSessions = new Map<string, SessionData>();

export function generateTokens(payload: Omit<JWTPayload, 'tokenType'>): { accessToken: string; refreshToken: string; sessionId: string } {
  const sessionId = crypto.randomUUID();
  
  const accessToken = jwt.sign(
    { ...payload, tokenType: 'access', sessionId },
    config.jwt.secret as string,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );
  
  const refreshToken = jwt.sign(
    { ...payload, tokenType: 'refresh', sessionId },
    config.jwt.secret as string,
    { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
  );
  
  return { accessToken, refreshToken, sessionId };
}

export function verifyToken(token: string, expectedType: 'access' | 'refresh' = 'access'): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    if (decoded.tokenType !== expectedType) {
      return null;
    }
    
    return decoded;
  } catch (_error) {
    return null;
  }
}

export function setSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Remove unsafe-* in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' ws: wss:",
    "frame-ancestors 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

export function withAuth(handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Rate limiting
    if (!checkRateLimit(ip, config.security.rateLimitMax, config.security.rateLimitWindow)) {
      await logSecurityEvent({
        timestamp: new Date(),
        event: 'rate_limit_exceeded',
        ip,
        userAgent,
        details: { endpoint: request.url }
      });
      
      return setSecurityHeaders(NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      ));
    }

    const authHeader = request.headers.get('authorization');
    const accessTokenCookie = request.cookies.get('accessToken')?.value;

    // Check for authentication via either header or cookie
    if (!authHeader && !accessTokenCookie) {
      return setSecurityHeaders(NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ));
    }

    try {
      // Try cookie authentication first
      if (accessTokenCookie) {
        const decoded = verifyToken(accessTokenCookie, 'access');
        
        if (!decoded) {
          await logSecurityEvent({
            timestamp: new Date(),
            event: 'invalid_cookie_token',
            ip,
            userAgent,
            details: { endpoint: request.url }
          });
          
          return setSecurityHeaders(NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          ));
        }
        
        // Check if session is still valid
        if (decoded.sessionId) {
          const session = activeSessions.get(decoded.sessionId);
          if (!session || !session.isValid || session.expiresAt < new Date()) {
            return setSecurityHeaders(NextResponse.json(
              { error: 'Session expired' },
              { status: 401 }
            ));
          }
          
          // Update last used time
          session.lastUsedAt = new Date();
        }
        
        const response = await handler(request, decoded);
        return setSecurityHeaders(response);
      }
      
      // Try header authentication
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token, 'access');
        
        if (!decoded) {
          await logSecurityEvent({
            timestamp: new Date(),
            event: 'invalid_token',
            ip,
            userAgent,
            details: { endpoint: request.url }
          });
          
          return setSecurityHeaders(NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          ));
        }
        
        // Check if session is still valid
        if (decoded.sessionId) {
          const session = activeSessions.get(decoded.sessionId);
          if (!session || !session.isValid || session.expiresAt < new Date()) {
            return setSecurityHeaders(NextResponse.json(
              { error: 'Session expired' },
              { status: 401 }
            ));
          }
          
          // Update last used time
          session.lastUsedAt = new Date();
        }
        
        const response = await handler(request, decoded);
        return setSecurityHeaders(response);
        
      } else if (authHeader && authHeader.startsWith('Basic ')) {
        // Basic auth for admin only (legacy support)
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        const adminUsername = config.auth.username;
        const adminPassword = config.auth.password;

        if (username === adminUsername && password === adminPassword) {
          const adminUser: JWTPayload = {
            userId: 'admin',
            username: adminUsername,
            isAdmin: true
          };
          
          await logSecurityEvent({
            timestamp: new Date(),
            event: 'admin_basic_auth',
            userId: 'admin',
            ip,
            userAgent,
            details: { endpoint: request.url }
          });
          
          const response = await handler(request, adminUser);
          return setSecurityHeaders(response);
        } else {
          await logSecurityEvent({
            timestamp: new Date(),
            event: 'failed_basic_auth',
            ip,
            userAgent,
            details: { username, endpoint: request.url }
          });
          
          return setSecurityHeaders(NextResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 }
          ));
        }
      } else {
        return setSecurityHeaders(NextResponse.json(
          { error: 'Invalid authentication format' },
          { status: 401 }
        ));
      }
    } catch (error) {
      console.error('Authentication error:', error);
      
      await logSecurityEvent({
        timestamp: new Date(),
        event: 'auth_error',
        ip,
        userAgent,
        details: { error: error instanceof Error ? error.message : 'Unknown error', endpoint: request.url }
      });
      
      return setSecurityHeaders(NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      ));
    }
  };
}

export async function withSessionLimit(handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return withAuth(async (request: NextRequest, user: JWTPayload) => {
    if (user.isAdmin) {
      return handler(request, user);
    }

    const canCreate = await canUserCreateSession(user.userId);
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Daily session limit reached (2 sessions per day)' },
        { status: 429 }
      );
    }

    if (request.method === 'POST') {
      await updateUserSessionCount(user.userId);
    }

    return handler(request, user);
  });
}

export function createSession(sessionData: Omit<SessionData, 'id' | 'createdAt' | 'lastUsedAt' | 'isValid'>): string {
  const sessionId = crypto.randomUUID();
  const session: SessionData = {
    ...sessionData,
    id: sessionId,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    isValid: true
  };
  
  activeSessions.set(sessionId, session);
  return sessionId;
}

export function invalidateSession(sessionId: string): void {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.isValid = false;
  }
}

export function clearExpiredSessions(): void {
  const now = new Date();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(sessionId);
    }
  }
}

// Clean up expired sessions every hour
setInterval(clearExpiredSessions, 60 * 60 * 1000); 