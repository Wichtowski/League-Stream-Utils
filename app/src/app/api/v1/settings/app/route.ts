import { NextRequest, NextResponse } from "next/server";

const DEFAULT_APP_SETTINGS = {
  theme: "auto",
  defaultTimeouts: {
    pickPhase: 30,
    banPhase: 20
  },
  notifications: {
    enabled: true,
    sound: true,
    desktop: false
  },
  streaming: {
    obsIntegration: false,
    autoRefresh: true,
    refreshInterval: 5000
  },
  cameras: {
    defaultResolution: "1920x1080",
    fps: 30,
    autoStart: false
  },
  lcu: {
    autoConnect: true,
    syncFrequency: 1000,
    enableChampSelectSync: true
  },
  lastSelectedTournamentId: null as string | null,
  lastSelectedMatchId: null as string | null
};

let APP_SETTINGS_STATE = { ...DEFAULT_APP_SETTINGS };

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({
      success: true,
      settings: APP_SETTINGS_STATE
    });
  } catch (error) {
    console.error("Settings API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch app settings" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { settings } = await request.json();

    APP_SETTINGS_STATE = { ...APP_SETTINGS_STATE, ...settings };
    return NextResponse.json({
      success: true,
      settings: APP_SETTINGS_STATE
    });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update app settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { settings } = await request.json();

    APP_SETTINGS_STATE = settings ? { ...DEFAULT_APP_SETTINGS, ...settings } : { ...DEFAULT_APP_SETTINGS };
    return NextResponse.json({
      success: true,
      settings: APP_SETTINGS_STATE
    });
  } catch (error) {
    console.error("Settings reset error:", error);
    return NextResponse.json({ success: false, error: "Failed to reset app settings" }, { status: 500 });
  }
}
