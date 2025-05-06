import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string;
        const index = formData.get('index') as string;
        const teamIndex = formData.get('teamIndex') as string;
        const playerIndex = formData.get('playerIndex') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let filename: string;
        if (type === 'team') {
            filename = `team${index}.png`;
        } else if (type === 'player') {
            filename = `team${teamIndex}_player${playerIndex}.png`;
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const path = join(process.cwd(), 'public', filename);
        await writeFile(path, buffer);

        return NextResponse.json({ path: `/${filename}` });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
    }
} 