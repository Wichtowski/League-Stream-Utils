import { NextRequest, NextResponse } from 'next/server';
import { getChampions, refreshChampionsCache } from '@lib/champions';
import type { Champion } from '@lib/types';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const forceUpdate = searchParams.get('forceUpdate') === 'true';

        let champions: Champion[] = [];

        if (forceUpdate) {
            champions = await refreshChampionsCache();
        } else {
            champions = await getChampions();
        }

        return NextResponse.json({
            success: true,
            data: {
                champions,
                count: champions.length,
                source: 'cache',
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Champions API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch champions',
                details: (error as Error).message
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (body.action === 'clearCache') {
            const champions = await refreshChampionsCache();
            return NextResponse.json({
                success: true,
                message: 'Champions cache cleared and refreshed successfully',
                count: champions.length
            });
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Champions POST API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: (error as Error).message
            },
            { status: 500 }
        );
    }
} 