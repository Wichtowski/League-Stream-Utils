import { NextResponse } from 'next/server';
import https from 'https';
import { URL } from 'url';

export async function GET(): Promise<NextResponse> {
    try {
        // First, get the LCU credentials
        const credentialsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/cameras/lcu-credentials`);

        if (!credentialsResponse.ok) {
            return NextResponse.json(
                { error: 'Could not get LCU credentials' },
                { status: 404 }
            );
        }

        const { credentials } = await credentialsResponse.json();
        const { port, password, protocol } = credentials;

        // Test LCU connection using Node.js https module
        const testUrl = `${protocol}://127.0.0.1:${port}/lol-summoner/v1/current-summoner`;
        const auth = Buffer.from(`riot:${password}`).toString('base64');
        const parsedUrl = new URL(testUrl);

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            },
            rejectUnauthorized: false // Ignore self-signed certificate
        };

        const response = await new Promise<{ statusCode?: number, data: string }>((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve({ statusCode: res.statusCode, data });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });

        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            try {
                const summoner = JSON.parse(response.data);
                return NextResponse.json({
                    success: true,
                    message: 'LCU connection successful',
                    summoner: {
                        displayName: summoner.displayName,
                        summonerLevel: summoner.summonerLevel,
                        profileIconId: summoner.profileIconId
                    },
                    credentials: {
                        port,
                        protocol,
                        // Don't return the password for security
                        hasPassword: !!password
                    }
                });
            } catch (parseError) {
                return NextResponse.json({
                    success: false,
                    message: `LCU connection successful but couldn't parse response: ${parseError}`,
                    credentials: {
                        port,
                        protocol,
                        hasPassword: !!password
                    }
                });
            }
        } else {
            return NextResponse.json({
                success: false,
                message: `LCU connection failed: ${response.statusCode || 'Unknown error'}`,
                credentials: {
                    port,
                    protocol,
                    hasPassword: !!password
                }
            });
        }

    } catch (error) {
        console.error('LCU test error:', error);

        return NextResponse.json(
            {
                error: 'LCU test failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                suggestions: [
                    'Make sure League of Legends client is running',
                    'Ensure you are logged into your account',
                    'Try restarting the League client',
                    'Check if the client is fully loaded (not on login screen)'
                ]
            },
            { status: 500 }
        );
    }
}

// Alternative test method using different approaches
export async function POST(): Promise<NextResponse> {
    try {
        // Try to get gameflow phase (simpler endpoint)
        const credentialsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/cameras/lcu-credentials`);

        if (!credentialsResponse.ok) {
            return NextResponse.json(
                { error: 'Could not get LCU credentials' },
                { status: 404 }
            );
        }

        const { credentials } = await credentialsResponse.json();
        const { port, password, protocol } = credentials;

        // Test with simpler endpoint using Node.js https module
        const testUrl = `${protocol}://127.0.0.1:${port}/lol-gameflow/v1/gameflow-phase`;
        const auth = Buffer.from(`riot:${password}`).toString('base64');
        const parsedUrl = new URL(testUrl);

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname,
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json'
            },
            rejectUnauthorized: false
        };

        const response = await new Promise<{ statusCode?: number, data: string }>((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    resolve({ statusCode: res.statusCode, data });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });

        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 300) {
            const gameflowPhase = response.data.replace(/"/g, ''); // Remove quotes
            return NextResponse.json({
                success: true,
                message: 'LCU connection successful (gameflow test)',
                gameflowPhase,
                credentials: {
                    port,
                    protocol,
                    hasPassword: !!password
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                message: `Gameflow test failed: ${response.statusCode || 'Unknown error'}`,
                credentials: {
                    port,
                    protocol,
                    hasPassword: !!password
                }
            });
        }

    } catch (error) {
        console.error('LCU gameflow test error:', error);

        return NextResponse.json(
            {
                error: 'LCU gameflow test failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 