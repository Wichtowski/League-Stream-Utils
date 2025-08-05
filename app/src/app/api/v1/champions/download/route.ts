import { NextRequest, NextResponse } from "next/server";
import { championCacheService } from "@lib/services/cache/champion";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "download-all":
        const result =
          await championCacheService.downloadAllChampionsOnStartup();
        return NextResponse.json({
          success: result.success,
          data: {
            totalChampions: result.totalChampions,
            errors: result.errors,
            message: `Download completed. ${result.totalChampions} champions downloaded successfully.`,
          },
        });

      case "check-completeness":
        const completeness =
          await championCacheService.checkCacheCompleteness();
        return NextResponse.json({
          success: true,
          data: completeness,
        });

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Champion download API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process download request",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
