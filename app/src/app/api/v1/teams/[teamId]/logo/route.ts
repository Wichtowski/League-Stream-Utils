import { NextRequest, NextResponse } from "next/server";
import { getTeamById } from "@lib/database/team";

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
): Promise<NextResponse> {
  try {
    const { teamId } = params;

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    // Get team from database
    const team = await getTeamById(teamId);
    
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    if (!team.logo) {
      return NextResponse.json(
        { error: "Team has no logo" },
        { status: 404 }
      );
    }

    // If it's an external URL, redirect to it
    if (team.logo.type === "url") {
      return NextResponse.redirect(team.logo.url);
    }

    // If it's an uploaded file, return the base64 data directly
    if (team.logo.type === "upload" && team.logo.data) {
      // Check if it's base64 data
      if (team.logo.data.startsWith("data:")) {
        // Extract the base64 part
        const base64Data = team.logo.data.split(",")[1];
        const contentType = team.logo.data.split(";")[0].split(":")[1];
        
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');
        
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
      
      // If it's not base64, it might be a filename - return error for now
      return NextResponse.json(
        { error: "Logo format not supported" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Unsupported logo format" },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in team logo endpoint:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
