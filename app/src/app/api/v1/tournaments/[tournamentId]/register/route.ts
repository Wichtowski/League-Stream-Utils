import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@lib/auth';
import { registerTeamForTournament, unregisterTeamFromTournament, getTournamentById } from '@lib/database/tournament';
import { getTeamById } from '@lib/database/team';

// POST /api/v1/tournaments/[tournamentId]/register - Register team for tournament
export const POST = withAuth(async (req: NextRequest, user, { params }: { params: { tournamentId: string } }) => {
    try {
        const { teamId }: { teamId: string } = await req.json();

        if (!teamId) {
            return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
        }

        // Verify team ownership
        const team = await getTeamById(teamId);
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        if (team.userId !== user.userId && !user.isAdmin) {
            return NextResponse.json({ error: 'You can only register your own teams' }, { status: 403 });
        }

        // Check if tournament exists and is open for registration
        const tournament = await getTournamentById(params.tournamentId);
        if (!tournament) {
            return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
        }

        if (!tournament.registrationOpen || tournament.status !== 'registration') {
            return NextResponse.json({ error: 'Tournament registration is closed' }, { status: 400 });
        }

        // Check registration deadline
        if (new Date() > tournament.registrationDeadline) {
            return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
        }

        // Validate team has complete roster
        if (team.players.main.length !== 5) {
            return NextResponse.json({ error: 'Team must have a complete 5-player roster to register' }, { status: 400 });
        }

        // Check if team players are verified (if required)
        const unverifiedPlayers = team.players.main.filter(player => !player.verified);
        if (unverifiedPlayers.length > 0) {
            return NextResponse.json({
                error: `The following players need to be verified: ${unverifiedPlayers.map(p => p.inGameName).join(', ')}`,
                unverifiedPlayers: unverifiedPlayers.map(p => ({ id: p.id, inGameName: p.inGameName }))
            }, { status: 400 });
        }

        const updatedTournament = await registerTeamForTournament(params.tournamentId, teamId);

        if (!updatedTournament) {
            return NextResponse.json({ error: 'Failed to register team. Tournament may be full or registration is closed.' }, { status: 400 });
        }

        return NextResponse.json({
            message: 'Team registered successfully',
            tournament: updatedTournament
        });
    } catch (error) {
        console.error('Error registering team:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});

// DELETE /api/v1/tournaments/[tournamentId]/register - Unregister team from tournament
export const DELETE = withAuth(async (req: NextRequest, user, { params }: { params: { tournamentId: string } }) => {
    try {
        const { teamId }: { teamId: string } = await req.json();

        if (!teamId) {
            return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
        }

        // Verify team ownership
        const team = await getTeamById(teamId);
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        if (team.userId !== user.userId && !user.isAdmin) {
            return NextResponse.json({ error: 'You can only unregister your own teams' }, { status: 403 });
        }

        const updatedTournament = await unregisterTeamFromTournament(params.tournamentId, teamId);

        if (!updatedTournament) {
            return NextResponse.json({ error: 'Tournament not found or team not registered' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Team unregistered successfully',
            tournament: updatedTournament
        });
    } catch (error) {
        console.error('Error unregistering team:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}); 