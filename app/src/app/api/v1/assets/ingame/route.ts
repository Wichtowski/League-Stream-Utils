import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";
import { promises as fs } from "fs";
import { itemsBlueprintDownloader } from "@lib/services/assets/downloaders/items-blueprint-downloader";
import { itemCacheService } from "@lib/services/assets/item";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const filename = searchParams.get("filename");

    if (!category || !filename) {
      return NextResponse.json({ success: false, error: "Missing category or filename" }, { status: 400 });
    }

    const assetPath = resolve(process.cwd(), "public", "assets", category, filename);

    try {
      const fileBuffer = await fs.readFile(assetPath);
      const fileStats = await fs.stat(assetPath);

      return NextResponse.json({
        success: true,
        data: {
          filename,
          category,
          size: fileStats.size,
          data: fileBuffer.toString("base64")
        }
      });
    } catch (_fileError) {
      return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Asset API error:", error);
    return NextResponse.json({ success: false, error: "Failed to process asset request" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, category, filename } = body;

    switch (action) {
      case "download-single":
        if (!category || !filename) {
          return NextResponse.json({ success: false, error: "Missing category or filename" }, { status: 400 });
        }

        const assetPath = resolve(process.cwd(), "public", "assets", category, filename);

        try {
          const fileBuffer = await fs.readFile(assetPath);
          const fileStats = await fs.stat(assetPath);

          return NextResponse.json({
            success: true,
            data: {
              filename,
              category,
              size: fileStats.size,
              data: fileBuffer.toString("base64")
            }
          });
        } catch (_fileError) {
          return NextResponse.json({ success: false, error: "Asset not found" }, { status: 404 });
        }

      case "download-items":
        try {
          await itemCacheService.downloadAllItemsOnStartup();
          return NextResponse.json({
            success: true,
            message: "Items download completed successfully"
          });
        } catch (error) {
          console.error("Items download error:", error);
          return NextResponse.json({ success: false, error: "Failed to download items" }, { status: 500 });
        }

      case "check-items-progress":
        try {
          const version = await itemsBlueprintDownloader.getLatestVersion();
          const progress = await itemsBlueprintDownloader.getDownloadProgress(version);
          const completeness = await itemCacheService.checkCacheCompleteness();

          return NextResponse.json({
            success: true,
            data: {
              progress,
              completeness
            }
          });
        } catch (error) {
          console.error("Items progress check error:", error);
          return NextResponse.json({ success: false, error: "Failed to check items progress" }, { status: 500 });
        }

      default:
        return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Asset API error:", error);
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}
