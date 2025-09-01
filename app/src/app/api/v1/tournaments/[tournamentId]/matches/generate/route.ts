import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import type { JWTPayload } from "@lib/types/auth";
import { getTournamentById } from "@/libTournament/database/tournament";
import { createMatch } from "@libTournament/database/schemas";
import { MatchGenerator } from "@lib/services/tournament/match-generator";

export const POST = withAuth(async (req: NextRequest, user: JWTPayload) => {
  try {
    const url = new URL(req.url);
    const tournamentId = url.pathname.split("/")[5];

    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.userId !== user.userId && !user.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Only tournament organizer can generate matches" },
        { status: 403 }
      );
    }

    if (tournament.status !== "draft" && tournament.status !== "ongoing") {
      return NextResponse.json(
        { error: "Matches can only be generated for tournaments in draft or ongoing status" },
        { status: 400 }
      );
    }

    const teams = tournament.selectedTeams.length > 0 ? tournament.selectedTeams : tournament.registeredTeams;
    if (teams.length < 2) {
      return NextResponse.json(
        { error: "Tournament must have at least 2 teams to generate matches" },
        { status: 400 }
      );
    }

    // Generate matches based on tournament format
    const matchRequests = MatchGenerator.generateTournamentMatches(tournament);
    
    // Create matches in database
    const createdMatches = [];
    for (const matchRequest of matchRequests) {
      const match = await createMatch(user.userId, matchRequest);
      createdMatches.push(match);
    }

    return NextResponse.json(
      {
        message: `Successfully generated ${createdMatches.length} matches`,
        matches: createdMatches,
        tournamentFormat: tournament.tournamentFormat
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating matches:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
});
