import { NextRequest, NextResponse } from "next/server";
import { getTeamById } from "@libTeam/database";

// GET /api/public/teams/[teamId] - Get specific team (public)
export async function GET(req: NextRequest) {
  try {
    const teamId = new URL(req.url).pathname.split("/").pop()!;

    const team = await getTeamById(teamId);

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const response = NextResponse.json({ team });
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  } catch (error) {
    console.error("Error fetching public team:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

