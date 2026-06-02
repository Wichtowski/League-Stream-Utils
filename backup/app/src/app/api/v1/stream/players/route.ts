import { NextResponse } from "next/server";
import { TeamModel } from "@libTeam/database/models";

export async function GET() {
  try {
    // Get all teams with camera settings
    const teams = await TeamModel.find({ 
      "cameras.players": { $exists: true, $not: { $size: 0 } }
    });

    // Extract all players from team camera settings
    const allPlayers = teams.flatMap((team) =>
      (team.cameras?.players || [])
        .filter((player) => player.playerName)
        .map((player) => ({
          name: player.playerName,
          url: player.url,
          imagePath: player.imagePath,
          role: player.role,
          teamName: team.name,
          teamId: team._id.toString()
        }))
    );

    return NextResponse.json(allPlayers);
  } catch (error) {
    console.error("Error reading players:", error);
    return NextResponse.json([]);
  }
}
