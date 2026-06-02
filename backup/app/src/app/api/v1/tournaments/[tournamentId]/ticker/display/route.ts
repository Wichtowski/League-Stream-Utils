import { NextRequest, NextResponse } from "next/server";
import { getTournament } from "@libTournament/database/tournament";
import { logError } from "@lib/utils/error-handling";

// Utility function to extract tournament ID from URL
const extractTournamentId = (req: NextRequest): string => {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  return pathSegments[pathSegments.indexOf("tournaments") + 1];
};

// GET /api/v1/tournaments/[tournamentId]/ticker/display - Get ticker data for OBS display
export const GET = async (req: NextRequest) => {
  try {
    const tournamentId = extractTournamentId(req);

    if (!tournamentId) {
      return NextResponse.json(
        {
          error: "Tournament ID is required",
          code: "MISSING_TOURNAMENT_ID"
        },
        { status: 400 }
      );
    }

    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json(
        {
          error: "Tournament not found",
          code: "TOURNAMENT_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Return tournament and ticker data for display
    const displayData = {
      tournament: {
        _id: tournament._id,
        name: tournament.name,
        abbreviation: tournament.abbreviation
      },
      ticker: tournament.ticker || null
    };

    // Set cache headers for better performance
    const response = NextResponse.json(displayData);
    response.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=60");

    return response;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      operation: "GET_TICKER_DISPLAY",
      tournamentId: extractTournamentId(req)
    });

    return NextResponse.json(
      {
        error: "An internal server error occurred while fetching ticker display data",
        code: "INTERNAL_SERVER_ERROR"
      },
      { status: 500 }
    );
  }
};
