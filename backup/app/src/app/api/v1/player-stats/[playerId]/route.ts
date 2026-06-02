import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getPlayerStatsByPlayer, getPlayerCareerStats, getPlayerChampionMastery } from "@lib/database/playerStats";
import type { JWTPayload } from "@lib/types/auth";

// GET /api/v1/player-stats/[playerId] - Get player statistics and career data
export const GET = withAuth(async (req: NextRequest, _user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    // Extract playerId from the pathname, handling both _id and id formats
    const pathSegments = url.pathname.split("/");
    const playerId = pathSegments[pathSegments.length - 1];
    const { searchParams } = url;

    const includeCareer = searchParams.get("includeCareer") === "true";
    const includeChampions = searchParams.get("includeChampions") === "true";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;

    // Get recent games
    const recentStats = await getPlayerStatsByPlayer(playerId, limit);
    console.log("Recent stats found:", recentStats.length);

    const response: {
      playerId: string;
      recentStats: unknown[];
      careerStats?: unknown;
      championMastery?: unknown[];
    } = {
      playerId,
      recentStats
    };

    // Include career stats if requested
    if (includeCareer) {
      const careerStats = await getPlayerCareerStats(playerId);
      response.careerStats = careerStats;
      console.log("Career stats found:", !!careerStats);
    }

    // Include champion mastery if requested
    if (includeChampions) {
      const championMastery = await getPlayerChampionMastery(playerId);
      response.championMastery = championMastery;
      console.log("Champion mastery found:", championMastery.length);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching player stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
