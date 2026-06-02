import { NextRequest, NextResponse } from "next/server";
import { getTournament } from "@libTournament/database/tournament";
import { Sponsorship } from "@libTournament/types";

// GET /api/v1/tournaments/[tournamentId]/sponsors/display - Get tournament sponsors for OBS display
export const GET = async (req: NextRequest, { params }: { params: Promise<{ tournamentId: string }> }) => {
  try {
    const { tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }

    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Return sponsors sorted by tier (highest first) with normalized fields for legacy data
    const sponsors = (tournament.sponsors || [])
      .map((s: Partial<Sponsorship>) => ({
        ...s,
        timeInSeconds: s.timeInSeconds ?? 3,
        variant: s.variant ?? "corner",
        fullwidth: s.fullwidth ?? false
      }))
      .sort((a, b) => (b.tier as string).localeCompare(a.tier as string));

    return NextResponse.json({
      tournament: {
        id: tournament._id,
        name: tournament.name,
        abbreviation: tournament.abbreviation
      },
      sponsors
    });
  } catch (error) {
    console.error("Error fetching tournament sponsors for display:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
