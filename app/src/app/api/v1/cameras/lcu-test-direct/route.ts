import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import https from 'https';
import { URL } from 'url';

const execAsync = promisify(exec);

interface LCUCredentials {
    port: string;
    password: string;
    protocol: string;
}

// Default League installation paths
const getDefaultLeaguePaths = (): string[] => {
    const platform = os.platform();

    if (platform === 'win32') {
        return [
            'C:\\Riot Games\\League of Legends',
            'C:\\Program Files\\Riot Games\\League of Legends',
            'C:\\Program Files (x86)\\Riot Games\\League of Legends',
            'D:\\Riot Games\\League of Legends',
            'E:\\Riot Games\\League of Legends',
            'F:\\Riot Games\\League of Legends'
        ];
    } else if (platform === 'darwin') {
        return [
            '/Applications/League of Legends.app',
            path.join(os.homedir(), 'Applications/League of Legends.app')
        ];
    } else {
        return [
            path.join(os.homedir(), '.local/share/applications/leagueoflegends'),
            '/opt/riot-games/league-of-legends'
        ];
    }
};

// Try to find LCU credentials from lockfile
const findLCUFromLockfile = async (): Promise<LCUCredentials | null> => {
    const paths = getDefaultLeaguePaths();

    for (const basePath of paths) {
        try {
            const lockfilePath = path.join(basePath, 'lockfile');
            const lockfileContent = await fs.readFile(lockfilePath, 'utf-8');

            const parts = lockfileContent.trim().split(':');
            if (parts.length >= 5) {
                return {
                    port: parts[2],
                    password: parts[3],
                    protocol: parts[4]
                };
            }
        } catch (_error) {
            continue;
        }
    }

    return null;
};

// Try to find LCU credentials from process list
const findLCUFromProcess = async (): Promise<LCUCredentials | null> => {
    try {
        const platform = os.platform();
        let command: string;

        if (platform === 'win32') {
            command = 'wmic process where "name=\'LeagueClientUx.exe\'" get ProcessId,CommandLine /format:csv';
        } else if (platform === 'darwin') {
            command = 'ps aux | grep LeagueClientUx';
        } else {
            command = 'ps aux | grep LeagueClientUx';
        }

        const { stdout } = await execAsync(command);

        const portMatch = stdout.match(/--app-port=(\d+)/);
        const tokenMatch = stdout.match(/--remoting-auth-token=([a-zA-Z0-9_-]+)/);

        if (portMatch && tokenMatch) {
            return {
                port: portMatch[1],
                password: tokenMatch[1],
                protocol: 'https'
            };
        }
    } catch (_error) {
        // Process method failed
    }

    return null;
};

// Test LCU connection using direct HTTPS
const testLCUConnection = async (credentials: LCUCredentials): Promise<{ success: boolean, data?: unknown, error?: string }> => {
    try {
        const testUrl = `${credentials.protocol}://127.0.0.1:${credentials.port}/lol-summoner/v1/current-summoner`;
        const auth = Buffer.from(`riot:${credentials.password}`).toString('base64');
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

            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });

        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 400) {
            try {
                const summoner = JSON.parse(response.data);
                return { success: true, data: summoner };
            } catch (_parseError) {
                return { success: true, data: { raw: response.data } };
            }
        } else {
            return { success: false, error: `HTTP ${response.statusCode}` };
        }

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export async function GET(): Promise<NextResponse> {
    try {
        console.log('Starting direct LCU test...');

        // Try to find credentials
        let credentials = await findLCUFromLockfile();
        let method = 'lockfile';

        if (!credentials) {
            credentials = await findLCUFromProcess();
            method = 'process';
        }

        if (!credentials) {
            return NextResponse.json({
                success: false,
                error: 'League Client not found',
                message: 'Could not find League of Legends client. Make sure it is running and you are logged in.',
                suggestions: [
                    'Start League of Legends client',
                    'Log into your account (not on login screen)',
                    'Wait for client to fully load',
                    'Try restarting the League client'
                ]
            }, { status: 404 });
        }

        console.log(`Found LCU credentials via ${method}: port=${credentials.port}, protocol=${credentials.protocol}`);

        // Test the connection
        const testResult = await testLCUConnection(credentials);

        if (testResult.success) {
            return NextResponse.json({
                success: true,
                message: 'LCU connection successful!',
                method,
                summoner: testResult.data,
                credentials: {
                    port: credentials.port,
                    protocol: credentials.protocol,
                    hasPassword: !!credentials.password
                }
            });
        } else {
            return NextResponse.json({
                success: false,
                error: 'LCU connection failed',
                message: `Found credentials but connection failed: ${testResult.error}`,
                method,
                credentials: {
                    port: credentials.port,
                    protocol: credentials.protocol,
                    hasPassword: !!credentials.password
                },
                suggestions: [
                    'Make sure you are logged into League (not on login screen)',
                    'Try entering champion select or a game lobby',
                    'Restart the League client',
                    'Check if League is fully loaded'
                ]
            });
        }

    } catch (error) {
        console.error('Direct LCU test error:', error);

        return NextResponse.json({
            success: false,
            error: 'Test failed',
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            suggestions: [
                'Make sure League of Legends is installed and running',
                'Check that you have proper permissions',
                'Try running as administrator (Windows)',
                'Restart the League client'
            ]
        }, { status: 500 });
    }
} 