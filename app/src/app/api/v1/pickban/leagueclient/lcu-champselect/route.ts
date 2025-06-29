import { NextResponse } from 'next/server';
import { findLCUCredentials, getChampSelectSession } from '@lib/utils/lcu-helpers';

export async function GET(): Promise<NextResponse> {
    try {
        const credentials = await findLCUCredentials();

        if (!credentials) {
            return NextResponse.json({
                success: false,
                error: 'League Client not found',
                message: 'Could not find League of Legends client credentials'
            }, { status: 404 });
        }

        // Get champion select session
        const champSelectResult = await getChampSelectSession(credentials);

        if (!champSelectResult.success) {
            return NextResponse.json({
                success: false,
                error: 'Champion select request failed',
                message: champSelectResult.error
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: champSelectResult.data,
            inChampSelect: champSelectResult.data !== null
        });

    } catch (error) {
        console.error('Champion select polling error:', error);

        return NextResponse.json({
            success: false,
            error: 'Champion select polling failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
} 