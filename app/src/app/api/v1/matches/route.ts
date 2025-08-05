import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { createMatch, getStandaloneMatches } from "@lib/database/match";
import type { CreateMatchRequest } from "@lib/types/match";

// GET: get all standalone matches
export const GET = withAuth(async (_req: NextRequest, _user) => {
  try {
    const matches = await getStandaloneMatches();
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 },
    );
  }
});

// POST: create a new match
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const matchData: CreateMatchRequest = await req.json();

    // Validate required fields
    if (
      !matchData.name ||
      !matchData.blueTeamId ||
      !matchData.redTeamId ||
      !matchData.format ||
      !matchData.patchName
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const match = await createMatch(user.userId, matchData);
    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error creating match:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 },
    );
  }
});
