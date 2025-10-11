import { NextRequest, NextResponse } from "next/server";

const DDRAGON_BASE_URL = "https://ddragon.leagueoflegends.com";

export async function GET(): Promise<NextResponse> {
  try {
    const response = await fetch(`${DDRAGON_BASE_URL}/api/versions.json`, {
      headers: {
        "User-Agent": "League-Stream-Utils/1.0.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch versions: ${response.status}`);
    }

    const versions = await response.json();
    
    return NextResponse.json(versions, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Failed to fetch Data Dragon versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}
