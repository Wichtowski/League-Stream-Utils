import { NextRequest, NextResponse } from "next/server";
import { withAuth, setSecurityHeaders } from "@/lib/auth";
import { getSecurityEvents } from "@lib/database/security";
import { JWTPayload } from "@lib/types/auth";

export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  // Only allow admins to view security events
  if (!user.isAdmin) {
    return setSecurityHeaders(NextResponse.json({ error: "Admin access required" }, { status: 403 }));
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const events = await getSecurityEvents(userId || undefined, Math.min(limit, 100));

    return setSecurityHeaders(
      NextResponse.json({
        events,
        count: events.length
      })
    );
  } catch (error) {
    console.error("Error fetching security events:", error);
    return setSecurityHeaders(NextResponse.json({ error: "Failed to fetch security events" }, { status: 500 }));
  }
});
