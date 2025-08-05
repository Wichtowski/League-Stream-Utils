import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getMatchById, submitPrediction } from "@lib/database/match";
import type { SubmitPredictionRequest } from "@lib/types/match";

// GET: get predictions for a match
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const matchId = req.nextUrl.pathname.split("/")[5];
    const match = await getMatchById(matchId);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ predictions: match.predictions });
  } catch (error) {
    console.error("Error fetching match predictions:", error);
    return NextResponse.json(
      { error: "Failed to fetch predictions" },
      { status: 500 },
    );
  }
});

// POST: submit a prediction for a match
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const matchId = req.nextUrl.pathname.split("/")[5];
    const request: SubmitPredictionRequest = await req.json();

    if (!request.prediction) {
      return NextResponse.json(
        { error: "Prediction is required" },
        { status: 400 },
      );
    }

    // For now, we'll use the user's username as commentator ID
    // In a real implementation, you'd need to check if the user is assigned as a commentator
    const commentatorId = user.username;

    const match = await submitPrediction(matchId, commentatorId, request);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, predictions: match.predictions });
  } catch (error) {
    console.error("Error submitting prediction:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to submit prediction" },
      { status: 500 },
    );
  }
});
