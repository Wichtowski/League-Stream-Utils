import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { getMatchesByTournament } from "@libTournament/database/match";
import { connectToDatabase } from "@lib/database/connection";
import { MatchModel, CommentatorModel, type CommentatorDoc } from "@libTournament/database/models";
import { Commentator } from "@libTournament/types";
import { JWTPayload } from "@lib/types/auth";

// GET: get all commentators for a tournament
export const GET = withAuth(async (req: NextRequest, user: JWTPayload, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;
    const matches = await getMatchesByTournament(tournamentId);

    // Extract all unique commentators from matches
    const allCommentators: Commentator[] = [];
    const commentatorIds = new Set<string>();

    matches.forEach((match) => {
      if (match.commentators && Array.isArray(match.commentators)) {
        match.commentators.forEach((commentator: Commentator) => {
          if (commentator._id && !commentatorIds.has(commentator._id)) {
            commentatorIds.add(commentator._id);
            allCommentators.push({
              _id: commentator._id,
              name: commentator.name,
              xHandle: commentator.xHandle,
              instagramHandle: commentator.instagramHandle,
              twitchHandle: commentator.twitchHandle
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
export const POST = withAuth(async (req: NextRequest, user: JWTPayload, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;
    const { commentatorId } = await req.json();

    if (!commentatorId) {
      return NextResponse.json({ error: "Commentator ID is required" }, { status: 400 });
    }

    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }

    // Get the commentator details from the global commentators collection
    const commentator = (await CommentatorModel.findById(commentatorId)) as CommentatorDoc | null;
    if (!commentator) {
      return NextResponse.json({ error: "Commentator not found" }, { status: 404 });
    }

    // Get all matches for this tournament
    const matches = await MatchModel.find({ tournamentId });

    if (matches.length === 0) {
      return NextResponse.json(
        {
          error: "No matches found for this tournament. Please create matches first."
        },
        { status: 404 }
      );
    }

    const commentatorData = {
      _id: commentatorId,
      name: commentator.name,
      xHandle: commentator.xHandle,
      instagramHandle: commentator.instagramHandle,
      twitchHandle: commentator.twitchHandle,
      createdBy: user.userId,
      createdAt: new Date()
    };

    // Add commentator to all matches in the tournament
    const result = await MatchModel.updateMany(
      { tournamentId },
      {
        $push: { commentators: commentatorData },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({
      success: true,
      commentator: {
        id: commentatorId,
        name: commentator.name,
        xHandle: commentator.xHandle,
        instagramHandle: commentator.instagramHandle,
        twitchHandle: commentator.twitchHandle,
        createdBy: commentatorData.createdBy,
        createdAt: commentatorData.createdAt
      },
      matchesUpdated: result.modifiedCount
    });
  } catch (error) {
    console.error("Error assigning tournament commentator:", error);
    return NextResponse.json(
      {
        error: "Failed to assign commentator",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
});

// PUT: update a commentator in all matches in a tournament
export const PUT = withAuth(async (req: NextRequest, user: JWTPayload, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;
    const { commentatorId, name, xHandle, instagramHandle, twitchHandle } = await req.json();

    if (!commentatorId || !name) {
      return NextResponse.json({ error: "Commentator ID and name are required" }, { status: 400 });
    }

    // Get all matches for this tournament
    const matches = await MatchModel.find({ tournamentId });

    if (matches.length === 0) {
      return NextResponse.json(
        {
          error: "No matches found for this tournament"
        },
        { status: 404 }
      );
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
    return NextResponse.json(
      {
        error: "Failed to update commentator",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
});

// DELETE: remove a commentator from all matches in a tournament
export const DELETE = withAuth(async (req: NextRequest, _user: JWTPayload, params: Promise<Record<string, string>>) => {
  try {
    const { tournamentId } = await params;
    const { commentatorId } = await req.json();

    if (!commentatorId) {
      return NextResponse.json({ error: "Commentator ID is required" }, { status: 400 });
    }

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
