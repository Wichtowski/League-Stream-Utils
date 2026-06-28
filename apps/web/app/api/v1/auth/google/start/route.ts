import { NextResponse } from "next/server";

import { getGoogleAuthUrl } from "@lsu/auth";

export async function GET() {
  try {
    const url = getGoogleAuthUrl();

    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 503 });
  }
}
