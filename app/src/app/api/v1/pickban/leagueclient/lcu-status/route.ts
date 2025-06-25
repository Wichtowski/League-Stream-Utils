import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
    try {
        // Mock LCU status - in real implementation this would check actual LCU connection
        const mockLcuStatus = {
            connected: false,
            gameflowPhase: null,
            inChampSelect: false,
            currentSummoner: null,
            championSelectSession: null,
            lastUpdated: new Date()
        };

        return NextResponse.json({
            success: true,
            status: mockLcuStatus
        });
    } catch (error) {
        console.error('LCU status check error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to check LCU status' },
            { status: 500 }
        );
    }
} 