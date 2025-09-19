import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getMatchesByTournament } from "@/libTournament/database/match";
import { connectToDatabase } from "@/lib/database/connection";
import { MatchModel, CommentatorModel } from "@/libTournament/database/models";
import type { MatchCommentator } from "@lib/types/match";

interface CommentatorData {
  name: string;
  xHandle?: string;
  instagramHandle?: string;
  twitchHandle?: string;
}

// GET: get all commentators for a tournament
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const tournamentId = req.nextUrl.pathname.split("/")[4];
    const matches = await getMatchesByTournament(tournamentId);
    
    // Extract all unique commentators from matches
    const allCommentators: Array<{ 
      id: string; 
      name: string; 
      xHandle?: string; 
      instagramHandle?: string; 
      twitchHandle?: string; 
      assignedAt: Date;
      assignedBy: string;
    }> = [];
    const commentatorIds = new Set<string>();
    
    matches.forEach((match) => {
      if (match.commentators && Array.isArray(match.commentators)) {
        match.commentators.forEach((commentator: MatchCommentator) => {
          if (!commentatorIds.has(commentator._id)) {
            commentatorIds.add(commentator._id);
            allCommentators.push({
              id: commentator._id,
              name: commentator.name,
              xHandle: commentator.xHandle,
              instagramHandle: commentator.instagramHandle,
              twitchHandle: commentator.twitchHandle,
              assignedAt: new Date(commentator.assignedAt),
              assignedBy: commentator.assignedBy
            });
          }
        });
      }
    });
    
    return NextResponse.json({ commentators: allCommentators });
  } catch (error) {
    console.error("Error fetching tournament commentators:", error);
    return NextResponse.json({ error: "Failed to fetch commentators" }, { status: 500 });
  }
});

// POST: assign a global commentator to all matches in a tournament
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const tournamentId = req.nextUrl.pathname.split("/")[4];
    const { commentatorId } = await req.json();
    
    console.log("Assigning commentator to tournament:", { 
      tournamentId, 
      commentatorId, 
      user: user.username,
      pathname: req.nextUrl.pathname,
      pathParts: req.nextUrl.pathname.split("/")
    });
    
    if (!commentatorId) {
      console.log("Missing commentatorId in request body");
      return NextResponse.json({ error: "Commentator ID is required" }, { status: 400 });
    }
    
    if (!tournamentId) {
      console.log("Missing tournamentId in URL path");
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Get the commentator details from the global commentators collection
    const commentator = await CommentatorModel.findById(commentatorId);
    if (!commentator) {
      return NextResponse.json({ error: "Commentator not found" }, { status: 404 });
    }
    
    // Get all matches for this tournament
    const matches = await MatchModel.find({ tournamentId });
    console.log("Found matches:", matches.length);
    
    if (matches.length === 0) {
      return NextResponse.json({ 
        error: "No matches found for this tournament. Please create matches first." 
      }, { status: 404 });
    }
    
    const commentatorDoc = commentator as unknown as CommentatorData;
    const commentatorData = {
      _id: commentatorId,
      name: commentatorDoc.name || "",
      xHandle: commentatorDoc.xHandle || undefined,
      instagramHandle: commentatorDoc.instagramHandle || undefined,
      twitchHandle: commentatorDoc.twitchHandle || undefined,
      assignedAt: new Date(),
      assignedBy: user.username
    };
    
    console.log("Adding commentator to matches:", commentatorData);
    
    // Add commentator to all matches in the tournament
    const result = await MatchModel.updateMany(
      { tournamentId },
      { 
        $push: { commentators: commentatorData },
        $set: { updatedAt: new Date() }
      }
    );
    
    console.log("Update result:", result);
    
    return NextResponse.json({ 
      success: true, 
      commentator: {
        id: commentatorId,
        name: commentatorDoc.name || "",
        xHandle: commentatorDoc.xHandle || undefined,
        instagramHandle: commentatorDoc.instagramHandle || undefined,
        twitchHandle: commentatorDoc.twitchHandle || undefined,
        assignedAt: commentatorData.assignedAt,
        assignedBy: commentatorData.assignedBy
      },
      matchesUpdated: result.modifiedCount
    });
  } catch (error) {
    console.error("Error assigning tournament commentator:", error);
    return NextResponse.json({ 
      error: "Failed to assign commentator", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
});

// PUT: update a commentator in all matches in a tournament
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const tournamentId = req.nextUrl.pathname.split("/")[4];
    const { commentatorId, name, xHandle, instagramHandle, twitchHandle } = await req.json();
    
    console.log("Updating commentator:", { tournamentId, commentatorId, name, xHandle, instagramHandle, twitchHandle, user: user.username });
    
    if (!commentatorId || !name) {
      return NextResponse.json({ error: "Commentator ID and name are required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Get all matches for this tournament
    const matches = await MatchModel.find({ tournamentId });
    console.log("Found matches:", matches.length);
    
    if (matches.length === 0) {
      return NextResponse.json({ 
        error: "No matches found for this tournament" 
      }, { status: 404 });
    }
    
    const updatedCommentator = {
      name,
      xHandle: xHandle || undefined,
      instagramHandle: instagramHandle || undefined,
      twitchHandle: twitchHandle || undefined,
      assignedAt: new Date(),
      assignedBy: user.username
    };
    
    console.log("Updating commentator in matches:", updatedCommentator);
    
    // Update commentator in all matches in the tournament
    const result = await MatchModel.updateMany(
      { 
        tournamentId,
        "commentators._id": commentatorId
      },
      { 
        $set: { 
          "commentators.$": {
            _id: commentatorId,
            ...updatedCommentator
          },
          updatedAt: new Date()
        }
      }
    );
    
    console.log("Update result:", result);
    
    return NextResponse.json({ 
      success: true, 
      commentator: { id: commentatorId, ...updatedCommentator },
      matchesUpdated: result.modifiedCount
    });
  } catch (error) {
    console.error("Error updating tournament commentator:", error);
    return NextResponse.json({ 
      error: "Failed to update commentator", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
});

// DELETE: remove a commentator from all matches in a tournament
export const DELETE = withAuth(async (req: NextRequest, _user) => {
  try {
    const tournamentId = req.nextUrl.pathname.split("/")[4];
    const { commentatorId } = await req.json();
    
    if (!commentatorId) {
      return NextResponse.json({ error: "Commentator ID is required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Remove commentator from all matches in the tournament
    await MatchModel.updateMany(
      { tournamentId },
      { 
        $pull: { commentators: { _id: commentatorId } },
        $set: { updatedAt: new Date() }
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing tournament commentator:", error);
    return NextResponse.json({ error: "Failed to remove commentator" }, { status: 500 });
  }
});
