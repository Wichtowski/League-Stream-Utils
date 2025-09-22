import { NextRequest, NextResponse } from "next/server";
import { getTournament } from "@/libTournament/database/tournament";

// GET /api/v1/tournaments/[tournamentId]/ticker/display - Get tournament Ticker for OBS display
export const GET = async (req: NextRequest, { params }: { params: Promise<{ tournamentId: string }> }) => {
    try {
        const { tournamentId } = await params;

        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        const Ticker = tournament.ticker

        return NextResponse.json({
            tournament: {
                _id: tournament._id,
                name: tournament.name,
                abbreviation: tournament.abbreviation
            },
            Ticker
        });
    } catch (error) {
        console.error("Error fetching tournament Ticker for display:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
};