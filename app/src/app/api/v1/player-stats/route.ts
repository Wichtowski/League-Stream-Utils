import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { createPlayerStats, getPlayerStats, bulkCreatePlayerStats } from "@lib/database/playerStats";
import type { JWTPayload } from "@lib/types/auth";

// GET /api/v1/player-stats - Get player statistics with filters
export const GET = withAuth(async (req: NextRequest, _user: JWTPayload) => {
  try {
    const { searchParams } = new URL(req.url);

    const query = {
      playerId: searchParams.get("playerId") || undefined,
      teamId: searchParams.get("teamId") || undefined,
      tournamentId: searchParams.get("tournamentId") || undefined,
      matchId: searchParams.get("matchId") || undefined,
      championId: searchParams.get("championId") ? parseInt(searchParams.get("championId")!) : undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50,
      offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0
    };

    // Remove undefined values
    Object.keys(query).forEach((key) => {
      if (query[key as keyof typeof query] === undefined) {
        delete query[key as keyof typeof query];
      }
    });

    const stats = await getPlayerStats(query);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// POST /api/v1/player-stats - Create player statistics
export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const body = await req.json();

    // Check if it's a bulk create or single create
    if (Array.isArray(body)) {
      // Bulk create
      if (!user.isAdmin) {
        return NextResponse.json({ error: "Admin access required for bulk operations" }, { status: 403 });
      }

      const stats = await bulkCreatePlayerStats(body);
      return NextResponse.json({
        message: `Created ${stats.length} player stats records`,
        stats
      });
    } else {
      // Single create
      const stats = await createPlayerStats(body);
      return NextResponse.json({
        message: "Player stats created successfully",
        stats
      });
    }
  } catch (error) {
    console.error("Error creating player stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
