import { NextRequest, NextResponse } from 'next/server';
import riotAPI from '../../../lib/services/riot-api';
import { Champion } from '../../../lib/database/models';
import { connectToDatabase } from '../../../lib/database/connection';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const forceUpdate = searchParams.get('forceUpdate') === 'true';
        const version = searchParams.get('version');

        await connectToDatabase();

        if (forceUpdate) {
            riotAPI.clearCache();
        }

        let champions: any[] = [];
        let source = 'riot-api';
        let gameVersion = '';

        try {
            champions = await riotAPI.getAllChampions();
            gameVersion = await riotAPI.getLatestGameVersion();
        } catch (error) {
            console.warn('Failed to fetch from Riot API, trying database fallback:', error);

            try {
                const dbChampions = await Champion.find().sort({ name: 1 });
                if (dbChampions.length > 0) {
                    champions = dbChampions.map(champ => ({
                        id: champ.id,
                        name: champ.name,
                        key: champ.key,
                        image: champ.image
                    }));
                    source = 'database';
                    gameVersion = version || 'cached';
                }
            } catch (dbError) {
                console.error('Database fallback also failed:', dbError);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Failed to fetch champions from both Riot API and database',
                        details: {
                            riotError: (error as Error).message,
                            dbError: (dbError as Error).message
                        }
                    },
                    { status: 500 }
                );
            }
        }

        // If we got champions from Riot API, update database
        if (source === 'riot-api' && champions.length > 0) {
            try {
                // Clear existing champions
                await Champion.deleteMany({});

                // Insert new champions
                await Champion.insertMany(champions.map(champ => ({
                    id: champ.id,
                    name: champ.name,
                    key: champ.key,
                    image: champ.image
                })));

                console.log(`Updated ${champions.length} champions in database`);
            } catch (dbError) {
                console.warn('Failed to update database, but continuing with API data:', dbError);
            }
        }

        // Get cache statistics
        const cacheStats = riotAPI.getCacheStats();

        return NextResponse.json({
            success: true,
            data: {
                champions,
                version: gameVersion,
                count: champions.length,
                source,
                cacheStats,
                lastUpdated: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Champions API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: (error as Error).message
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (body.action === 'clearCache') {
            riotAPI.clearCache();
            return NextResponse.json({
                success: true,
                message: 'Champions cache cleared successfully'
            });
        }

        if (body.action === 'updateDatabase') {
            await connectToDatabase();

            try {
                const champions = await riotAPI.getAllChampions();

                // Clear and update database
                await Champion.deleteMany({});
                await Champion.insertMany(champions.map(champ => ({
                    id: champ.id,
                    name: champ.name,
                    key: champ.key,
                    image: champ.image
                })));

                return NextResponse.json({
                    success: true,
                    message: `Updated ${champions.length} champions in database`,
                    count: champions.length
                });
            } catch (error) {
                console.error('Failed to update database:', error);
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Failed to update database',
                        details: (error as Error).message
                    },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Champions POST API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: (error as Error).message
            },
            { status: 500 }
        );
    }
} 