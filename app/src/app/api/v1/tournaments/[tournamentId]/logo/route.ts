import { NextRequest, NextResponse } from "next/server";
import { getTournamentById } from "@lib/database/tournament";

interface RouteContext {
  params: Promise<{ tournamentId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { tournamentId } = await params;

    if (!tournamentId) {
      return NextResponse.json({ error: "Tournament ID is required" }, { status: 400 });
    }

    // Get tournament from database
    const tournament = await getTournamentById(tournamentId);

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (!tournament.logo) {
      return NextResponse.json({ error: "Tournament has no logo" }, { status: 404 });
    }

    // If it's an external URL, redirect to it
    if (tournament.logo.type === "url") {
      return NextResponse.redirect(tournament.logo.url);
    }

    // If it's an uploaded file, return the base64 data directly
    if (tournament.logo.type === "upload" && tournament.logo.data) {
      // Check if it's base64 data
      if (tournament.logo.data.startsWith("data:")) {
        // Extract the base64 part
        const base64Data = tournament.logo.data.split(",")[1];
        const contentType = tournament.logo.data.split(";")[0].split(":")[1];

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
  } catch (error) {
    console.error("Error fetching tournament logo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
