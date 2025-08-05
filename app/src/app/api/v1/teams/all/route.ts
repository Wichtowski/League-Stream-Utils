import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getAllTeams } from "@lib/database/team";
import { getTeamLogoUrl } from "@lib/utils/media/image";
import { JWTPayload } from "@lib/types/auth";

// GET /api/v1/teams/all - Get all teams (for tournament organizers)
export const GET = withAuth(async (_req: NextRequest, _user: JWTPayload) => {
  try {
    // This endpoint is intended for tournament organizers to see all available teams
    // We could add additional permission checks here if needed in the future
    const teams = await getAllTeams();

    // Add logoUrl to each team for easier frontend consumption
    const teamsWithLogos = teams.map((team) => ({
      ...team,
      logoUrl: getTeamLogoUrl(team),
    }));

    return NextResponse.json({ teams: teamsWithLogos });
  } catch (error) {
    console.error("Error fetching all teams:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
