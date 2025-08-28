import { NextRequest, NextResponse } from "next/server";
import jwt, { SignOptions } from "jsonwebtoken";
import { canUserCreateSession, updateUserSessionCount } from "../database";
import { JWTPayload, SessionData } from "../types/auth";
import { config } from "@lib/services/system/config";
import { checkRateLimit, getClientIP } from "@lib/services/common/security";
import { logSecurityEvent } from "../database/security";

const CSP_RULES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self' ws: wss: http://127.0.0.1:2999 https://127.0.0.1:2999",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'"
].join("; ");

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": CSP_RULES
};

const activeSessions = new Map<string, SessionData>();

export function generateTokens(payload: { userId: string; username: string; isAdmin: boolean }): {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
} {
  const sessionId = crypto.randomUUID();

  const accessToken = jwt.sign(
    { ...payload, tokenType: "access", sessionId },
    config.jwt.secret as string,
    { expiresIn: config.jwt.expiresIn } as SignOptions
  );

  const refreshToken = jwt.sign(
    { ...payload, tokenType: "refresh", sessionId },
    config.jwt.secret as string,
    { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
  );

  return { accessToken, refreshToken, sessionId };
}

interface DecodedToken extends JWTPayload {
  tokenType: "access" | "refresh";
  sessionId?: string;
}

export function verifyToken(
  token: string,
  expectedType: "access" | "refresh" = "access"
): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as DecodedToken;

    if (decoded.tokenType !== expectedType) {
      return null;
    }

    return decoded;
  } catch (_error) {
    return null;
  }
}

export function setSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export function withAuth(handler: (request: NextRequest, user: DecodedToken) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Rate limiting
    if (!checkRateLimit(ip, config.security.rateLimitMax, config.security.rateLimitWindow)) {
      await logSecurityEvent({
        timestamp: new Date(),
        event: "rate_limit_exceeded",
        ip,
        userAgent,
        details: { endpoint: request.url }
      });

      return setSecurityHeaders(NextResponse.json({ error: "Too many requests" }, { status: 429 }));
    }

    const authHeader = request.headers.get("authorization");
    const accessTokenCookie = request.cookies.get("access_token")?.value;

    // Check for authentication via either header or cookie
    if (!authHeader && !accessTokenCookie) {
      console.log("[AUTH] No authentication found - no header or cookie");
      return setSecurityHeaders(NextResponse.json({ error: "Authentication required" }, { status: 401 }));
    }

    try {
      if (accessTokenCookie) {
        const decoded = verifyToken(accessTokenCookie, "access");

        if (!decoded) {
          await logSecurityEvent({
            timestamp: new Date(),
            event: "invalid_cookie_token",
            ip,
            userAgent,
            details: { endpoint: request.url }
          });

          return setSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }));
        }

        if (decoded.sessionId) {
          const session = activeSessions.get(decoded.sessionId);
          if (session) {
            if (!session.isValid || session.expiresAt < new Date()) {
              return setSecurityHeaders(NextResponse.json({ error: "Session expired" }, { status: 401 }));
            }
            session.lastUsedAt = new Date();
          }
        }

        const response = await handler(request, decoded);
        return setSecurityHeaders(response);
      }

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token, "access");

        if (!decoded) {
          await logSecurityEvent({
            timestamp: new Date(),
            event: "invalid_token",
            ip,
            userAgent,
            details: { endpoint: request.url }
          });

          return setSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }));
        }

        if (decoded.sessionId) {
          const session = activeSessions.get(decoded.sessionId);
          if (session) {
            if (!session.isValid || session.expiresAt < new Date()) {
              return setSecurityHeaders(NextResponse.json({ error: "Session expired" }, { status: 401 }));
            }
            session.lastUsedAt = new Date();
          }
        }

        const response = await handler(request, decoded);
        return setSecurityHeaders(response);
      } else {
        return setSecurityHeaders(NextResponse.json({ error: "Invalid authentication format" }, { status: 401 }));
      }
    } catch (error) {
      console.error("Authentication error:", error);

      await logSecurityEvent({
        timestamp: new Date(),
        event: "auth_error",
        ip,
        userAgent,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          endpoint: request.url
        }
      });

      return setSecurityHeaders(NextResponse.json({ error: "Authentication failed" }, { status: 401 }));
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
      return NextResponse.json({ error: "Daily session limit reached (2 sessions per day)" }, { status: 429 });
    }

    if (request.method === "POST") {
      await updateUserSessionCount(user.userId);
    }

    return handler(request, user);
  });
}

export function createSession(
  sessionData: Omit<SessionData, "id" | "createdAt" | "lastUsedAt" | "isValid"> & { id?: string }
): string {
  const sessionId = sessionData.id || crypto.randomUUID();
  const { id: _id, ...restSessionData } = sessionData;
  const session: SessionData = {
    ...restSessionData,
    id: sessionId,
    createdAt: new Date(),
    lastUsedAt: new Date(),
    isValid: true
  };

  activeSessions.set(sessionId, session);
  console.log("[AUTH] Created new session:", sessionId, "Total sessions:", activeSessions.size);
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

setInterval(clearExpiredSessions, 60 * 60 * 1000);
