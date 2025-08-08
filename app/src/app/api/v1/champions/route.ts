import { NextRequest, NextResponse } from "next/server";
import { getChampions, refreshChampionsCache, getChampionCacheStats, getChampionByKeyEnhanced } from "@lib/champions";
import type { Champion } from "@lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const forceUpdate = searchParams.get("forceUpdate") === "true";
    const enhanced = searchParams.get("enhanced") === "true";

    let champions: Champion[] = [];

    if (forceUpdate) {
      champions = await refreshChampionsCache();
    } else {
      champions = await getChampions();
    }

    // Get cache stats if enhanced mode is requested
    let cacheStats = null;
    if (enhanced) {
      cacheStats = await getChampionCacheStats();
    }

    return NextResponse.json({
      success: true,
      data: {
        champions,
        count: champions.length,
        source: enhanced ? "comprehensive-cache" : "cache",
        lastUpdated: new Date().toISOString(),
        cacheStats
      }
    });
  } catch (error) {
    console.error("Champions API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch champions",
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, championKey } = body;

    switch (action) {
      case "get-champion":
        if (!championKey) {
          return NextResponse.json({ success: false, error: "Champion key is required" }, { status: 400 });
        }

        const champion = await getChampionByKeyEnhanced(championKey);
        if (!champion) {
          return NextResponse.json({ success: false, error: "Champion not found" }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          data: champion
        });

      case "refresh-cache":
        const refreshedChampions = await refreshChampionsCache();
        return NextResponse.json({
          success: true,
          data: {
            champions: refreshedChampions,
            count: refreshedChampions.length,
            message: "Champion cache refreshed successfully"
          }
        });

      case "get-cache-stats":
        const stats = await getChampionCacheStats();
        return NextResponse.json({
          success: true,
          data: stats
        });

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Champions API POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process request",
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
