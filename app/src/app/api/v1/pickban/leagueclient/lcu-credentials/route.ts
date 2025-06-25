import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getLeagueInstallationPaths } from '../../../../../lib/utils/league-paths';

const execAsync = promisify(exec);

interface LCUCredentials {
    port: string;
    password: string;
    protocol: string;
    pid?: string;
}

// Read from lockfile
const readLockfile = async (): Promise<LCUCredentials | null> => {
    const possiblePaths = getLeagueInstallationPaths();

    for (const leaguePath of possiblePaths) {
        try {
            const expandedPath = leaguePath.replace('~', os.homedir());
            const lockfilePath = path.join(expandedPath, 'lockfile');

            const lockfileContent = await fs.readFile(lockfilePath, 'utf-8');
            const parts = lockfileContent.trim().split(':');

            if (parts.length >= 5) {
                return {
                    port: parts[2],
                    password: parts[3],
                    protocol: parts[4],
                    pid: parts[1]
                };
            }
        } catch (_error) {
            continue;
        }
    }

    return null;
};

// Parse from process command line
const getCredentialsFromProcess = async (): Promise<LCUCredentials | null> => {
    try {
        const platform = os.platform();
        let command: string;

        if (platform === 'win32') {
            command = 'wmic PROCESS WHERE name="LeagueClientUx.exe" GET commandline';
        } else if (platform === 'darwin') {
            command = 'ps -A | grep LeagueClientUx';
        } else {
            command = 'ps -ef | grep LeagueClientUx';
        }

        const { stdout } = await execAsync(command);

        // Extract port and auth token from command line
        const portMatch = stdout.match(/--app-port=(\d+)/);
        const tokenMatch = stdout.match(/--remoting-auth-token=([\w-]+)/);

        if (portMatch && tokenMatch) {
            return {
                port: portMatch[1],
                password: tokenMatch[1],
                protocol: 'https'
            };
        }
    } catch (error) {
        console.error('Error getting credentials from process:', error);
    }

    return null;
};

// Alternative process parsing
const getCredentialsFromProcessAlternative = async (): Promise<LCUCredentials | null> => {
    try {
        const platform = os.platform();
        let command: string;

        if (platform === 'win32') {
            // Use PowerShell for more reliable parsing
            command = 'powershell "Get-Process LeagueClientUx | Select-Object CommandLine | Format-Table -HideTableHeaders"';
        } else {
            // Unix-like systems
            command = 'pgrep -f LeagueClientUx | xargs ps -p | grep -E "app-port|remoting-auth-token"';
        }

        const { stdout } = await execAsync(command);

        const portMatch = stdout.match(/--app-port[=\s]+(\d+)/);
        const tokenMatch = stdout.match(/--remoting-auth-token[=\s]+([\w-]+)/);

        if (portMatch && tokenMatch) {
            return {
                port: portMatch[1],
                password: tokenMatch[1],
                protocol: 'https'
            };
        }
    } catch (error) {
        console.error('Error in alternative process method:', error);
    }

    return null;
};

export async function GET(): Promise<NextResponse> {
    try {
        // Try multiple methods to get LCU credentials
        let credentials: LCUCredentials | null = null;

        credentials = await getCredentialsFromProcess();

        if (!credentials) {
            credentials = await readLockfile();
        }

        if (!credentials) {
            credentials = await getCredentialsFromProcessAlternative();
        }

        if (!credentials) {
            return NextResponse.json(
                {
                    error: 'League of Legends client not found or not running',
                    message: 'Make sure the League client is open and try again',
                    methods: [
                        'Searched for LeagueClientUx process',
                        'Checked lockfile in common installation paths',
                        'Attempted alternative process parsing'
                    ]
                },
                { status: 404 }
            );
        }

        try {
            const https = await import('https');
            const url = await import('url');

            const testUrl = `${credentials.protocol}://127.0.0.1:${credentials.port}/lol-summoner/v1/current-summoner`;
            const auth = Buffer.from(`riot:${credentials.password}`).toString('base64');
            const parsedUrl = new url.URL(testUrl);

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

                req.setTimeout(5000, () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                });

                req.end();
            });

            if (response.statusCode && response.statusCode < 500) {
                console.log('LCU connection test successful');
            } else {
                throw new Error(`LCU connection test failed: ${response.statusCode}`);
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
        console.error('Error getting LCU credentials:', error);

        return NextResponse.json(
            {
                error: 'Failed to retrieve LCU credentials',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                troubleshooting: [
                    'Ensure League of Legends client is running',
                    'Check if you have sufficient permissions to read process information',
                    'Verify League is installed in a standard location',
                    'Try running as administrator (Windows) or with sudo (Linux/Mac)'
                ]
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { method = 'auto' } = body;

        let credentials: LCUCredentials | null = null;

        switch (method) {
            case 'lockfile':
                credentials = await readLockfile();
                break;
            case 'process':
                credentials = await getCredentialsFromProcess();
                break;
            case 'process-alt':
                credentials = await getCredentialsFromProcessAlternative();
                break;
            case 'auto':
            default:
                // Try all methods
                credentials = await readLockfile() ||
                    await getCredentialsFromProcess() ||
                    await getCredentialsFromProcessAlternative();
                break;
        }

        if (!credentials) {
            return NextResponse.json(
                {
                    error: `No credentials found using method: ${method}`,
                    availableMethods: ['auto', 'lockfile', 'process', 'process-alt']
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            credentials,
            method: method,
            message: `LCU credentials found using ${method} method`
        });

    } catch (error) {
        return NextResponse.json(
            {
                error: 'Failed to process request',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 