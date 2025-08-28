import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@lib/database/user";
import { verifyToken, generateTokens, setSecurityHeaders } from "@lib/auth";
import { getClientIP } from "@lib/services/common/security";
import { logSecurityEvent } from "@lib/database/security";

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return setSecurityHeaders(NextResponse.json({ error: "Not authenticated" }, { status: 401 }));
    }

    // Try to verify refresh token
    const decoded = verifyToken(refreshToken, "refresh");
    if (!decoded) {
      // Refresh token is invalid/expired - force re-login
      await logSecurityEvent({
        timestamp: new Date(),
        event: "refresh_token_expired",
        ip,
        userAgent,
        details: {}
      });

      return setSecurityHeaders(NextResponse.json({ error: "Session expired, please login again" }, { status: 401 }));
    }

    // Refresh token is still valid - generate new access token
    const { accessToken } = generateTokens({
      userId: decoded.userId,
      username: decoded.username,
      isAdmin: decoded.isAdmin
    });

    // Log successful token refresh
    await logSecurityEvent({
      timestamp: new Date(),
      event: "token_refresh_success",
      userId: decoded.userId,
      ip,
      userAgent,
      details: {}
    });

    // For admin users, return admin info
    if (decoded.userId === "admin") {
      const adminUser = {
        id: "admin",
        username: decoded.username,
        isAdmin: true,
        email: "admin@system",
        tokenType: "unlimited",
        sessionId: "poweruser-session",
        sessionsCreatedToday: 0,
        lastSessionDate: new Date(),
        createdAt: new Date()
      };

      const response = NextResponse.json({
        user: adminUser
      });

      // Set new access token cookie
      response.cookies.set("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60, // 1 hour
        path: "/"
      });

      return setSecurityHeaders(response);
    }

    // For regular users, get from database
    const user = await getUserByUsername(decoded.username);
    if (!user) {
      return setSecurityHeaders(NextResponse.json({ error: "User not found" }, { status: 404 }));
    }

    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      user: userWithoutPassword
    });

    // Set new access token cookie
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/"
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Auth validation error:", error);

    await logSecurityEvent({
      timestamp: new Date(),
      event: "auth_validation_error",
      ip,
      userAgent,
      details: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return setSecurityHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
  }
}



