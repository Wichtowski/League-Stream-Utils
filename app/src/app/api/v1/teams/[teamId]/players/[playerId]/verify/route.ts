import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTeamById, verifyTeamPlayers } from "@lib/database/team";
import { riotAPI } from "@lib/services/riot/riot-api";
import type { JWTPayload } from "@lib/types/auth";

export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const teamId = pathParts[4];
    const playerId = pathParts[6];

    const { gameName, tagLine } = await req.json();

    if (!gameName || !tagLine) {
      return NextResponse.json(
        {
          error: "Missing required fields: gameName and tagLine",
        },
        { status: 400 },
      );
    }

    const team = await getTeamById(teamId);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const player = [...team.players.main, ...team.players.substitutes].find(
      (p) => p.id === playerId,
    );

    if (!player) {
      return NextResponse.json(
        { error: "Player not found in team" },
        { status: 404 },
      );
    }

    // Check if player names match
    if (
      player.inGameName.toLowerCase() !== gameName.toLowerCase() ||
      player.tag.toLowerCase() !== tagLine.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error: "Player name/tag does not match team roster",
        },
        { status: 400 },
      );
    }

    // Verify with Riot API
    const verificationResult = await riotAPI.verifyPlayer(
      gameName,
      tagLine,
      player.puuid,
    );

    if (!verificationResult.verified) {
      return NextResponse.json(
        {
          success: false,
          error: verificationResult.error || "Player verification failed",
        },
        { status: 404 },
      );
    }

    // Update player verification status
    await verifyTeamPlayers(teamId, [
      {
        playerId,
        verified: true,
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "Player verified successfully",
      player: {
        id: playerId,
        inGameName: player.inGameName,
        verified: true,
      },
    });
  } catch (error) {
    console.error("Error verifying player:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
