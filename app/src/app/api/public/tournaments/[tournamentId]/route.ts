import { NextRequest, NextResponse } from "next/server";
import { getTournamentById } from "@/libTournament/database/tournament";

// GET /api/public/tournaments/[tournamentId] - Get specific tournament (public)
export async function GET(req: NextRequest) {
  try {
    const tournamentId = new URL(req.url).pathname.split("/").pop()!;

    const tournament = await getTournamentById(tournamentId);

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Only allow access to public tournaments (not draft)
    if (tournament.status === "draft") {
      return NextResponse.json({ error: "Tournament not public" }, { status: 403 });
    }

    const response = NextResponse.json({ tournament });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  } catch (error) {
    console.error("Error fetching public tournament:", error);
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
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

