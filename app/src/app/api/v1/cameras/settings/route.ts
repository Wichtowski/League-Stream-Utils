import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@lib/auth';
import { connectToDatabase } from '@lib/database/connection';
import { CameraSettingsModel } from '@lib/database/models';
import { getUserTeams } from '@lib/database/team';
import { JWTPayload } from '@lib/types/auth';
import type { Player, Team } from '@lib/types';

interface CameraTeam {
    teamId: string;
    teamName: string;
    players?: Player[];
}

export const GET = withAuth(async (req: NextRequest, user: JWTPayload) => {
    try {
        await connectToDatabase();

        let settings;

        const url = new URL(req.url);
        const teamId = url.searchParams.get('teamId');
        const userId = url.searchParams.get('userId');

        if (user.isAdmin) {
            // Admins can see all camera settings
            if (userId) {
                settings = await CameraSettingsModel.findOne({ userId });
            } else {
                // Get all camera settings and merge them for admin view
                const allSettings = await CameraSettingsModel.find({});
                // Merge all teams from all users into one response
                const allTeams = allSettings.flatMap(s => s.teams || []);
                settings = {
                    userId: 'admin',
                    teams: allTeams,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }
        } else {
            settings = await CameraSettingsModel.findOne({ userId: user.userId });
        }

        if (!settings) {
            return NextResponse.json({ teams: [] });
        }

        if (!user.isAdmin && Array.isArray(settings.teams)) {
            const userTeams = await getUserTeams(user.userId);
            const userTeamIds = userTeams.map((team: Team) => team.id);

            settings.teams = settings.teams.filter((team: CameraTeam) => {
                const hasAccess = userTeamIds.includes(team.teamId);
                return hasAccess;
            });
        }

        // If teamId is provided, filter to only that team
        if (teamId && Array.isArray(settings.teams)) {
            const filteredTeam = settings.teams.find((team: CameraTeam) => team.teamId === teamId);
            return NextResponse.json({ teams: filteredTeam ? [filteredTeam] : [] });
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

            const invalidTeams = teams.filter((team: CameraTeam) =>
                !userTeamIds.includes(team.teamId)
            );

            if (invalidTeams.length > 0) {
                return NextResponse.json({
                    error: 'You can only configure cameras for teams you own',
                    invalidTeams: invalidTeams.map((t: CameraTeam) => t.teamName)
                }, { status: 403 });
            }
        }

        const settings = await CameraSettingsModel.findOneAndUpdate(
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
