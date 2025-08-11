import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { verifyAllTeamPlayers, getTeamById } from "@lib/database/team";
import { connectToDatabase } from "@lib/database/connection";
import { TeamModel } from "@lib/database/models";
import type { JWTPayload } from "@lib/types/auth";
import { Player } from "@/lib/types/game";

// POST /api/v1/teams/[teamId]/verify-all - Verify all players on a team
export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const teamId = pathParts[4]; // /api/v1/teams/[teamId]/verify-all -> index 4

    console.log("Verify all players - URL:", url.pathname, "TeamId:", teamId, "User:", user.userId, "IsAdmin:", user.isAdmin);

    // First check if the team exists
    const team = await getTeamById(teamId);
    if (!team) {
      console.log("Team not found with ID:", teamId);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    console.log("Found team:", team.name, "ID:", team.id, "Owner:", team.userId);

    // Check if user is admin or team owner
    if (!user.isAdmin && team.userId !== user.userId) {
      console.log("User not authorized to verify this team");
      return NextResponse.json({ error: "Forbidden - You can only verify your own teams" }, { status: 403 });
    }

    // If user is admin, use direct database update
    if (user.isAdmin) {
      await connectToDatabase();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedTeam = await (TeamModel as any).findOne({ id: teamId });
      if (!updatedTeam) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      const now = new Date();

      // Verify all main players
      updatedTeam.players.main = updatedTeam.players.main.map((player: Player) => ({
        ...player,
        verified: true,
        verifiedAt: now,
        updatedAt: now
      }));

      // Verify all substitute players
      updatedTeam.players.substitutes = updatedTeam.players.substitutes.map((player: Player) => ({
        ...player,
        verified: true,
        verifiedAt: now,
        updatedAt: now
      }));

      updatedTeam.updatedAt = now;
      
      // Auto-verify team if 5+ players are verified
      const verifiedPlayerCount = updatedTeam.players.main.length + updatedTeam.players.substitutes.length;
      if (verifiedPlayerCount >= 5) {
        updatedTeam.verified = true;
        updatedTeam.verificationSubmittedAt = now;
      }
      
      await updatedTeam.save();
      
      const finalTeam = await getTeamById(teamId);
      return NextResponse.json({
        message: verifiedPlayerCount >= 5 
          ? `All players verified and team auto-verified! (${verifiedPlayerCount} players)`
          : `All players verified successfully by admin`,
        team: finalTeam,
        teamVerified: updatedTeam.verified,
        verifiedPlayerCount
      });
    } else {
      // If user is team owner, use the existing function
      const updatedTeam = await verifyAllTeamPlayers(teamId, user.userId);
      if (!updatedTeam) {
        return NextResponse.json({ error: "Team not found or forbidden" }, { status: 404 });
      }

      // Check if team should be auto-verified
      const verifiedPlayerCount = updatedTeam.players.main.length + updatedTeam.players.substitutes.length;
      if (verifiedPlayerCount >= 5) {
        // Update team verification status
        await connectToDatabase();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const teamModel = await (TeamModel as any).findOne({ id: teamId });
        if (teamModel) {
          teamModel.verified = true;
          teamModel.verificationSubmittedAt = new Date();
          teamModel.updatedAt = new Date();
          await teamModel.save();
          
          // Get updated team data
          const finalTeam = await getTeamById(teamId);
          return NextResponse.json({
            message: `All players verified and team auto-verified! (${verifiedPlayerCount} players)`,
            team: finalTeam,
            teamVerified: true,
            verifiedPlayerCount
          });
        }
      }

      return NextResponse.json({
        message: `All players verified successfully (${verifiedPlayerCount} players)`,
        team: updatedTeam,
        teamVerified: updatedTeam.verified,
        verifiedPlayerCount
      });
    }
  } catch (error) {
    console.error("Error verifying all team players:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// GET /api/v1/teams/[teamId]/verify-all - Get verification status
export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const teamId = pathParts[4];

    const team = await getTeamById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Users can only view their own teams (for now)
    if (team.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const verificationStatus = {
      teamVerified: team.verified,
      verificationSubmittedAt: team.verificationSubmittedAt,
      playersVerified: {
        main: team.players.main.map((p) => ({
          id: p.id,
          inGameName: p.inGameName,
          verified: p.verified,
          verifiedAt: p.verifiedAt
        })),
        substitutes: team.players.substitutes.map((p) => ({
          id: p.id,
          inGameName: p.inGameName,
          verified: p.verified,
          verifiedAt: p.verifiedAt
        }))
      },
      allPlayersVerified: [...team.players.main, ...team.players.substitutes].every((p) => p.verified)
    };

    return NextResponse.json({ team: verificationStatus });
  } catch (error) {
    console.error("Error getting team verification status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
