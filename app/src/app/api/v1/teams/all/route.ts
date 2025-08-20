import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/utils";
import { getAllTeams } from "@lib/database/team";
import { JWTPayload } from "@lib/types/auth";

// GET /api/v1/teams/all - Get all teams (for tournament organizers)
export const GET = withAuth(async (_req: NextRequest, _user: JWTPayload) => {
  try {
    // This endpoint is intended for tournament organizers to see all available teams
    // We could add additional permission checks here if needed in the future
    const teams = await getAllTeams();

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching all teams:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
