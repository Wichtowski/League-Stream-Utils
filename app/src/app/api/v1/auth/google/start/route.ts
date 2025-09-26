import { NextRequest, NextResponse } from "next/server";
import { setSecurityHeaders } from "@lib/auth";
import { config } from "@lib/services/system/config";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const clientId = config.auth.google.clientId;
  const callbackUrl = encodeURIComponent(config.auth.google.callbackUrl);

  if (!clientId || !config.auth.google.callbackUrl) {
    return setSecurityHeaders(NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 }));
  }

  const scope = encodeURIComponent("openid email profile");
  const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${callbackUrl}&scope=${scope}&access_type=offline&prompt=consent`;

  return setSecurityHeaders(NextResponse.redirect(redirectUrl, { status: 302 }));
}
