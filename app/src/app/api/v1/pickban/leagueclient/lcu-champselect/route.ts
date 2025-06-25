import { NextResponse } from 'next/server';
import https from 'https';
import { URL } from 'url';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getLeagueInstallationPaths } from '../../../../../lib/utils/league-paths';

const execAsync = promisify(exec);

interface LCUCredentials {
    port: string;
    password: string;
    protocol: string;
}

// Try to find LCU credentials from lockfile
const findLCUFromLockfile = async (): Promise<LCUCredentials | null> => {
    const paths = getLeagueInstallationPaths();

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

// Make LCU request with proper SSL handling
const makeLCURequest = async (credentials: LCUCredentials, endpoint: string): Promise<{ success: boolean, data?: unknown, error?: string }> => {
    try {
        const requestUrl = `${credentials.protocol}://127.0.0.1:${credentials.port}${endpoint}`;
        const auth = Buffer.from(`riot:${credentials.password}`).toString('base64');
        const parsedUrl = new URL(requestUrl);

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

            req.setTimeout(3000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });

        if (response.statusCode === 404) {
            // Champion select not active - this is normal
            return { success: true, data: null };
        }

        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 400) {
            try {
                const jsonData = JSON.parse(response.data);
                return { success: true, data: jsonData };
            } catch (_parseError) {
                return { success: true, data: response.data };
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
        // Try to find credentials
        let credentials = await findLCUFromLockfile();

        if (!credentials) {
            credentials = await findLCUFromProcess();
        }

        if (!credentials) {
            return NextResponse.json({
                success: false,
                error: 'League Client not found',
                message: 'Could not find League of Legends client credentials'
            }, { status: 404 });
        }

        // Try to get champion select session
        const champSelectResult = await makeLCURequest(credentials, '/lol-champ-select/v1/session');

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