import { NextRequest, NextResponse } from "next/server";
import { findLCUCredentials, getChampSelectSession } from "@lib/services/external/LCU/helpers";
import { MOCK_CHAMP_SELECT_DATA } from "@lib/mocks/champselect";

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
