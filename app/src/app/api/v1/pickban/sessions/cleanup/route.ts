import { NextResponse } from 'next/server';
import { cleanupOldSessions } from '@lib/database';

export async function POST() {
    try {
        const deletedCount = await cleanupOldSessions(24);

        return NextResponse.json({
            success: true,
            message: `Cleaned up ${deletedCount} old sessions`,
            deletedCount
        });
    } catch (error) {
        console.error('Session cleanup error:', error);
        return NextResponse.json({ error: 'Failed to cleanup sessions' }, { status: 500 });
    }
}

export async function GET() {
    // Also allow GET for easy testing/manual cleanup
    return POST();
}
