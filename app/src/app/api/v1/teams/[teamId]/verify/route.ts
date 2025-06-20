import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@lib/auth';
import { getTeamById, verifyTeamPlayers } from '@lib/database/team';
import { connectToDatabase } from '@lib/database/connection';
import { TournamentTeam } from '@lib/database/models';
import type { JWTPayload } from '@lib/types/auth';

export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
    try {
        if (!user.isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const url = new URL(req.url);
        const teamId = url.pathname.split('/')[5];

        const { verified = true, verifyPlayers = true } = await req.json();

        const team = await getTeamById(teamId);
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        await connectToDatabase();

        const updatedTeam = await TournamentTeam.findOne({ id: teamId });
        if (!updatedTeam) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        updatedTeam.verified = verified;
        if (verified) {
            updatedTeam.verificationSubmittedAt = new Date();
        }
        updatedTeam.updatedAt = new Date();

        if (verifyPlayers && verified) {
            const playerUpdates = [
                ...team.players.main.map(player => ({
                    playerId: player.id,
                    verified: true
                })),
                ...team.players.substitutes.map(player => ({
                    playerId: player.id,
                    verified: true
                }))
            ];

            await verifyTeamPlayers(teamId, playerUpdates);
        }

        await updatedTeam.save();
        const finalTeam = await getTeamById(teamId);

        return NextResponse.json({
            message: `Team ${verified ? 'verified' : 'unverified'} successfully`,
            team: finalTeam
        });
    } catch (error) {
        console.error('Error verifying team:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});

export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
    try {
        if (!user.isAdmin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const url = new URL(req.url);
        const teamId = url.pathname.split('/')[5];

        const team = await getTeamById(teamId);
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const verificationStatus = {
            teamVerified: team.verified,
            verificationSubmittedAt: team.verificationSubmittedAt,
            playersVerified: {
                main: team.players.main.map(p => ({
                    id: p.id,
                    inGameName: p.inGameName,
                    verified: p.verified,
                    verifiedAt: p.verifiedAt
                })),
                substitutes: team.players.substitutes.map(p => ({
                    id: p.id,
                    inGameName: p.inGameName,
                    verified: p.verified,
                    verifiedAt: p.verifiedAt
                }))
            },
            allPlayersVerified: [...team.players.main, ...team.players.substitutes].every(p => p.verified)
        };

        return NextResponse.json({ team: verificationStatus });
    } catch (error) {
        console.error('Error getting team verification status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}); 