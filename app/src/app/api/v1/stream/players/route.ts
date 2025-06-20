import { NextResponse } from 'next/server';
import { connectToDatabase } from '@lib/database/connection';
import mongoose from 'mongoose';

// Reference the CameraSettings model (should match the one in settings/route.ts)
const CameraSettingsSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    teams: [{
        teamId: { type: String, required: true },
        teamName: { type: String, required: true },
        teamLogo: { type: String },
        players: [{
            playerId: { type: String, required: true },
            playerName: { type: String, required: true },
            role: { type: String, required: true },
            url: { type: String, default: '' },
            imagePath: { type: String, default: '' }
        }]
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const CameraSettings = mongoose.models.CameraSettings ||
    mongoose.model('CameraSettings', CameraSettingsSchema);

export async function GET() {
    try {
        await connectToDatabase();

        // Get all camera settings from all users
        const allSettings = await CameraSettings.find();

        // Extract all players from all camera settings
        const allPlayers = allSettings.flatMap((settings) =>
            settings.teams.flatMap((team: any) =>
                team.players.filter((player: any) => player.playerName).map((player: any) => ({
                    name: player.playerName,
                    url: player.url,
                    imagePath: player.imagePath,
                    role: player.role,
                    teamName: team.teamName
                }))
            )
        );

        return NextResponse.json(allPlayers);
    } catch (error) {
        console.error('Error reading players:', error);
        return NextResponse.json([]);
    }
} 