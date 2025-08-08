import { NextResponse } from "next/server";
import { findLCUCredentials, testLCUConnection } from "@lib/utils/LCU/lcu-helpers";

export async function GET(): Promise<NextResponse> {
  try {
    const credentials = await findLCUCredentials();

    if (!credentials) {
      return NextResponse.json(
        {
          success: false,
          error: "League Client not found",
          message: "Could not find League of Legends client",
          suggestions: [
            "Start League of Legends client",
            "Log into your account (not on login screen)",
            "Wait for client to fully load",
            "Try restarting the League client"
          ]
        },
        { status: 200 }
      );
    }

    // Test the connection
    const testResult = await testLCUConnection(credentials);

    if (testResult.success && testResult.data) {
      const summoner = testResult.data;
      return NextResponse.json({
        success: true,
        message: `✅ Test successful! Connected to summoner: ${summoner.displayName || "Unknown"} (Level ${summoner.summonerLevel || "?"})`,
        summoner: {
          displayName: summoner.displayName,
          summonerLevel: summoner.summonerLevel,
          profileIconId: summoner.profileIconId
        },
        credentials: {
          port: credentials.port,
          protocol: credentials.protocol,
          hasPassword: !!credentials.password
        }
      });
    } else {
      console.warn("LCU connection test failed:", testResult.error || "Unable to connect to League Client");
      return NextResponse.json(
        {
          success: false,
          error: "LCU connection test failed",
          message: testResult.error || "Unable to connect to League Client"
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.warn("LCU test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "LCU test failed",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 200 }
    );
  }
}
