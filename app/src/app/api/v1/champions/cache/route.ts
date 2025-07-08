import { NextRequest, NextResponse } from 'next/server';
import { getChampionCacheStats, refreshChampionsCache } from '@lib/champions';

export async function GET(_request: NextRequest) {
    try {
        const stats = await getChampionCacheStats();

        return NextResponse.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Champion cache stats API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get cache stats',
                details: (error as Error).message
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'refresh':
                const refreshedChampions = await refreshChampionsCache();
                return NextResponse.json({
                    success: true,
                    data: {
                        champions: refreshedChampions,
                        count: refreshedChampions.length,
                        message: 'Champion cache refreshed successfully'
                    }
                });

            case 'stats':
                const stats = await getChampionCacheStats();
                return NextResponse.json({
                    success: true,
                    data: stats
                });

            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid action' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Champion cache API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to process cache operation',
                details: (error as Error).message
            },
            { status: 500 }
        );
    }
} 