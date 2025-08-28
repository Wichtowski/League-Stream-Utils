import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { recordGameResult } from "@lib/database/champion-stats";
import { getTournamentById } from "@lib/database/tournament";
import type { JWTPayload } from "@lib/types/auth";
import type { GameResult } from "@lib/types";

// POST /api/v1/tournaments/[tournamentId]/games - Record a game result
export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const tournamentId = new URL(req.url).pathname.split("/")[4]; // Extract tournamentId from path
    const gameResultData: Omit<GameResult, "tournamentId"> = await req.json();

    // Check if tournament exists and user has access
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Only tournament owner or admin can record games
    if (tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only tournament organizer can record games" }, { status: 403 });
    }

    // Validate game result data
    if (!gameResultData.sessionId || !gameResultData.blueTeam || !gameResultData.redTeam) {
      return NextResponse.json({ error: "Invalid game result data" }, { status: 400 });
    }

    if (!gameResultData.blueTeam.picks || !gameResultData.redTeam.picks) {
      return NextResponse.json({ error: "Game must have picks for both teams" }, { status: 400 });
    }

    if (gameResultData.blueTeam.picks.length !== 5 || gameResultData.redTeam.picks.length !== 5) {
      return NextResponse.json({ error: "Each team must have exactly 5 picks" }, { status: 400 });
    }

    // Validate that exactly one team won
    if (gameResultData.blueTeam.won === gameResultData.redTeam.won) {
      return NextResponse.json({ error: "Exactly one team must win" }, { status: 400 });
    }

    // Create the full game result with tournament ID
    const gameResult: GameResult = {
      ...gameResultData,
      tournamentId,
      patch: gameResultData.patch || "14.24",
      completedAt: gameResultData.completedAt || new Date()
    };

    // Record the game result and update statistics
    await recordGameResult(gameResult);

    return NextResponse.json({
      message: "Game result recorded successfully",
      gameResult: {
        sessionId: gameResult.sessionId,
        tournamentId: gameResult.tournamentId,
        gameNumber: gameResult.gameNumber,
        completedAt: gameResult.completedAt
      }
    });
  } catch (error) {
    console.error("Error recording game result:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
