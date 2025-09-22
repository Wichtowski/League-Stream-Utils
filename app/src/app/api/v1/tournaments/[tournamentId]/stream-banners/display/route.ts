import { NextRequest, NextResponse } from "next/server";
import { getTournament } from "@/libTournament/database/tournament";

// GET /api/v1/tournaments/[tournamentId]/stream-banners/display - Get tournament stream banners for OBS display
export const GET = async (req: NextRequest, { params }: { params: Promise<{ tournamentId: string }> }) => {
    try {
        const { tournamentId } = await params;

        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        const streamBanner = tournament.streamBanner

        return NextResponse.json({
            tournament: {
                _id: tournament._id,
                name: tournament.name,
                abbreviation: tournament.abbreviation
            },
            streamBanner
        });
    } catch (error) {
        console.error("Error fetching tournament stream banners for display:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
};