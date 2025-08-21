import { NextRequest, NextResponse } from "next/server";
import { verifyToken, invalidateSession, setSecurityHeaders } from "@/lib/auth";
import { getClientIP } from "@lib/services/common/security";
import { logSecurityEvent } from "@lib/database/security";

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Get access token from cookie
    const accessToken = request.cookies.get("access_token")?.value;

    let userId = "unknown";

    if (accessToken) {
      const decoded = verifyToken(accessToken, "access");
      if (decoded) {
        userId = decoded.userId;

        // Invalidate session if present
        if (decoded.sessionId) {
          invalidateSession(decoded.sessionId);
        }
      }
    }

    await logSecurityEvent({
      timestamp: new Date(),
      event: "user_logout",
      userId,
      ip,
      userAgent,
      details: {}
    });

    const response = NextResponse.json({
      message: "Logged out successfully"
    });

    // Clear authentication cookies
    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/"
    });

    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/"
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Logout error:", error);

    await logSecurityEvent({
      timestamp: new Date(),
      event: "logout_error",
      ip,
      userAgent,
      details: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return setSecurityHeaders(NextResponse.json({ error: "Logout failed" }, { status: 500 }));
  }
}
