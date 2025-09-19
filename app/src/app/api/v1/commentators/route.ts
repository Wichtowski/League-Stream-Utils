import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@lib/auth";
import { connectToDatabase } from "@/lib/database/connection";
import { CommentatorModel } from "@/libTournament/database/models";

// GET: get all commentators
export const GET = withAuth(async (req: NextRequest) => {
  try {
    await connectToDatabase();
    const commentators = await CommentatorModel.find().sort({ name: 1 });
    
    // Transform the commentators to have consistent ID field
    const transformedCommentators = commentators.map((commentator) => ({
      id: commentator._id,
      name: (commentator as any).name,
      xHandle: (commentator as any).xHandle,
      instagramHandle: (commentator as any).instagramHandle,
      twitchHandle: (commentator as any).twitchHandle,
      createdBy: (commentator as any).createdBy,
      createdAt: (commentator as any).createdAt
    }));
    
    return NextResponse.json({ commentators: transformedCommentators });
  } catch (error) {
    console.error("Error fetching commentators:", error);
    return NextResponse.json({ error: "Failed to fetch commentators" }, { status: 500 });
  }
});

// POST: create a new commentator
export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    const { name, xHandle, instagramHandle, twitchHandle } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const commentator = new CommentatorModel({
      name,
      xHandle: xHandle || undefined,
      instagramHandle: instagramHandle || undefined,
      twitchHandle: twitchHandle || undefined,
      createdBy: user.username,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await commentator.save();
    
    return NextResponse.json({ 
      success: true, 
      commentator: {
        id: commentator._id,
        name: (commentator as any).name,
        xHandle: (commentator as any).xHandle,
        instagramHandle: (commentator as any).instagramHandle,
        twitchHandle: (commentator as any).twitchHandle,
        createdBy: (commentator as any).createdBy,
        createdAt: (commentator as any).createdAt
      }
    });
  } catch (error) {
    console.error("Error creating commentator:", error);
    return NextResponse.json({ error: "Failed to create commentator" }, { status: 500 });
  }
});

// PUT: update a commentator
export const PUT = withAuth(async (req: NextRequest, user) => {
  try {
    const { id, name, xHandle, instagramHandle, twitchHandle } = await req.json();
    
    if (!id || !name) {
      return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const commentator = await CommentatorModel.findByIdAndUpdate(
      id,
      {
        name,
        xHandle: xHandle || undefined,
        instagramHandle: instagramHandle || undefined,
        twitchHandle: twitchHandle || undefined,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!commentator) {
      return NextResponse.json({ error: "Commentator not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      commentator: {
        id: commentator._id,
        name: (commentator as any).name,
        xHandle: (commentator as any).xHandle,
        instagramHandle: (commentator as any).instagramHandle,
        twitchHandle: (commentator as any).twitchHandle,
        createdBy: (commentator as any).createdBy,
        createdAt: (commentator as any).createdAt
      }
    });
  } catch (error) {
    console.error("Error updating commentator:", error);
    return NextResponse.json({ error: "Failed to update commentator" }, { status: 500 });
  }
});

// DELETE: delete a commentator
export const DELETE = withAuth(async (req: NextRequest, user) => {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const commentator = await CommentatorModel.findByIdAndDelete(id);
    
    if (!commentator) {
      return NextResponse.json({ error: "Commentator not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting commentator:", error);
    return NextResponse.json({ error: "Failed to delete commentator" }, { status: 500 });
  }
});
