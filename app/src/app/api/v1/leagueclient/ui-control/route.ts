import { NextRequest, NextResponse } from "next/server";
import { findLCUCredentials } from "@lib/services/external/LCU/helpers";
import { LCUClient, LCUUIControl } from "@lib/services/external/LCU/client";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { action } = await request.json();

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: "Action is required",
          message: "Please specify an action: 'hideAll', 'showAll', or 'hideKeepEssentials'"
        },
        { status: 400 }
      );
    }

    const credentials = await findLCUCredentials();
    if (!credentials) {
      return NextResponse.json(
        {
          success: false,
          error: "League Client not found",
          message: "Make sure the League client is open and try again"
        },
        { status: 404 }
      );
    }

    const lcuClient = new LCUClient(credentials);
    const uiControl = new LCUUIControl(lcuClient);

    switch (action) {
      case "hideAll":
        await uiControl.hideAllUI();
        return NextResponse.json({
          success: true,
          message: "All UI elements hidden successfully"
        });

      case "showAll":
        await uiControl.showAllUI();
        return NextResponse.json({
          success: true,
          message: "All UI elements shown successfully"
        });

      case "hideKeepEssentials":
        await uiControl.hideUIKeepEssentials();
        return NextResponse.json({
          success: true,
          message: "UI hidden, keeping essential elements (minimap, kill callouts, announcements, neutral timers, quests)"
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid action",
            message: "Valid actions are: 'hideAll', 'showAll', 'hideKeepEssentials'"
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("UI control error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to control UI",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const credentials = await findLCUCredentials();
    if (!credentials) {
      return NextResponse.json(
        {
          success: false,
          error: "League Client not found",
          message: "Make sure the League client is open and try again"
        },
        { status: 404 }
      );
    }

    const lcuClient = new LCUClient(credentials);
    const uiControl = new LCUUIControl(lcuClient);

    const currentSettings = await uiControl.getCurrentRenderSettings();

    return NextResponse.json({
      success: true,
      data: currentSettings,
      message: "Current render settings retrieved successfully"
    });
  } catch (error) {
    console.error("Get render settings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get render settings",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      },
      { status: 500 }
    );
  }
}
