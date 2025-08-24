import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getTeamById, updateTeam, deleteTeam, checkTeamAvailability } from "@lib/database/team";
import type { CreateTeamRequest, PlayerRole } from "@lib/types";
import type { JWTPayload } from "@lib/types/auth";

// GET /api/v1/teams/[teamId] - Get specific team
export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const teamId = url.pathname.split("/").pop()!;

    const team = await getTeamById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Users can only view their own teams (for now)
    if (team.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// PUT /api/v1/teams/[teamId] - Update team
export const PUT = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const teamId = url.pathname.split("/").pop()!;

    const teamData: Partial<CreateTeamRequest> = await req.json();

    // Validate player roles if players are being updated
    if (teamData.players?.main) {
      if (teamData.players.main.length !== 5) {
        return NextResponse.json({ error: "Main roster must have exactly 5 players" }, { status: 400 });
      }

      const roles = teamData.players.main.map((p) => p.role);
      const requiredRoles: PlayerRole[] = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"];
      const hasAllRoles = requiredRoles.every((role) => roles.includes(role));
      const hasUniqueRoles = new Set(roles).size === roles.length;

      if (!hasAllRoles || !hasUniqueRoles) {
        return NextResponse.json(
          {
            error: "Team must have exactly one player per role: TOP, JUNGLE, MID, BOTTOM, SUPPORT"
          },
          { status: 400 }
        );
      }
    }

    // Check name and tag availability if they're being updated
    if (teamData.name || teamData.tag) {
      const currentTeam = await getTeamById(teamId);
      if (!currentTeam || (currentTeam.userId !== user.userId && !user.isAdmin)) {
        return NextResponse.json({ error: "Team not found or forbidden" }, { status: 404 });
      }

      const availability = await checkTeamAvailability(
        teamData.name || currentTeam.name,
        teamData.tag || currentTeam.tag,
        teamId
      );

      if (teamData.name && !availability.nameAvailable) {
        return NextResponse.json({ error: "Team name is already taken" }, { status: 409 });
      }
      // Team tags are not unique - multiple teams can have the same tag
    }

    const updatedTeam = await updateTeam(teamId, user.userId, teamData);

    if (!updatedTeam) {
      return NextResponse.json({ error: "Team not found or forbidden" }, { status: 404 });
    }

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// DELETE /api/v1/teams/[teamId] - Delete team
export const DELETE = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const teamId = url.pathname.split("/").pop()!;

    const success = await deleteTeam(teamId, user.userId);

    if (!success) {
      return NextResponse.json({ error: "Team not found or forbidden" }, { status: 404 });
    }

    return NextResponse.json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
