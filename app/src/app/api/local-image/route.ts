import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, promises as fs } from 'fs';
import { resolve, extname, join } from 'path';
import { homedir } from 'os';
import type { Stats } from 'fs';

// In-memory cache for file stats and existence checks
const fileCache = new Map<string, { exists: boolean; stats?: Stats; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache TTL

// In-memory cache for frequently accessed image responses
const responseCache = new Map<string, { data: Buffer; contentType: string; etag: string; timestamp: number }>();
const RESPONSE_CACHE_TTL = 60000; // 1 minute cache TTL for responses
const MAX_CACHE_SIZE = 100; // Maximum number of cached responses

// Content type mapping
const CONTENT_TYPES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

const getAssetCacheBase = (): string => {
    // Try environment variable first
    if (process.env.ASSET_CACHE_PATH) {
        return process.env.ASSET_CACHE_PATH;
    }

    // Auto-detect from %appdata% (Windows) or equivalent
    const appDataPath = process.env.APPDATA || join(homedir(), 'AppData', 'Roaming');
    const assetCachePath = join(appDataPath, 'League Stream Utils', 'asset-cache');

    return assetCachePath;
};

const ASSET_CACHE_BASE = getAssetCacheBase();

// Optimized file existence check with caching
const checkFileExists = async (filePath: string): Promise<{ exists: boolean; stats?: Stats }> => {
    const now = Date.now();
    const cached = fileCache.get(filePath);

    if (cached && (now - cached.timestamp) < CACHE_TTL) {
        return { exists: cached.exists, stats: cached.stats };
    }

    try {
        const stats = await fs.stat(filePath);
        const result = { exists: stats.isFile(), stats };
        fileCache.set(filePath, { ...result, timestamp: now });
        return result;
    } catch {
        const result = { exists: false };
        fileCache.set(filePath, { ...result, timestamp: now });
        return result;
    }
};

// Clean up old cache entries periodically
setInterval(() => {
    const now = Date.now();

    // Clean file cache
    for (const [key, value] of fileCache.entries()) {
        if ((now - value.timestamp) > CACHE_TTL) {
            fileCache.delete(key);
        }
    }

    // Clean response cache
    for (const [key, value] of responseCache.entries()) {
        if ((now - value.timestamp) > RESPONSE_CACHE_TTL) {
            responseCache.delete(key);
        }
    }

    // Limit response cache size
    if (responseCache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(responseCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2));
        toDelete.forEach(([key]) => responseCache.delete(key));
    }
}, CACHE_TTL);

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const relPath = url.searchParams.get('path');
    if (!relPath) return new NextResponse('Missing path', { status: 400 });

    if (!ASSET_CACHE_BASE) {
        console.error('Could not determine asset cache base path');
        return new NextResponse('Server configuration error', { status: 500 });
    }

    // Prevent directory traversal
    const safePath = resolve(ASSET_CACHE_BASE, relPath);
    if (!safePath.startsWith(ASSET_CACHE_BASE)) {
        console.error('Path traversal attempt:', { relPath, safePath, base: ASSET_CACHE_BASE });
        return new NextResponse('Invalid path', { status: 400 });
    }

    // Use cached file check
    const { exists, stats } = await checkFileExists(safePath);
    if (!exists) {
        console.error('File not found:', { relPath, safePath });
        return new NextResponse('Not found', { status: 404 });
    }

    const ext = extname(safePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
    const etag = `"${stats?.mtimeMs || Date.now()}"`;

    // Check if client has cached version
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304 });
    }

    // Check response cache for small images (likely to be accessed frequently)
    const fileSize = stats?.size || 0;
    if (fileSize > 0 && fileSize < 1024 * 1024) { // Cache images smaller than 1MB
        const cachedResponse = responseCache.get(safePath);
        if (cachedResponse && cachedResponse.etag === etag) {
            return new NextResponse(cachedResponse.data, {
                status: 200,
                headers: {
                    'Content-Type': cachedResponse.contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'ETag': cachedResponse.etag,
                    'Content-Length': cachedResponse.data.length.toString(),
                },
            });
        }
    }

    // Create stream and convert to ReadableStream more efficiently
    const stream = createReadStream(safePath);

    // For small files, read into memory and cache
    if (fileSize > 0 && fileSize < 1024 * 1024) {
        try {
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const data = Buffer.concat(chunks);

            // Cache the response
            responseCache.set(safePath, {
                data,
                contentType,
                etag,
                timestamp: Date.now()
            });

            return new NextResponse(data, {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'ETag': etag,
                    'Content-Length': data.length.toString(),
                },
            });
        } catch (error) {
            // Fallback to streaming if memory read fails
            console.warn('Failed to cache response, falling back to stream:', error);
        }
    }

    // Fallback to streaming for larger files or if caching failed
    const fallbackStream = createReadStream(safePath);
    const readableStream = new ReadableStream({
        start(controller) {
            fallbackStream.on('data', (chunk) => {
                controller.enqueue(chunk);
            });
            fallbackStream.on('end', () => {
                controller.close();
            });
            fallbackStream.on('error', (err) => {
                controller.error(err);
            });
        },
        cancel() {
            fallbackStream.destroy();
        }
    });

    return new NextResponse(readableStream, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': etag,
            'Accept-Ranges': 'bytes',
            'Content-Length': stats?.size?.toString() || '',
        },
    });
} 