import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_USER_PREFERENCES = {
    favoriteChampions: [],
    defaultRole: '',
    teamDisplayMode: 'cards',
    sessionSortBy: 'date',
    showTutorials: true,
    compactMode: false
};

export async function GET(): Promise<NextResponse> {
    try {
        return NextResponse.json({
            success: true,
            preferences: DEFAULT_USER_PREFERENCES
        });
    } catch (error) {
        console.error('User preferences API error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user preferences' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
    try {
        const { preferences } = await request.json();

        // In a real app, you'd save these to database
        // For now, just return success
        return NextResponse.json({
            success: true,
            preferences: { ...DEFAULT_USER_PREFERENCES, ...preferences }
        });
    } catch (error) {
        console.error('User preferences update error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user preferences' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
    try {
        const { preferences } = await request.json();

        // Reset to provided preferences
        return NextResponse.json({
            success: true,
            preferences: preferences || DEFAULT_USER_PREFERENCES
        });
    } catch (error) {
        console.error('User preferences reset error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to reset user preferences' },
            { status: 500 }
        );
    }
} 