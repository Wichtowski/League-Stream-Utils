import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTeamById } from "@lib/database/team";
import { JWTPayload } from "@lib/types/auth";

export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ error: "teamId parameter is required" }, { status: 400 });
    }

    if (user.isAdmin) {
      return NextResponse.json({ hasAccess: true, reason: "admin" });
    }

    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ hasAccess: false, reason: "team_not_found" });
    }

    const hasAccess = (team.teamOwnerId ?? "") === user.userId;

    return NextResponse.json({
      hasAccess,
      reason: hasAccess ? "team_owner" : "not_authorized",
      teamName: team.name
    });
  } catch (error) {
    console.error("Error checking camera access:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
