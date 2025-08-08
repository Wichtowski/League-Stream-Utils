import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@lib/database/user";
import { AuthCredentials } from "@lib/types";
import { config } from "@lib/config";
import { generateTokens, createSession, setSecurityHeaders } from "@lib/auth";
import { checkRateLimit, getClientIP, sanitizeInput, verifyPassword } from "@lib/utils/security/security";
import { recordLoginAttempt, isAccountLocked, clearLoginAttempts, logSecurityEvent } from "@lib/database/security";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Rate limiting by IP
    if (!checkRateLimit(ip, config.security.rateLimitMax, config.security.rateLimitWindow)) {
      await logSecurityEvent({
        timestamp: new Date(),
        event: "login_rate_limit_exceeded",
        ip,
        userAgent,
        details: {}
      });

      return setSecurityHeaders(
        NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 })
      );
    }

    const body = await request.json();
    const { username, password }: AuthCredentials = body;

    // Input validation and sanitization
    if (!username || !password) {
      return setSecurityHeaders(NextResponse.json({ error: "Username and password are required" }, { status: 400 }));
    }

    const sanitizedUsername = sanitizeInput(username);

    // Check if account is locked
    if (await isAccountLocked(sanitizedUsername)) {
      await logSecurityEvent({
        timestamp: new Date(),
        event: "login_attempt_locked_account",
        ip,
        userAgent,
        details: { username: sanitizedUsername }
      });

      return setSecurityHeaders(
        NextResponse.json(
          {
            error: "Account temporarily locked due to too many failed attempts"
          },
          { status: 423 }
        )
      );
    }

    // Check admin credentials first
    const adminUsername = config.auth.username;
    const adminPassword = config.auth.password;

    if (sanitizedUsername === adminUsername && password === adminPassword) {
      const { accessToken, refreshToken, sessionId } = generateTokens({
        userId: "admin",
        username: adminUsername,
        isAdmin: true
      });

      // Create session with the same sessionId that's in the JWT
      createSession({
        userId: "admin",
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ip,
        userAgent,
        id: sessionId
      });
      console.log("[LOGIN] Created session for admin:", sessionId);

      await recordLoginAttempt({
        identifier: sanitizedUsername,
        timestamp: new Date(),
        success: true,
        userAgent,
        ip
      });

      await logSecurityEvent({
        timestamp: new Date(),
        event: "admin_login_success",
        userId: "admin",
        ip,
        userAgent,
        details: {}
      });

      const response = NextResponse.json({
        message: "Admin login successful",
        user: {
          id: "admin",
          username: adminUsername,
          isAdmin: true
        }
      });

      // Set httpOnly cookies for tokens
      response.cookies.set("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60, // 1 hour
        path: "/"
      });

      response.cookies.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/"
      });

      console.log("[LOGIN] Set cookies for admin login");

      return setSecurityHeaders(response);
    }

    // Regular user authentication
    const user = await getUserByUsername(sanitizedUsername);
    if (!user) {
      await recordLoginAttempt({
        identifier: sanitizedUsername,
        timestamp: new Date(),
        success: false,
        userAgent,
        ip
      });

      await logSecurityEvent({
        timestamp: new Date(),
        event: "login_user_not_found",
        ip,
        userAgent,
        details: { username: sanitizedUsername }
      });

      return setSecurityHeaders(NextResponse.json({ error: "Invalid credentials" }, { status: 401 }));
    }

    // Check if user account is locked
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      await logSecurityEvent({
        timestamp: new Date(),
        event: "login_attempt_user_locked",
        userId: user.id,
        ip,
        userAgent,
        details: { username: sanitizedUsername }
      });

      return setSecurityHeaders(
        NextResponse.json({ error: "Account is locked. Please contact administrator." }, { status: 423 })
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      await recordLoginAttempt({
        identifier: sanitizedUsername,
        timestamp: new Date(),
        success: false,
        userAgent,
        ip
      });

      await logSecurityEvent({
        timestamp: new Date(),
        event: "login_invalid_password",
        userId: user.id,
        ip,
        userAgent,
        details: { username: sanitizedUsername }
      });

      return setSecurityHeaders(NextResponse.json({ error: "Invalid credentials" }, { status: 401 }));
    }

    const { accessToken, refreshToken, sessionId } = generateTokens({
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    });

    createSession({
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      ip,
      userAgent,
      id: sessionId
    });

    await clearLoginAttempts(sanitizedUsername);

    await recordLoginAttempt({
      identifier: sanitizedUsername,
      timestamp: new Date(),
      success: true,
      userAgent,
      ip
    });

    await logSecurityEvent({
      timestamp: new Date(),
      event: "user_login_success",
      userId: user.id,
      ip,
      userAgent,
      details: { username: sanitizedUsername }
    });

    const { password: _, ...userWithoutPassword } = user;

    const response = NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword
    });

    // Set httpOnly cookies for tokens
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60, // 1 hour
      path: "/"
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/"
    });

    return setSecurityHeaders(response);
  } catch (error) {
    console.error("Login error:", error);

    await logSecurityEvent({
      timestamp: new Date(),
      event: "login_server_error",
      ip,
      userAgent,
      details: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return setSecurityHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
  }
}
