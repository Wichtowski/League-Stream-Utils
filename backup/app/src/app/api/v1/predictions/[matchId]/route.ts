import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { storage } from "@lib/services/common/UniversalStorage";

// Prediction type
interface Prediction {
  commentator: string;
  prediction: string;
  timestamp: string;
}

const CACHE_PREFIX = "predictions-";

// GET: fetch predictions for a match
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const matchId = req.nextUrl.pathname.split("/").pop()!;
    const predictions = (await storage.get<Prediction[]>(`${CACHE_PREFIX}${matchId}`)) || [];
    return NextResponse.json({ predictions });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }
});

// POST: add a prediction for a match
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const matchId = req.nextUrl.pathname.split("/").pop()!;
    const { prediction } = await req.json();
    if (!prediction) {
      return NextResponse.json({ error: "Prediction is required" }, { status: 400 });
    }
    const commentator = user.username || "unknown";
    const newPrediction: Prediction = {
      commentator,
      prediction,
      timestamp: new Date().toISOString()
    };
    const existing = (await storage.get<Prediction[]>(`${CACHE_PREFIX}${matchId}`)) || [];
    // Replace previous prediction from this commentator
    const filtered = existing.filter((p) => p.commentator !== commentator);
    const updated = [...filtered, newPrediction];
    await storage.set(`${CACHE_PREFIX}${matchId}`, updated);
    return NextResponse.json({ success: true, prediction: newPrediction });
  } catch (_error) {
    return NextResponse.json({ error: "Failed to submit prediction" }, { status: 500 });
  }
});
