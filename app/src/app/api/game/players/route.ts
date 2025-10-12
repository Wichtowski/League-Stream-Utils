import { NextRequest, NextResponse } from "next/server";
import https from "https";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "Missing 'name' query parameter" }, { status: 400 });
  }

  try {
    const response = await new Promise<{ statusCode: number; data: string }>((resolve, reject) => {
      const options = {
        hostname: "127.0.0.1",
        port: 2999,
        path: `/liveclientdata/playerlist`,
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        rejectUnauthorized: false,
        agent: new https.Agent({ rejectUnauthorized: false, minVersion: "TLSv1.2", maxVersion: "TLSv1.3" })
      } as const;

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode || 200, data });
        });
      });

      req.on("error", (error) => reject(error));
      req.setTimeout(8000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });
      req.end();
    });

    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 400) {
      try {
        const playerData = JSON.parse(response.data);
        return NextResponse.json(playerData, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      } catch (_err) {
        return NextResponse.json({ error: "Invalid JSON response" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Live Client error" }, { status: response.statusCode || 500 });
  } catch (_error) {
    return NextResponse.json({ error: "Live Client API is not running" }, { status: 212 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
