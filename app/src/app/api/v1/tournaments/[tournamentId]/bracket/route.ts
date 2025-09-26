import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getTournamentById } from "@libTournament/database/tournament";
import { BracketGenerator } from "@lib/services/tournament";
import { connectToDatabase } from "@lib/database/connection";
import { BracketModel } from "@lib/database/models";
import { JWTPayload } from "@lib/types/auth";
import { BracketStructure, UpdateMatchResultRequest, BracketNode } from "@libTournament/types";

// GET /api/v1/tournaments/:tournamentId/bracket - Get bracket
export const GET = withAuth(async (req: NextRequest, user: JWTPayload, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status === "draft" && tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const bracket = (await BracketModel.findOne({ tournamentId }).lean()) as BracketStructure | null;

    if (!bracket) {
      return NextResponse.json(
        {
          error: "Bracket not found. Generate bracket first."
        },
        { status: 404 }
      );
    }

    const readyMatches = BracketGenerator.getReadyMatches(bracket);
    const completedMatches = bracket.nodes.filter((n) => n.status === "completed");
    const isComplete = BracketGenerator.isBracketComplete(bracket);

    return NextResponse.json({
      bracket,
      readyMatches,
      completedMatches,
      isComplete
    });
  } catch (error) {
    console.error("Error fetching bracket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// POST /api/v1/tournaments/:tournamentId/bracket - Generate bracket
export const POST = withAuth(async (req: NextRequest, user: JWTPayload, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;
    const requestBody = await req.json();

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only tournament organizer can generate brackets" },
        { status: 403 }
      );
    }

    const bracketSettings = requestBody.bracketSettings || {
      type: "single",
      seeding: "manual",
      grandFinalReset: false,
      thirdPlaceMatch: false,
      autoAdvancement: true,
      bracketVisibility: "public"
    };

    const teams = tournament.selectedTeams.length > 0 ? tournament.selectedTeams : tournament.registeredTeams;
    if (teams.length < 2) {
      return NextResponse.json(
        {
          error: "Tournament must have at least 2 teams to generate bracket"
        },
        { status: 400 }
      );
    }

    const bracket = BracketGenerator.generateBracket(tournamentId, teams, bracketSettings);

    await BracketModel.findOneAndUpdate({ tournamentId: bracket.tournamentId }, bracket, { upsert: true, new: true });

    const readyMatches = BracketGenerator.getReadyMatches(bracket);

    return NextResponse.json(
      {
        message: "Bracket generated successfully",
        bracket,
        readyMatches
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating bracket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// PUT /api/v1/tournaments/:tournamentId/bracket - Update match result
export const PUT = withAuth(async (req: NextRequest, user: JWTPayload, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;
    const updateData: UpdateMatchResultRequest = await req.json();

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only tournament organizer can update matches" }, { status: 403 });
    }

    const bracket = (await BracketModel.findOne({ tournamentId }).lean()) as BracketStructure | null;

    if (!bracket) {
      return NextResponse.json({ error: "Bracket not found" }, { status: 404 });
    }

    const matchNode = bracket.nodes.find((n) => n._id === updateData.matchId);
    if (!matchNode) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (matchNode.status === "completed") {
      return NextResponse.json({ error: "Match is already completed" }, { status: 400 });
    }

    if (!matchNode.team1 || !matchNode.team2) {
      return NextResponse.json({ error: "Match does not have both teams assigned" }, { status: 400 });
    }

    if (updateData.winner !== matchNode.team1 && updateData.winner !== matchNode.team2) {
      return NextResponse.json({ error: "Winner must be one of the participating teams" }, { status: 400 });
    }

    // Determine loser for double elimination
    const loser = updateData.winner === matchNode.team1 ? matchNode.team2 : matchNode.team1;

    // Update bracket with match result
    const updatedBracket = BracketGenerator.advanceTeam(bracket, updateData.matchId, updateData.winner, loser);

    // Update the match with scores and additional info
    const updatedMatch = updatedBracket.nodes.find((n: BracketNode) => n._id === updateData.matchId);
    if (updatedMatch) {
      updatedMatch.score1 = updateData.score.blue;
      updatedMatch.score2 = updateData.score.red;
      updatedMatch.completedAt = new Date();
    }

    await BracketModel.findOneAndUpdate({ tournamentId: bracket.tournamentId }, updatedBracket, {
      upsert: true,
      new: true
    });

    const readyMatches = BracketGenerator.getReadyMatches(updatedBracket);
    const isComplete = BracketGenerator.isBracketComplete(updatedBracket);

    return NextResponse.json({
      message: "Match result updated successfully",
      bracket: updatedBracket,
      readyMatches,
      isComplete,
      updatedMatch
    });
  } catch (error) {
    console.error("Error updating match result:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, user: JWTPayload, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only tournament organizer can delete brackets" }, { status: 403 });
    }

    await connectToDatabase();
    await BracketModel.deleteOne({ tournamentId });

    return NextResponse.json({
      message: "Bracket deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting bracket:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
