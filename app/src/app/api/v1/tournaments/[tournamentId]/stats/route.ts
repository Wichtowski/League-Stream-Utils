import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getTournamentChampionStats, getChampionStatsForOBS } from "@lib/database/champion-stats";
import { getTournamentById } from "@lib/database/tournament";
import type { JWTPayload } from "@lib/types/auth";

// GET /api/v1/tournaments/[tournamentId]/stats - Get tournament champion statistics
export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const tournamentId = new URL(req.url).pathname.split("/")[4]; // Extract tournamentId from path
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format");

    // Check if tournament exists and user has access
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Public tournaments can be viewed by anyone, private tournaments only by owner/admin
    if (tournament.status === "draft" && tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (format === "obs") {
      // Return data formatted for OBS consumption
      const obsData = await getChampionStatsForOBS(tournamentId);
      if (!obsData) {
        return NextResponse.json({
          tournament: { id: tournamentId, totalGames: 0 },
          topPicks: [],
          topBans: [],
          topPresence: []
        });
      }
      return NextResponse.json(obsData);
    } else {
      // Return full statistics
      const stats = await getTournamentChampionStats(tournamentId);
      if (!stats) {
        return NextResponse.json({
          tournamentId,
          totalGames: 0,
          totalMatches: 0,
          championStats: [],
          topPicks: [],
          topBans: [],
          topPresence: [],
          blueSidePriority: [],
          redSidePriority: []
        });
      }
      return NextResponse.json(stats);
    }
  } catch (error) {
    console.error("Error fetching tournament stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
