import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/utils";
import { getTeamById } from "@lib/database/team";
import { connectToDatabase } from "@lib/database/connection";
import { TeamModel } from "@lib/database/models";
import type { JWTPayload } from "@lib/types/auth";

export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const teamId = pathParts[4];

    // Check if the team exists
    const team = await getTeamById(teamId);
    if (!team) {
      console.log("Team not found with ID:", teamId);
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }


    // Check if user is team owner or admin
    if (!user.isAdmin && team.userId !== user.userId) {
      console.log("User not authorized to submit verification for this team");
      return NextResponse.json({ error: "Forbidden - You can only submit verification for your own teams" }, { status: 403 });
    }

    // Check if team is already verified
    if (team.verified) {
      return NextResponse.json({ 
        error: "Team is already verified",
        team 
      }, { status: 400 });
    }

    // Check if enough players are verified for team verification (need 5+)
    const verifiedPlayerCount = [...team.players.main, ...team.players.substitutes].filter((p) => p.verified).length;
    
    if (verifiedPlayerCount < 5) {
      return NextResponse.json({ 
        error: "Need at least 5 verified players to submit team verification",
        playersVerified: verifiedPlayerCount,
        totalPlayers: team.players.main.length + team.players.substitutes.length,
        required: 5
      }, { status: 400 });
    }

    await connectToDatabase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedTeam = await (TeamModel as any).findOne({ id: teamId });
    if (!updatedTeam) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Auto-verify team if 5+ players are verified
    if (verifiedPlayerCount >= 5) {
      updatedTeam.verified = true;
      updatedTeam.verificationSubmittedAt = new Date();
      updatedTeam.updatedAt = new Date();
      await updatedTeam.save();
      
      const finalTeam = await getTeamById(teamId);

      return NextResponse.json({
        message: "Team automatically verified (5+ players verified)",
        team: finalTeam,
        status: "verified",
        verifiedPlayerCount
      });
    } else {
      // Submit for verification (sets verificationSubmittedAt but keeps verified = false)
      updatedTeam.verificationSubmittedAt = new Date();
      updatedTeam.updatedAt = new Date();
      await updatedTeam.save();
      
      const finalTeam = await getTeamById(teamId);

      return NextResponse.json({
        message: "Team verification submitted successfully",
        team: finalTeam,
        status: "pending_admin_review",
        verifiedPlayerCount
      });
    }

  } catch (error) {
    console.error("Error submitting team verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// GET /api/v1/teams/[teamId]/submit-verification - Get verification submission status
export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const teamId = pathParts[4];

    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user is team owner or admin
    if (!user.isAdmin && team.userId !== user.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const verificationStatus = {
      teamVerified: team.verified,
      verificationSubmittedAt: team.verificationSubmittedAt,
      canSubmit: !team.verified && 
                 [...team.players.main, ...team.players.substitutes].every((p) => p.verified),
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
    console.error("Error getting verification submission status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});