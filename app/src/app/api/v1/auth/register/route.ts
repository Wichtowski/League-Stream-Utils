import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByUsername, getUserByEmail } from "@lib/database";
import { UserRegistration } from "@lib/types";
import {
  validatePassword,
  sanitizeInput,
  checkRateLimit,
  getClientIP,
  hashPassword,
  updatePasswordHistory
} from "@lib/services/common/security";
import { logSecurityEvent } from "@lib/database/security";
import { setSecurityHeaders } from "@lib/auth";
import { config } from "@lib/services/system/config";

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // Rate limiting by IP
    if (!checkRateLimit(ip, config.security.rateLimitMax, config.security.rateLimitWindow)) {
      await logSecurityEvent({
        timestamp: new Date(),
        event: "register_rate_limit_exceeded",
        ip,
        userAgent,
        details: {}
      });

      return setSecurityHeaders(
        NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 })
      );
    }

    const body = await request.json();
    const { username, password, email }: UserRegistration = body;

    // Input validation
    if (!username || !password || !email) {
      return setSecurityHeaders(
        NextResponse.json({ error: "Username, password, and email are required" }, { status: 400 })
      );
    }

    // Sanitize inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedEmail = sanitizeInput(email);

    // Validate username length and format
    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 30) {
      return setSecurityHeaders(
        NextResponse.json({ error: "Username must be between 3 and 30 characters" }, { status: 400 })
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedUsername)) {
      return setSecurityHeaders(
        NextResponse.json(
          {
            error: "Username can only contain letters, numbers, underscores, and hyphens"
          },
          { status: 400 }
        )
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return setSecurityHeaders(NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 }));
    }
    
    // Strong password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return setSecurityHeaders(NextResponse.json({ error: passwordValidation.message }, { status: 400 }));
    }

    // Check for existing username
    const existingUser = await getUserByUsername(sanitizedUsername);
    if (existingUser) {
      await logSecurityEvent({
        timestamp: new Date(),
        event: "register_username_taken",
        ip,
        userAgent,
        details: { username: sanitizedUsername }
      });

      return setSecurityHeaders(NextResponse.json({ error: "Username already exists" }, { status: 409 }));
    }

    // Check for existing email
    const existingEmail = await getUserByEmail(sanitizedEmail);
    if (existingEmail) {
      await logSecurityEvent({
        timestamp: new Date(),
        event: "register_email_taken",
        ip,
        userAgent,
        details: { email: sanitizedEmail }
      });

      return setSecurityHeaders(NextResponse.json({ error: "Email already exists" }, { status: 409 }));
    }

    // Hash password securely
    const hashedPassword = await hashPassword(password);

    // Initialize password history with current password
    const passwordHistory = updatePasswordHistory(hashedPassword, []);

    // Create user
    const newUser = await createUser({
      username: sanitizedUsername,
      password: hashedPassword,
      passwordHistory,
      email: sanitizedEmail
    });

    await logSecurityEvent({
      timestamp: new Date(),
      event: "user_registration_success",
      userId: newUser._id,
      ip,
      userAgent,
      details: {
        username: sanitizedUsername,
        email: sanitizedEmail
      }
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return setSecurityHeaders(
      NextResponse.json(
        {
          message: "User created successfully",
          user: userWithoutPassword
        },
        { status: 201 }
      )
    );
  } catch (error) {
    console.error("Registration error:", error);

    await logSecurityEvent({
      timestamp: new Date(),
      event: "register_server_error",
      ip,
      userAgent,
      details: {
        error: error instanceof Error ? error.message : "Unknown error"
      }
    });

    return setSecurityHeaders(NextResponse.json({ error: "Internal server error" }, { status: 500 }));
  }
}
