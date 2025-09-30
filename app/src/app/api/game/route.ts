import { NextRequest, NextResponse } from "next/server";
import https from "https";

export async function GET(_request: NextRequest) {
  try {
    // Use Node.js https module with proper SSL handling
    const response = await new Promise<{ statusCode: number; data: string }>((resolve, reject) => {
      const options = {
        hostname: "127.0.0.1",
        port: 2999,
        path: "/liveclientdata/allgamedata",
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        rejectUnauthorized: false, // Ignore SSL certificate verification issues
        agent: new https.Agent({
          rejectUnauthorized: false,
          minVersion: "TLSv1.2", // Support TLS 1.2 and above (including 1.3)
          maxVersion: "TLSv1.3" // Allow up to TLS 1.3
        })
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode || 200, data });
        });
      });

      req.on("error", (error) => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.end();
    });

    if (response.statusCode && response.statusCode >= 200 && response.statusCode < 400) {
      try {
        const gameData = JSON.parse(response.data);

        // Return the game data with CORS headers
        return NextResponse.json(gameData, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      } catch (parseError) {
        console.error("Game API: Failed to parse JSON response:", parseError);
        return NextResponse.json(
          {
            error: "Invalid JSON response from Live Client Data API",
            details: "The API returned data that couldn't be parsed as JSON"
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        {
          error: "Live Client Data API error",
          status: response.statusCode,
          details: "The API returned an error status code"
        },
        { status: response.statusCode || 500 }
      );
    }
  } catch (_error) {
    return NextResponse.json(
      {
        error: "Live Client Data API is not running",
        details: "The API is not running"
      },
      { status: 212 }
    );
  }
}

// Handle OPTIONS request for CORS preflight
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
