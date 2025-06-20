import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@lib/auth';
import { connectToDatabase } from '@lib/database/connection';
import { CameraSettings } from '@lib/database/models';
import { getUserTeams } from '@lib/database/team';
import { JWTPayload } from '@lib/types/auth';
import type { Team } from '@lib/types';

export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
    try {
        await connectToDatabase();

        let settings;

        if (user.isAdmin) {
            // Admins can see all camera settings
            const url = new URL(req.url);
            const userId = url.searchParams.get('userId');

            if (userId) {
                settings = await CameraSettings.findOne({ userId });
            } else {
                settings = await CameraSettings.find({});
            }
        } else {
            // Regular users can only see their own camera settings
            settings = await CameraSettings.findOne({ userId: user.userId });
        }

        if (!settings) {
            return NextResponse.json({ teams: [] });
        }

        // For regular users, filter teams to only show teams they own
        if (!user.isAdmin && Array.isArray(settings.teams)) {
            const userTeams = await getUserTeams(user.userId);
            const userTeamIds = userTeams.map((team: Team) => team.id);

            settings.teams = settings.teams.filter((team: any) =>
                userTeamIds.includes(team.teamId)
            );
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching camera settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});

export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
    try {
        await connectToDatabase();

        const { teams } = await req.json();

        // For regular users, verify they own all teams they're setting up cameras for
        if (!user.isAdmin) {
            const userTeams = await getUserTeams(user.userId);
            const userTeamIds = userTeams.map((team: Team) => team.id);

            const invalidTeams = teams.filter((team: any) =>
                !userTeamIds.includes(team.teamId)
            );

            if (invalidTeams.length > 0) {
                return NextResponse.json({
                    error: 'You can only configure cameras for teams you own',
                    invalidTeams: invalidTeams.map((t: any) => t.teamName)
                }, { status: 403 });
            }
        }

        const settings = await CameraSettings.findOneAndUpdate(
            { userId: user.userId },
            {
                userId: user.userId,
                teams,
                updatedAt: new Date()
            },
            {
                upsert: true,
                new: true
            }
        );

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error saving camera settings:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
});
