import { NextRequest, NextResponse } from "next/server";
import https from "https";
import { PlayerLiveInfoModel } from "@lib/database/models";
import { connectToDatabase } from "@lib/database";

export async function GET(request: NextRequest) {
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

        // Check for matchId header to enhance data with player live info
        const matchId = request.headers.get("x-match-id");
        
        if (matchId) {
          try {
            // Connect to database
            await connectToDatabase();
            
            // Query player live info for this match
            const playerLiveInfo = await PlayerLiveInfoModel.find({ matchId }).lean();
            
            if (playerLiveInfo && playerLiveInfo.length > 0) {
              // Enhance gameData with player live info
              if (gameData.allPlayers && Array.isArray(gameData.allPlayers)) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                gameData.allPlayers = gameData.allPlayers.map((player: any) => {
                  // Find matching player live info by riotId
                  const liveInfo = playerLiveInfo.find(
                    (info) => info.riotId === player.riotId
                  );
                  
                  if (liveInfo) {
                    // Merge live info into player data
                    return {
                      ...player,
                      liveInfo: {
                        currentGold: liveInfo.currentGold,
                        championStats: liveInfo.championStats,
                        timestamp: liveInfo.timestamp
                      }
                    };
                  }
                  
                  return player;
                });
              }
            }
          } catch (dbError) {
            console.warn("Failed to fetch player live info:", dbError);
            // Continue without live info if database query fails
          }
        }

        // Return the game data with CORS headers
        return NextResponse.json(gameData, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-match-id"
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
      { status: 312 }
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
      "Access-Control-Allow-Headers": "Content-Type, x-match-id"
    }
  });
}
