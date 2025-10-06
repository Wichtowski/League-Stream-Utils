import { NextRequest, NextResponse } from "next/server";
import { findLCUCredentials, getChampSelectSession } from "@lib/services/external/LCU/helpers";
import { getDynamicMockData } from "@lib/mocks/dynamic-champselect";
import type { ChampSelectSession, ChampSelectAction, ChampSelectPlayer } from "@lib/types/game";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const logCsRequest = async (entry: unknown): Promise<void> => {
  const dir = path.join(process.cwd(), "cs-logs");
  const file = path.join(dir, `${new Date().toISOString().slice(0, 10)}.log`);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(
      file,
      JSON.stringify({ ts: new Date().toISOString(), ...((entry as Record<string, unknown>) || {}) }) + "\n",
      "utf8"
    );
  } catch {
    // ignore logging failures
  }
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const params = request.nextUrl.searchParams;
    const mockEnabled = params.get("mock") === "true";
    if (mockEnabled) {
      const data = getDynamicMockData();
      return NextResponse.json(
        {
          success: true,
          data,
          inChampSelect: true
        },
        { status: 200 }
      );
    }

    const credentials = await findLCUCredentials();
    if (!credentials) {
      await logCsRequest({ mock: false, success: false, error: "League Client not found" });
      return NextResponse.json(
        {
          success: false,
          error: "League Client not found",
          message: "Could not find League of Legends client credentials"
        },
        { status: 404 }
      );
    }

    // Get champion select session
    const champSelectResult = await getChampSelectSession(credentials);

    if (!champSelectResult.success) {
      await logCsRequest({ mock: false, success: false, message: champSelectResult.error });
      return NextResponse.json(
        {
          success: false,
          error: "Champion select request failed",
          message: champSelectResult.error
        },
        { status: 200 }
      );
    }

    // Process the LCU data to extract bans from actions
    const processedData: ChampSelectSession | null = champSelectResult.data ?? null;
    if (processedData && processedData.actions) {
      const flatActions = processedData.actions.flat();
      const blueBans: number[] = [];
      const redBans: number[] = [];
      
      // Extract completed ban actions
      flatActions.forEach((action: ChampSelectAction) => {
        if (action && action.type === "ban" && action.completed && action.championId) {
          // Determine team based on actorCellId
          const isBlueTeam = processedData.myTeam.some((p: ChampSelectPlayer) => p.cellId === action.actorCellId);
          if (isBlueTeam) {
            blueBans.push(action.championId);
          } else if (processedData.theirTeam.some((p: ChampSelectPlayer) => p.cellId === action.actorCellId)) {
            redBans.push(action.championId);
          }
        }
      });
      
      // Add bans to the data structure
      processedData.bans = {
        myTeamBans: blueBans,
        theirTeamBans: redBans
      };
    }

    await logCsRequest({
      mock: false,
      success: true,
      inChampSelect: champSelectResult.data !== null,
      data: processedData
    });
    return NextResponse.json({
      success: true,
      data: processedData,
      inChampSelect: champSelectResult.data !== null
    });
  } catch (error) {
    await logCsRequest({ mock: false, success: false, message: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json(
      {
        success: false,
        error: "Champion select polling failed",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}
