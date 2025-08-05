import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getMatchesByTournament } from "@lib/database/match";
import { getTournamentById } from "@lib/database/tournament";

// GET: get all matches for a tournament
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const tournamentId = req.nextUrl.pathname.split("/")[5];

    // Check if tournament exists
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      );
    }

    const matches = await getMatchesByTournament(tournamentId);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching tournament matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament matches" },
      { status: 500 },
    );
  }
});
