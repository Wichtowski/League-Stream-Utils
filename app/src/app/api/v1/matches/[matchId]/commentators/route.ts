import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { connectToDatabase } from "@/lib/database/connection";
import { MatchModel, CommentatorModel } from "@/libTournament/database/models";

interface CommentatorData {
  name: string;
  xHandle?: string;
  instagramHandle?: string;
  twitchHandle?: string;
}

// GET: get commentators for a match
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const matchId = req.nextUrl.pathname.split("/")[4];
    await connectToDatabase();
    
    const match = await MatchModel.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    return NextResponse.json({ commentators: match.commentators || [] });
  } catch (error) {
    console.error("Error fetching match commentators:", error);
    return NextResponse.json({ error: "Failed to fetch commentators" }, { status: 500 });
  }
});

// POST: assign a commentator to a match
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const matchId = req.nextUrl.pathname.split("/")[4];
    const { commentatorId } = await req.json();
    
    if (!commentatorId) {
      return NextResponse.json({ error: "Commentator ID is required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Get the commentator details from global commentators
    const commentator = await CommentatorModel.findById(commentatorId);
    if (!commentator) {
      return NextResponse.json({ error: "Commentator not found" }, { status: 404 });
    }
    
    // Get the match
    const match = await MatchModel.findById(matchId);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    
    // Check if commentator is already assigned
    const isAlreadyAssigned = match.commentators.some((c: any) => c._id === commentatorId);
    if (isAlreadyAssigned) {
      return NextResponse.json({ error: "Commentator already assigned to this match" }, { status: 400 });
    }
    
    // Add commentator to match
    const commentatorDoc = commentator as unknown as CommentatorData;
    const newCommentator = {
      _id: commentatorId,
      name: commentatorDoc.name || "",
      xHandle: commentatorDoc.xHandle || undefined,
      instagramHandle: commentatorDoc.instagramHandle || undefined,
      twitchHandle: commentatorDoc.twitchHandle || undefined,
      assignedAt: new Date(),
      assignedBy: user.username
    };
    
    const updatedMatch = await MatchModel.findByIdAndUpdate(
      matchId,
      {
        $push: { commentators: newCommentator },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );
    
    return NextResponse.json({
      success: true,
      commentators: updatedMatch?.commentators || []
    });
  } catch (error) {
    console.error("Error assigning commentator:", error);
    return NextResponse.json({ error: "Failed to assign commentator" }, { status: 500 });
  }
});

// DELETE: remove a commentator from a match
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const matchId = req.nextUrl.pathname.split("/")[4];
    const { commentatorId } = await req.json();
    
    if (!commentatorId) {
      return NextResponse.json({ error: "Commentator ID is required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const updatedMatch = await MatchModel.findByIdAndUpdate(
      matchId,
      {
        $pull: { commentators: { _id: commentatorId } },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );
    
    if (!updatedMatch) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      commentators: updatedMatch.commentators || []
    });
  } catch (error) {
    console.error("Error removing commentator:", error);
    return NextResponse.json({ error: "Failed to remove commentator" }, { status: 500 });
  }
});