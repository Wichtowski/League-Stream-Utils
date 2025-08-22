import { NextRequest, NextResponse } from "next/server";
import { resolve } from "path";
import { promises as fs } from "fs";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain"
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const relativePath = pathSegments.join("/");
    
    // Prevent directory traversal
    if (relativePath.includes("..") || relativePath.startsWith("/")) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    const assetPath = resolve(process.cwd(), "public", "assets", relativePath);

    try {
      const fileBuffer = await fs.readFile(assetPath);
      const fileStats = await fs.stat(assetPath);
      const ext = relativePath.split(".").pop()?.toLowerCase() || "";
      const contentType = CONTENT_TYPES[`.${ext}`] || "application/octet-stream";

      const headers: Record<string, string> = {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": fileStats.size.toString()
      };

      // Add specific headers for SVG files
      if (ext === "svg") {
        headers["X-Content-Type-Options"] = "nosniff";
        headers["Content-Security-Policy"] = "default-src 'self'";
      }

      return new NextResponse(fileBuffer, {
        status: 200,
        headers
      });
    } catch (fileError) {
      console.error(`Asset not found: ${assetPath}`, fileError);
      return new NextResponse("Asset not found", { status: 404 });
    }
  } catch (error) {
    console.error("Asset API error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
