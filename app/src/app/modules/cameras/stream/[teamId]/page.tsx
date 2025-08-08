'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { CameraPlayer, CameraTeam } from '@lib/types';
import Image from 'next/image';
import { PageWrapper } from '@lib/layout/PageWrapper';

export default function TeamCameraStreamPage() {
    const router = useRouter();
    const params = useParams();
    const teamId = params.teamId as string;
    const { setActiveModule } = useNavigation();
    const { authenticatedFetch } = useAuthenticatedFetch();
    const [players, setPlayers] = useState<CameraPlayer[]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<CameraPlayer | null>(null);
    const [randomMode, setRandomMode] = useState(false);
    const [teamName, setTeamName] = useState<string>('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [accessReason, setAccessReason] = useState<string>('');
    const [_streamFailed, setStreamFailed] = useState(false);

    const getRandomPlayer = useCallback((): CameraPlayer | null => {
        if (players.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * players.length);
        return players[randomIndex];
    }, [players]);

    const handleKeyPress = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === ' ') {
                const nextPlayer = getRandomPlayer();
                if (nextPlayer) {
                    setCurrentPlayer(nextPlayer);
                }
            } else if (e.key.toLowerCase() === 'r') {
                setRandomMode((prev) => !prev);
            } else if (e.key >= '1' && e.key <= '9') {
                const playerIndex = parseInt(e.key) - 1;
                if (playerIndex >= 0 && playerIndex < players.length) {
                    setCurrentPlayer(players[playerIndex]);
                    setRandomMode(false); // Disable random mode when manually selecting
                }
            }
        },
        [players, getRandomPlayer]
    );

    useEffect(() => {
        setActiveModule('cameras');

        const checkAccessAndFetchData = async () => {
            try {
                // First check if user has access to this team's cameras
                const accessResponse = await authenticatedFetch(`/api/v1/cameras/access?teamId=${teamId}`);

                if (accessResponse.ok) {
                    const accessData = await accessResponse.json();

                    if (!accessData.hasAccess) {
                        setAccessDenied(true);
                        setAccessReason(accessData.reason);
                        setTeamName(accessData.teamName || 'Unknown Team');
                        return;
                    }
                }

                // If access is granted, fetch camera settings
                const response = await authenticatedFetch('/api/v1/cameras/settings');

                if (response.ok) {
                    const data = await response.json();
                    const teams = data.teams || [];

                    const team = teams.find((t: CameraTeam) => t.teamId === teamId);

                    if (team) {
                        setTeamName(team.teamName);
                        const basePlayers = team.players || [];
                        const playersWithTeamStream: CameraPlayer[] =
                            team.teamStreamUrl && team.teamStreamUrl.trim() !== ''
                                ? [
                                      {
                                          playerId: 'team-stream',
                                          playerName: 'TEAM STREAM',
                                          inGameName: 'Team Stream',
                                          url: team.teamStreamUrl.trim(),
                                          imagePath: ''
                                      },
                                      ...basePlayers
                                  ]
                                : basePlayers;

                        setPlayers(playersWithTeamStream);
                    } else {
                        console.error('Team not found');
                        router.push('/modules/cameras');
                    }
                } else {
                    console.error('Failed to fetch camera settings');
                }
            } catch (error) {
                console.error('Error checking access or fetching team players:', error);
                setAccessDenied(true);
                setAccessReason('error');
            }
        };

        if (teamId) {
            checkAccessAndFetchData();
        }
    }, [teamId, router, setActiveModule, authenticatedFetch]);

    // Separate effect to set initial player when players are loaded
    useEffect(() => {
        if (players.length > 0 && !currentPlayer) {
            const initialPlayer = getRandomPlayer();
            if (initialPlayer) {
                setCurrentPlayer(initialPlayer);
            }
        }
    }, [players, currentPlayer, getRandomPlayer]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleKeyPress]);

    // Random mode timer
    useEffect(() => {
        if (!randomMode || players.length <= 1) return;

        const interval = setInterval(() => {
            const nextPlayer = getRandomPlayer();
            if (nextPlayer) {
                setCurrentPlayer(nextPlayer);
            }
        }, 5000); // Switch every 5 seconds

        return () => clearInterval(interval);
    }, [randomMode, players.length, getRandomPlayer]);

    const handleStreamError = () => {
        setStreamFailed(true);
    };

    // Show access denied message
    if (accessDenied) {
        const getAccessMessage = () => {
            switch (accessReason) {
                case 'not_authorized':
                    return `You don't have permission to view ${teamName}'s cameras. Only team owners and admins can access team cameras.`;
                case 'team_not_found':
                    return 'Team not found or has been deleted.';
                case 'error':
                    return 'An error occurred while checking your permissions.';
                default:
                    return 'Access denied.';
            }
        };

        return (
            <PageWrapper
                title="Access Denied"
                className="bg-black"
                contentClassName="flex items-center justify-center p-8"
            >
                <div className="text-center max-w-md">
                    <div className="text-red-400 text-6xl mb-6">🚫</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
                    <p className="text-gray-400 mb-6">{getAccessMessage()}</p>
                    <div className="space-x-4">
                        <button
                            onClick={() => router.push('/modules/cameras')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Camera Hub
                        </button>
                        <button
                            onClick={() => router.push('/modules/teams')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            My Teams
                        </button>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper
            loadingMessage="Loading team camera..."
            breadcrumbs={[
                { label: 'Camera Hub', href: '/modules/cameras' },
                { label: 'Setup', href: `/modules/cameras/setup` },
                { label: teamName, href: `/modules/cameras/setup/${teamId}`, isActive: true }
            ]}
            className="bg-black"
        >
            {players.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">No Players Found</h2>
                        <p className="text-gray-400 mb-6">
                            {teamName
                                ? `No camera feeds configured for ${teamName}`
                                : 'Team not found or no cameras configured'}
                        </p>
                        <button
                            onClick={() => router.push('/modules/cameras')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Configure Cameras
                        </button>
                    </div>
                </div>
            ) : (
                <Suspense fallback={<div>Loading...</div>}>
                    <div className="relative w-full aspect-video">
                        {/* Main Stream Display */}
                        {currentPlayer && (
                            <div className="absolute inset-0 w-full h-full block">
                                {currentPlayer.url ? (
                                    <iframe
                                        src={currentPlayer.url}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen"
                                        onError={handleStreamError}
                                        title={`${currentPlayer.inGameName || currentPlayer.playerName} camera feed`}
                                    />
                                ) : currentPlayer.imagePath ? (
                                    <Image
                                        src={currentPlayer.imagePath}
                                        alt={currentPlayer.inGameName || currentPlayer.playerName || 'Player'}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                            <div className="text-2xl mb-2">📹</div>
                                            <p className="text-sm">No feed</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Player Name Overlay - Full width bottom centered */}
                        {currentPlayer && (
                            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black via-black/70 to-transparent py-8 px-4">
                                <div className="text-center">
                                    <h2 className="text-4xl font-bold text-white drop-shadow-lg">
                                        {currentPlayer.inGameName || currentPlayer.playerName || 'Unknown Player'}
                                    </h2>
                                </div>
                            </div>
                        )}

                        {/* Player Controls */}
                        <div className="absolute bottom-4 right-4 z-10 space-y-2">
                            <div className="bg-black/70 text-white px-4 py-2 rounded-lg">
                                <div className="text-xs text-gray-400 mb-2">Individual Players</div>
                                <div className="flex flex-wrap gap-1 font-bold text-white">
                                    {players.map((player, index) => (
                                        <button
                                            key={`${player.inGameName || player.playerName || 'player'}-${index}`}
                                            onClick={() =>
                                                router.push(
                                                    `/modules/cameras/stream/${teamId}/${encodeURIComponent(player.inGameName || '')}`
                                                )
                                            }
                                            className="bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs transition-colors"
                                            title={`${player.inGameName} (${player.role})`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Random Mode Indicator - Below Container */}
                    {randomMode && (
                        <div className="flex justify-center mt-4">
                            <div className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                                🔄 Random Mode Active
                            </div>
                        </div>
                    )}
                </Suspense>
            )}
        </PageWrapper>
    );
}
