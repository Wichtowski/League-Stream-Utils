import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getMatchById, submitPrediction } from "@libTournament/database/match";
import type { SubmitPredictionRequest } from "@lib/types/match";

// GET: get predictions for a match
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const matchId = req.nextUrl.pathname.split("/")[4];
    const match = await getMatchById(matchId);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ predictions: match.predictions });
  } catch (error) {
    console.error("Error fetching match predictions:", error);
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }
});

// POST: submit a prediction for a match
export const POST = withAuth(async (req: NextRequest, _user) => {
  try {
    const matchId = req.nextUrl.pathname.split("/")[4];
    const request: SubmitPredictionRequest = await req.json();

    if (!request.prediction) {
      return NextResponse.json({ error: "Prediction is required" }, { status: 400 });
    }

    // Find the commentator by username in the match's commentators
    const match = await getMatchById(matchId);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    
    const commentator = match.commentators.find((c) => c.name === request.username);
    if (!commentator) {
      return NextResponse.json({ error: "Commentator not assigned to this match" }, { status: 403 });
    }
    
    const commentatorId = commentator._id;

    const updatedMatch = await submitPrediction(matchId, commentatorId, request);

    if (!updatedMatch) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, predictions: updatedMatch.predictions });
  } catch (error) {
    console.error("Error submitting prediction:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit prediction" }, { status: 500 });
  }
});
