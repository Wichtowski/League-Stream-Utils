import { NextRequest, NextResponse } from 'next/server';
import { findLCUCredentials, testLCUConnection } from '@lib/utils/LCU/lcu-helpers';

export async function GET(): Promise<NextResponse> {
    try {
        const credentials = await findLCUCredentials();

        if (!credentials) {
            console.warn('League of Legends client not found or not running');
            return NextResponse.json({
                success: false,
                error: 'League of Legends client not found or not running',
                message: 'Make sure the League client is open and try again',
                methods: [
                    'Searched for LeagueClientUx process',
                    'Checked lockfile in common installation paths'
                ]
            }, { status: 200 });
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

        // Return only non-sensitive information
        const safeCredentials = {
            port: credentials.port,
            protocol: credentials.protocol,
            pid: credentials.pid
        };

        return NextResponse.json({
            success: true,
            credentials: safeCredentials,
            message: 'LCU credentials found successfully'
        });

    } catch (error) {
        console.warn('Error finding LCU credentials:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to find LCU credentials',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            suggestions: [
                'Make sure League of Legends is running',
                'Ensure you are logged into your account',
                'Try restarting the League client'
            ]
        }, { status: 200 });
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
        console.warn('Error processing LCU credentials request:', error);

        return NextResponse.json({
            success: false,
            error: 'Failed to process request',
            message: error instanceof Error ? error.message : 'Invalid request body'
        }, { status: 200 });
    }
} 