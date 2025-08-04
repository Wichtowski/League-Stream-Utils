import { NextRequest, NextResponse } from 'next/server';
import { getTournament } from '@lib/database/tournament';

// GET /api/v1/tournaments/[tournamentId]/sponsors/display - Get tournament sponsors for OBS display
export const GET = async (req: NextRequest, { params }: { params: Promise<{ tournamentId: string }> }) => {
  try {
    const { tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    const tournament = await getTournament(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Return sponsors sorted by display priority (highest first)
    const sponsors = (tournament.sponsors || []).sort((a, b) => b.displayPriority - a.displayPriority);

    return NextResponse.json({ 
      tournament: {
        id: tournament.id,
        name: tournament.name,
        abbreviation: tournament.abbreviation
      },
      sponsors 
    });
  } catch (error) {
    console.error('Error fetching tournament sponsors for display:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}; 