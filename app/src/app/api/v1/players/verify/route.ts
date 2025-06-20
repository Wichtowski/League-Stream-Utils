import { NextRequest, NextResponse } from 'next/server';
import riotAPI from '../../../../lib/services/riot-api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { gameName, tagLine, expectedPuuid, includeStats = false } = body;

        if (!gameName || !tagLine) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: gameName and tagLine'
                },
                { status: 400 }
            );
        }

        // Verify the player
        const verificationResult = await riotAPI.verifyPlayer(gameName, tagLine, expectedPuuid);

        if (!verificationResult.verified) {
            return NextResponse.json({
                success: false,
                error: verificationResult.error || 'Player verification failed'
            }, { status: 404 });
        }

        // Basic verification data
        const response: any = {
            success: true,
            verified: true,
            player: verificationResult.player,
            summoner: verificationResult.summoner,
            rank: riotAPI.getRankString(verificationResult.rankedData || [])
        };

        // Include detailed stats if requested
        if (includeStats && verificationResult.player) {
            try {
                const stats = await riotAPI.getPlayerStats(verificationResult.player.puuid);
                response.stats = {
                    championMastery: stats.championMastery.slice(0, 5), // Top 5 champions
                    recentMatches: stats.recentMatches.map(match => ({
                        gameId: match.info.gameId,
                        gameMode: match.info.gameMode,
                        gameDuration: match.info.gameDuration,
                        gameEndTimestamp: match.info.gameEndTimestamp,
                        participant: match.info.participants.find(p => p.puuid === verificationResult.player!.puuid)
                    })),
                    rankedData: stats.rankedData
                };
            } catch (statsError) {
                console.warn('Failed to fetch player stats:', statsError);
                response.statsError = 'Failed to fetch detailed stats';
            }
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Player verification API error:', error);
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

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const gameName = searchParams.get('gameName');
        const tagLine = searchParams.get('tagLine');

        if (!gameName || !tagLine) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required query parameters: gameName and tagLine'
                },
                { status: 400 }
            );
        }

        // Get basic player info
        const player = await riotAPI.getPlayerByRiotId(gameName, tagLine);
        const summoner = await riotAPI.getSummonerByPuuid(player.puuid);
        const rankedData = await riotAPI.getRankedData(summoner.id);

        return NextResponse.json({
            success: true,
            player,
            summoner,
            rank: riotAPI.getRankString(rankedData),
            rankedData
        });

    } catch (error) {
        console.error('Player lookup API error:', error);
        if ((error as any).response?.status === 404) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Player not found'
                },
                { status: 404 }
            );
        }

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