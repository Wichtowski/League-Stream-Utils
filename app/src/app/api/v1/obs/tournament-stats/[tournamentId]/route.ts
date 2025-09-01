import { NextRequest, NextResponse } from "next/server";
import { getChampionStatsForOBS } from "@lib/database/champion-stats";
import { getTournamentById } from "@/libTournament/database";

export async function GET(req: NextRequest) {
  try {
    const tournamentId = new URL(req.url).pathname.split("/").pop()!;

    // Check if tournament exists and is public
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Only allow access to public tournaments
    if (tournament.status === "draft") {
      return NextResponse.json({ error: "Tournament not public" }, { status: 403 });
    }

    const obsData = await getChampionStatsForOBS(tournamentId);

    if (!obsData) {
      return NextResponse.json({
        tournament: {
          id: tournamentId,
          name: tournament.name,
          abbreviation: tournament.abbreviation,
          totalGames: 0,
          lastUpdated: new Date()
        },
        topPicks: [],
        topBans: [],
        topPresence: []
      });
    }

    // Create a new object with tournament data
    const responseData = {
      ...obsData,
      tournament: {
        ...obsData.tournament,
        name: tournament.name,
        abbreviation: tournament.abbreviation
      }
    };

    const response = NextResponse.json(responseData);
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  } catch (error) {
    console.error("Error fetching OBS tournament stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle CORS preflight requests :p
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
