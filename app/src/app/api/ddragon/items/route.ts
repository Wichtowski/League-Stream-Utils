import { NextRequest, NextResponse } from "next/server";

const DDRAGON_CDN = "https://ddragon.leagueoflegends.com/cdn";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get("version") || "15.20.1";

    const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/item.json`, {
      headers: {
        "User-Agent": "League-Stream-Utils/1.0.0"
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.status}`);
    }

    const items = await response.json();

    return NextResponse.json(items, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  } catch (error) {
    console.error("Failed to fetch Data Dragon items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}
