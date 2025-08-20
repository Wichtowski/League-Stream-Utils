import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/utils";
import { connectToDatabase } from "@lib/database/connection";
import { TeamModel } from "@lib/database/models";
import type { JWTPayload } from "@lib/types/auth";


export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { teamIds, verified = true, verifyPlayers = true } = await req.json();

    if (!teamIds || !Array.isArray(teamIds)) {
      return NextResponse.json({ error: "teamIds array is required" }, { status: 400 });
    }

    await connectToDatabase();

    const results = {
      successful: [] as string[],
      failed: [] as { teamId: string; error: string }[]
    };

    for (const teamId of teamIds) {
      try {
        const team = await TeamModel.findOne({ id: teamId }).exec();
        if (!team) {
          results.failed.push({ teamId, error: "Team not found" });
          continue;
        }

        team.verified = verified;
        if (verified) {
          team.verificationSubmittedAt = new Date();
        }

        if (verifyPlayers && verified) {
          team.players?.main?.forEach((player) => {
            player.verified = true;
            player.verifiedAt = new Date();
          });

          team.players?.substitutes?.forEach((player) => {
            player.verified = true;
            player.verifiedAt = new Date();
          });
        }

        team.updatedAt = new Date();
        await team.save();

        results.successful.push(teamId);
      } catch (error) {
        results.failed.push({
          teamId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      message: `Bulk verification completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      results
    });
  } catch (error) {
    console.error("Error in bulk team verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    if (!user.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await connectToDatabase();

    const teams = await TeamModel.find(
      {},
      {
        id: 1,
        name: 1,
        tag: 1,
        verified: 1,
        userId: 1,
        createdAt: 1,
        "players.main.verified": 1,
        "players.substitutes.verified": 1
      }
    )
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const teamsWithStats = teams.map((team) => ({
      id: team.id,
      name: team.name,
      tag: team.tag,
      verified: team.verified,
      userId: team.userId,
      createdAt: team.createdAt,
      playerStats: {
        mainVerified: team.players?.main?.filter((p) => p.verified).length || 0,
        mainTotal: team.players?.main?.length || 0,
        subsVerified: team.players?.substitutes?.filter((p) => p.verified).length || 0,
        subsTotal: team.players?.substitutes?.length || 0
      },
      allPlayersVerified: [...(team.players?.main || []), ...(team.players?.substitutes || [])].every((p) => p.verified)
    }));

    return NextResponse.json({ teams: teamsWithStats });
  } catch (error) {
    console.error("Error fetching teams for admin verification:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
