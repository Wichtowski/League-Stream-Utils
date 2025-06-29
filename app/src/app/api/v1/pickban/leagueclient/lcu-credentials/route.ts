import { NextRequest, NextResponse } from 'next/server';
import { findLCUCredentials, testLCUConnection } from '@lib/utils/lcu-helpers';

export async function GET(): Promise<NextResponse> {
    try {
        const credentials = await findLCUCredentials();

        if (!credentials) {
            return NextResponse.json({
                error: 'League of Legends client not found or not running',
                message: 'Make sure the League client is open and try again',
                methods: [
                    'Searched for LeagueClientUx process',
                    'Checked lockfile in common installation paths'
                ]
            }, { status: 404 });
        }

        // Optional: Test the connection to verify credentials work
        try {
            const testResult = await testLCUConnection(credentials);
            if (!testResult.success) {
                console.warn('LCU connection test failed, but credentials found:', testResult.error);
            }
        } catch (testError) {
            console.warn('LCU connection test failed, but credentials found:', testError);
        }

        return NextResponse.json({
            success: true,
            credentials,
            message: 'LCU credentials found successfully'
        });

    } catch (error) {
        console.error('Error finding LCU credentials:', error);

        return NextResponse.json({
            error: 'Failed to find LCU credentials',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            suggestions: [
                'Make sure League of Legends is running',
                'Ensure you are logged into your account',
                'Try restarting the League client'
            ]
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { refresh = false } = body;

        // For now, POST behaves the same as GET since we don't cache credentials
        // In the future, this could force refresh cached credentials
        if (refresh) {
            console.log('Refreshing LCU credentials...');
        }

        return GET();

    } catch (error) {
        console.error('Error processing LCU credentials request:', error);

        return NextResponse.json({
            error: 'Failed to process request',
            message: error instanceof Error ? error.message : 'Invalid request body'
        }, { status: 400 });
    }
} 