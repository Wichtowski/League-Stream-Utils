import { NextRequest, NextResponse } from "next/server";
import { findLCUCredentials, getChampSelectSession } from "@/lib/services/external/LCU/helpers";
import { MOCK_CHAMP_SELECT_DATA } from "@lib/mocks/champselect";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const params = request.nextUrl.searchParams;
    const mockEnabled = params.get("mock") === "true";
    if (mockEnabled) {
      return NextResponse.json(
        {
          success: true,
          data: MOCK_CHAMP_SELECT_DATA,
          inChampSelect: true
        },
        { status: 200 }
      );
    }

    const credentials = await findLCUCredentials();
    if (!credentials) {
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
    
    // Save champSelectResult to file for debugging/analysis
    try {
      const logDir = join(process.cwd(), 'logs');
      mkdirSync(logDir, { recursive: true });
      
      const filename = 'champ-select-data.json';
      const filepath = join(logDir, filename);
      
      // Read existing data if file exists
      let existingData = [];
      try {
        if (existsSync(filepath)) {
          const fileContent = readFileSync(filepath, 'utf8');
          existingData = JSON.parse(fileContent);
        }
      } catch (readError) {
        console.error('Failed to read existing data:', readError);
      }
      
      // Add new entry with timestamp
      const entry = {
        timestamp: new Date().toISOString(),
        data: champSelectResult
      };
      
      existingData.push(entry);
      
      // Write back to file
      writeFileSync(filepath, JSON.stringify(existingData, null, 2));
      console.log(`Champ select data appended to: ${filepath}`);
    } catch (writeError) {
      console.error('Failed to save champ select data to file:', writeError);
    }

    if (!champSelectResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Champion select request failed",
          message: champSelectResult.error
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: champSelectResult.data,
      inChampSelect: champSelectResult.data !== null
    });
  } catch (error) {
    console.error("Champion select polling error:", error);

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
