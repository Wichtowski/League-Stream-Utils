import { NextRequest, NextResponse } from "next/server";
import { config } from "@lib/services/system/config";
import { setSecurityHeaders, generateTokens, createSession } from "@lib/auth";
import { createUser, getUserByEmail, getUserByUsername } from "@lib/database";
import { hashPassword } from "@lib/services/common/security";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  id_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return setSecurityHeaders(NextResponse.json({ error: "Missing code" }, { status: 400 }));
  }

  const clientId = config.auth.google.clientId;
  const clientSecret = config.auth.google.clientSecret;
  const redirectUri = config.auth.google.callbackUrl;

  if (!clientId || !clientSecret || !redirectUri) {
    return setSecurityHeaders(NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 }));
  }

  // 1) Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return setSecurityHeaders(NextResponse.json({ error: "Token exchange failed", details: errText }, { status: 400 }));
  }

  const tokenData = (await tokenRes.json()) as GoogleTokenResponse;

  // 2) Get user info via id_token
  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });

  if (!userInfoRes.ok) {
    const errText = await userInfoRes.text();
    return setSecurityHeaders(
      NextResponse.json({ error: "Failed to fetch user info", details: errText }, { status: 400 })
    );
  }

  const profile = (await userInfoRes.json()) as GoogleUserInfo;

  // 3) Find or create local user
  const email = profile.email.toLowerCase();

  let user = await getUserByEmail(email);

  if (!user) {
    // Ensure username uniqueness; prefer the local-part of email
    const baseUsername = email.split("@")[0].slice(0, 30);
    let candidate = baseUsername || `user_${profile.sub}`;
    let suffix = 0;
    // Loop to find available username
    for (let i = 0; i < 1000; i += 1) {
      const existing = await getUserByUsername(candidate);
      if (!existing) break;
      suffix += 1;
      candidate = `${baseUsername}_${suffix}`.slice(0, 30);
    }

    // Create a random password placeholder so the account can also use password reset later if needed
    const randomPassword = crypto.randomUUID() + "!Gg9#";
    const hashed = await hashPassword(randomPassword);

    user = await createUser({
      username: candidate,
      password: hashed,
      passwordHistory: [],
      email
    });
  }

  // 4) Issue application tokens and cookies
  const { accessToken, refreshToken, sessionId } = generateTokens({
    userId: (user as { _id?: string })._id ?? "",
    username: user.username,
    isAdmin: user.isAdmin
  });

  createSession({
    id: sessionId,
    userId: (user as { _id?: string })._id ?? "",
    username: user.username,
    isAdmin: user.isAdmin,
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  const response = new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"/><title>Authenticated</title></head><body style="background:#0b0b0b;color:#e5e7eb;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div>Authentication complete. You can close this window.</div><script>(function(){try{if(window.opener&&!window.opener.closed){window.opener.postMessage({type:'oauth:google:success'}, window.location.origin);} }catch(e){} window.close(); setTimeout(function(){},3000);}());</script></body></html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );

  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/"
  });

  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/"
  });

  // Do not apply strict CSP here to allow inline script to close the popup
  return response;
}
