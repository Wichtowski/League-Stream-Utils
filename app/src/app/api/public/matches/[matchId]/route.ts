import { NextRequest, NextResponse } from "next/server";
import { getMatchById } from "@libTournament/database/match";
import { getTournamentById } from "@libTournament/database/tournament";

// GET /api/public/matches/[matchId] - Get specific match (public)
export async function GET(req: NextRequest) {
  try {
    const matchId = new URL(req.url).pathname.split("/").pop()!;

    const match = await getMatchById(matchId);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // If this is a tournament match, check if the tournament is public
    if (match.tournamentId) {
      const tournament = await getTournamentById(match.tournamentId);
      if (!tournament || tournament.status === "registration") {
        return NextResponse.json({ error: "Match not public" }, { status: 403 });
      }
    }

    const response = NextResponse.json({ match });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  } catch (error) {
    console.error("Error fetching public match:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
