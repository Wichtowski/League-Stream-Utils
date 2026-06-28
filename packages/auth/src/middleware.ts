import { verifyToken } from "./jwt";
import { checkRateLimit, getRateLimitHeaders } from "./rate-limit";

interface RequestLike {
  headers: { get(name: string): string | null };
  cookies?: { get(name: string): { value: string } | undefined };
}

export function getClientIp(request: RequestLike): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

function getTokenFromRequest(request: RequestLike): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return request.cookies?.get("access_token")?.value ?? null;
}

function isOfflineMode(request: RequestLike): boolean {
  return request.cookies?.get("app_mode")?.value === "offline";
}

const OFFLINE_AUTH = {
  authenticated: true as const,
  user: {
    userId: "local",
    username: "Local User",
    isAdmin: true,
    sessionId: "local",
    impersonatedBy: undefined,
  },
};

export async function withAuth(request: RequestLike) {
  if (isOfflineMode(request)) {
    return OFFLINE_AUTH;
  }

  const ip = getClientIp(request);

  if (!checkRateLimit(ip)) {
    return {
      authenticated: false as const,
      error: "Rate limit exceeded",
      status: 429,
      headers: getRateLimitHeaders(ip),
    };
  }

  const token = getTokenFromRequest(request);
  if (!token) {
    return { authenticated: false as const, error: "No token provided", status: 401 };
  }

  const payload = await verifyToken(token, "access");
  if (!payload) {
    return { authenticated: false as const, error: "Invalid or expired token", status: 401 };
  }

  return {
    authenticated: true as const,
    user: {
      userId: payload.userId,
      username: payload.username,
      isAdmin: payload.isAdmin,
      sessionId: payload.sessionId,
      impersonatedBy: payload.impersonatedBy,
    },
  };
}

export function securityHeaders() {
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}
