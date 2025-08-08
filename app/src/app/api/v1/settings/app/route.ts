import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_APP_SETTINGS = {
    theme: 'auto',
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
        defaultResolution: '1920x1080',
        fps: 30,
        autoStart: false
    },
    lcu: {
        autoConnect: true,
        syncFrequency: 1000,
        enableChampSelectSync: true
    }
};

export async function GET(): Promise<NextResponse> {
    try {
        return NextResponse.json({
            success: true,
            settings: DEFAULT_APP_SETTINGS
        });
    } catch (error) {
        console.error('Settings API error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch app settings' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
    try {
        const { settings } = await request.json();

        // In a real app, you'd save these to database
        // For now, just return success
        return NextResponse.json({
            success: true,
            settings: { ...DEFAULT_APP_SETTINGS, ...settings }
        });
    } catch (error) {
        console.error('Settings update error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update app settings' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const { settings } = await request.json();

        // Reset to provided settings
        return NextResponse.json({
            success: true,
            settings: settings || DEFAULT_APP_SETTINGS
        });
    } catch (error) {
        console.error('Settings reset error:', error);
        return NextResponse.json({ success: false, error: 'Failed to reset app settings' }, { status: 500 });
    }
}
