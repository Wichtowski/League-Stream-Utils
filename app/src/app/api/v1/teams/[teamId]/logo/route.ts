import { NextRequest, NextResponse } from "next/server";
import { getTeamLogoByTeamId } from "@lib/database/team";

interface TeamLogoResponse {
  params: Promise<{ teamId: string }>;
}

export async function GET(_request: NextRequest, { params }: TeamLogoResponse): Promise<NextResponse> {
  try {
    const { teamId } = await params;
    console.log("Logo endpoint called for team ID:", teamId);

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    // Get team from database
    const teamLogo = await getTeamLogoByTeamId(teamId);
    console.log("Retrieved team logo:", teamLogo ? "yes" : "no", "Type:", teamLogo?.type);

    if (!teamLogo) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    if (!teamLogo) {
      return NextResponse.json({ error: "Team has no logo" }, { status: 404 });
    }

    // If it's an external URL, proxy it to avoid CORS issues
    if (teamLogo.type === "url") {
      try {
        // Fetch the external image
        const imageResponse = await fetch(teamLogo.url);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch external image: ${imageResponse.status}`);
        }

        // Get the image data
        const imageBuffer = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get("content-type") || "image/png";

        // Return the proxied image
        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (_error) {
        return NextResponse.json({ error: "Failed to proxy external logo" }, { status: 500 });
      }
    }

    // If it's an uploaded file, return the base64 data directly
    if (teamLogo.type === "upload" && teamLogo.data) {
      // Check if it's base64 data
      if (teamLogo.data.startsWith("data:")) {
        // Extract the base64 part
        const base64Data = teamLogo.data.split(",")[1];
        const contentType = teamLogo.data.split(";")[0].split(":")[1];

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, "base64");

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=3600"
          }
        });
      }

      // If it's not base64, it might be a filename - return error for now
      return NextResponse.json({ error: "Logo format not supported" }, { status: 400 });
    }

    return NextResponse.json({ error: "Unsupported logo format" }, { status: 400 });
  } catch (_error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
