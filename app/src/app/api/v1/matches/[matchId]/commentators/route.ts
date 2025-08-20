import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/utils";
import { getMatchById, assignCommentator } from "@lib/database/match";
import type { AssignCommentatorRequest } from "@lib/types/match";

// GET: get commentators for a match
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const matchId = req.nextUrl.pathname.split("/")[5];
    const match = await getMatchById(matchId);

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ commentators: match.commentators });
  } catch (error) {
    console.error("Error fetching match commentators:", error);
    return NextResponse.json({ error: "Failed to fetch commentators" }, { status: 500 });
  }
});

// POST: assign a commentator to a match
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const matchId = req.nextUrl.pathname.split("/")[5];
    const request: AssignCommentatorRequest = await req.json();

    if (!request.commentatorId) {
      return NextResponse.json({ error: "Commentator ID is required" }, { status: 400 });
    }

    const match = await assignCommentator(matchId, user.userId, {
      ...request,
      assignedBy: user.username
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      commentators: match.commentators
    });
  } catch (error) {
    console.error("Error assigning commentator:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to assign commentator" }, { status: 500 });
  }
});
