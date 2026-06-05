const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

import { externalClient } from "./external-client";

interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

function getConfig(): GoogleConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error("Google OAuth not configured");
  }

  return { clientId, clientSecret, callbackUrl };
}

export function getGoogleAuthUrl(): string {
  const config = getConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_URL}?${params}`;
}

interface GoogleTokens {
  access_token: string;
  id_token: string;
  refresh_token?: string;
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokens> {
  const config = getConfig();

  return externalClient.post<GoogleTokens>(
    GOOGLE_TOKEN_URL,
    new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.callbackUrl,
    }),
  );
}

interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

export async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
  return externalClient.get<GoogleUser>(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
