import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
    try {
        const teams = await request.json();
        const path = join(process.cwd(), 'public', 'teams.json');

        await writeFile(path, JSON.stringify(teams, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving teams:', error);
        return NextResponse.json({ error: 'Error saving teams' }, { status: 500 });
    }
} 