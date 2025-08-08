import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@lib/database/user";
import { verifyToken, setSecurityHeaders } from "@lib/auth";
import { getClientIP } from "@lib/utils/security/security";
import { logSecurityEvent } from "@lib/database/security";

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Get access token from cookie
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      return setSecurityHeaders(NextResponse.json({ error: "Not authenticated" }, { status: 401 }));
    }

    // Verify access token
    const decoded = verifyToken(accessToken, "access");
    if (!decoded) {
      return setSecurityHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }));
    }

    // Log successful authentication check
    await logSecurityEvent({
      timestamp: new Date(),
      event: "user_info_access",
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
        sessionsCreatedToday: 0,
        lastSessionDate: new Date(),
        createdAt: new Date()
      };

      return setSecurityHeaders(
        NextResponse.json({
          user: adminUser
        })
      );
    }

    // For regular users, get from database
    const user = await getUserByUsername(decoded.username);
    if (!user) {
      return setSecurityHeaders(NextResponse.json({ error: "User not found" }, { status: 404 }));
    }

    const { password: _, ...userWithoutPassword } = user;

    return setSecurityHeaders(
      NextResponse.json({
        user: userWithoutPassword
      })
    );
  } catch (error) {
    console.error("Get user info error:", error);

    return setSecurityHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
  }
}
