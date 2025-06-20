import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@lib/auth';
import { createTournament, getUserTournaments, getPublicTournaments, searchTournaments, checkTournamentAvailability } from '@lib/database/tournament';
import type { CreateTournamentRequest } from '@lib/types';

// GET /api/v1/tournaments - Get tournaments
export const GET = withAuth(async (req: NextRequest, user) => {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const myTournaments = searchParams.get('mine') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let tournaments;

    if (myTournaments) {
      // Get user's own tournaments
      tournaments = await getUserTournaments(user.userId);
    } else if (search) {
      // Search public tournaments
      tournaments = await searchTournaments(search, limit);
    } else {
      // Get public tournaments
      tournaments = await getPublicTournaments(limit, offset);
    }

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

// POST /api/v1/tournaments - Create new tournament
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const tournamentData: CreateTournamentRequest = await req.json();

    // Validate required fields
    if (!tournamentData.name || !tournamentData.abbreviation || !tournamentData.startDate || !tournamentData.endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate dates
    const startDate = new Date(tournamentData.startDate);
    const endDate = new Date(tournamentData.endDate);
    const registrationDeadline = new Date(tournamentData.registrationDeadline);
    const now = new Date();

    if (startDate <= now) {
      return NextResponse.json({ error: 'Tournament start date must be in the future' }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json({ error: 'Tournament end date must be after start date' }, { status: 400 });
    }

    if (registrationDeadline >= startDate) {
      return NextResponse.json({ error: 'Registration deadline must be before tournament start' }, { status: 400 });
    }

    // Validate team count
    if (tournamentData.maxTeams < 2 || tournamentData.maxTeams > 128) {
      return NextResponse.json({ error: 'Maximum teams must be between 2 and 128' }, { status: 400 });
    }

    // Check name and abbreviation availability
    const availability = await checkTournamentAvailability(tournamentData.name, tournamentData.abbreviation);
    if (!availability.nameAvailable) {
      return NextResponse.json({ error: 'Tournament name is already taken' }, { status: 409 });
    }
    if (!availability.abbreviationAvailable) {
      return NextResponse.json({ error: 'Tournament abbreviation is already taken' }, { status: 409 });
    }

    const tournament = await createTournament(user.userId, tournamentData);
    return NextResponse.json({ tournament }, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}); 