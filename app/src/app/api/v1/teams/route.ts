import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/utils";
import { createTeam, getUserTeams, checkTeamAvailability } from "@lib/database/team";
import type { CreateTeamRequest, PlayerRole } from "@lib/types";

export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const teams = await getUserTeams(user.userId);

    return NextResponse.json({ teams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const teamData: CreateTeamRequest = await req.json();

    if (!teamData.name || !teamData.tag || !teamData.players?.main?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (teamData.players.main.length !== 5) {
      return NextResponse.json({ error: "Main roster must have exactly 5 players" }, { status: 400 });
    }

    const roles = teamData.players.main.map((p) => p.role);
    const requiredRoles: PlayerRole[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];
    const hasAllRoles = requiredRoles.every((role) => roles.includes(role));
    const hasUniqueRoles = new Set(roles).size === roles.length;

    if (!hasAllRoles || !hasUniqueRoles) {
      return NextResponse.json(
        {
          error: "Team must have exactly one player per role: TOP, JUNGLE, MID, ADC, SUPPORT"
        },
        { status: 400 }
      );
    }

    const availability = await checkTeamAvailability(teamData.name, teamData.tag);
    if (!availability.nameAvailable) {
      return NextResponse.json({ error: "Team name is already taken" }, { status: 409 });
    }
    if (!availability.tagAvailable) {
      return NextResponse.json({ error: "Team tag is already taken" }, { status: 409 });
    }

    const team = await createTeam(user.userId, teamData);
    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
