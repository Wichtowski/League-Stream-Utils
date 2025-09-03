import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getMatchById, updateMatch, deleteMatch } from "@/libTournament/database/match";
import type { UpdateMatchRequest } from "@lib/types/match";

// GET: get a specific match
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const matchId = req.nextUrl.pathname.split("/").pop()!;
    const match = await getMatchById(matchId);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error fetching match:", error);
    return NextResponse.json({ error: "Failed to fetch match" }, { status: 500 });
  }
});

// PUT: update a match
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const matchId = req.nextUrl.pathname.split("/").pop()!;
    const updates: UpdateMatchRequest = await req.json();

    const match = await updateMatch(matchId, user.userId, updates);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ match });
  } catch (error) {
    console.error("Error updating match:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update match" }, { status: 500 });
  }
});

// DELETE: delete a match
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const matchId = req.nextUrl.pathname.split("/").pop()!;
    const success = await deleteMatch(matchId, user.userId);

    if (!success) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting match:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to delete match" }, { status: 500 });
  }
});

