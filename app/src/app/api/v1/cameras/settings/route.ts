import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { TeamModel } from "@libTeam/database/models";
import { JWTPayload } from "@lib/types/auth";
import { getUserTeams } from "@libTeam/database";
import type { Team } from "@libTeam/types";

interface CameraTeam {
  teamId: string;
  teamName: string;
  teamStreamUrl?: string;
  players: Array<{
    playerId: string;
    playerName: string;
    role: string;
    url?: string;
    imagePath?: string;
    delayedUrl?: string;
    useDelay?: boolean;
  }>;
  globalTournamentMode?: boolean;
}

export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const teamId = url.searchParams.get("teamId");
    const userId = url.searchParams.get("userId");

    let teams: Team[] = [];

    if (user.isAdmin) {
      // Admins can see all teams with camera settings
      if (userId) {
        // Get teams for specific user (admin view)
        const userTeams = await getUserTeams(userId);
        teams = userTeams.filter(team => team.cameras);
      } else {
        // Get all teams with camera settings
        const rawTeams = await TeamModel.find({ 
          "cameras": { $exists: true, $ne: null }
        }).lean();
        teams = rawTeams as unknown as Team[];
      }
    } else {
      // Regular users see only their teams
      teams = await getUserTeams(user.userId);
      teams = teams.filter(team => team.cameras);
    }

    // Filter by specific team if requested
    if (teamId) {
      teams = teams.filter(team => team._id === teamId);
    }

    // Transform teams to camera format
    const cameraTeams: CameraTeam[] = teams.map(team => ({
      teamId: team._id,
      teamName: team.name,
      teamStreamUrl: team.cameras?.teamStreamUrl,
      players: team.cameras?.players || [],
      globalTournamentMode: team.cameras?.globalTournamentMode
    }));

    return NextResponse.json({ teams: cameraTeams });
  } catch (error) {
    console.error("Error fetching camera settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const { teams }: { teams: CameraTeam[] } = await req.json();

    // For regular users, verify they own all teams they're setting up cameras for
    if (!user.isAdmin) {
      const userTeams = await getUserTeams(user.userId);
      const userTeamIds = userTeams.map((team: Team) => team._id);

      const invalidTeams = teams.filter((team: CameraTeam) => !userTeamIds.includes(team.teamId));

      if (invalidTeams.length > 0) {
        return NextResponse.json(
          {
            error: "You can only configure cameras for teams you own",
            invalidTeams: invalidTeams.map(t => t.teamName)
          },
          { status: 403 }
        );
      }
    }

    // Update camera settings for each team
    const updatePromises = teams.map(async (cameraTeam) => {
      return TeamModel.findByIdAndUpdate(
        cameraTeam.teamId,
        {
          $set: {
            "cameras.teamStreamUrl": cameraTeam.teamStreamUrl || "",
            "cameras.players": cameraTeam.players || [],
            "cameras.globalTournamentMode": cameraTeam.globalTournamentMode || false,
            "cameras.updatedAt": new Date()
          }
        },
        { new: true }
      );
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      message: "Camera settings updated successfully",
      updatedTeams: teams.length 
    });
  } catch (error) {
    console.error("Error saving camera settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
