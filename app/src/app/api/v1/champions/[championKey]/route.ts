import { NextRequest, NextResponse } from "next/server";
import { getChampionByKeyEnhanced } from "@lib/champions";

export async function GET(request: NextRequest, { params }: { params: Promise<{ championKey: string }> }) {
  try {
    const { championKey } = await params;

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
  } catch (error) {
    console.error("Champion API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch champion data",
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
