'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useParams } from "next/navigation";
import { useNavigation } from '@lib/contexts/NavigationContext';
import { AuthGuard } from '@lib/components/AuthGuard';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { CameraPlayer, CameraTeam } from '@lib/types';
import Image from 'next/image';

export default function TeamCameraStreamPage() {
    const router = useRouter();
    const params = useParams();
    const teamId = params.teamId as string;
    const { setActiveModule } = useNavigation();
    const { authenticatedFetch } = useAuthenticatedFetch();
    const [players, setPlayers] = useState<CameraPlayer[]>([]);
    const [currentPlayer, setCurrentPlayer] = useState<CameraPlayer | null>(null);
    const [streamFailed, setStreamFailed] = useState(false);
    const [randomMode, setRandomMode] = useState(false);
    const [teamName, setTeamName] = useState<string>('');
    const [teamLogo, setTeamLogo] = useState<string>('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [accessReason, setAccessReason] = useState<string>('');
    const [tournamentMode, setTournamentMode] = useState(false);
    const [delayMinutes, setDelayMinutes] = useState(3);

    const getRandomPlayer = useCallback((): CameraPlayer | null => {
        if (players.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * players.length);
        return players[randomIndex];
    }, [players]);

    const handleKeyPress = useCallback((e: KeyboardEvent) => {
        if (e.key === " ") {
            const nextPlayer = getRandomPlayer();
            if (nextPlayer) {
                setCurrentPlayer(nextPlayer);
            }
        } else if (e.key.toLowerCase() === "r") {
            setRandomMode(prev => !prev);
        } else if (e.key.toLowerCase() === "t") {
            setTournamentMode(prev => !prev);
        } else if (e.key >= "1" && e.key <= "9") {
            const playerIndex = parseInt(e.key) - 1;
            if (playerIndex >= 0 && playerIndex < players.length) {
                setCurrentPlayer(players[playerIndex]);
                setRandomMode(false); // Disable random mode when manually selecting
            }
        }
    }, [players, getRandomPlayer]);

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
                        setTeamLogo(team.teamLogo || '');
                        setPlayers(team.players || []);
                        setTournamentMode(team.globalDelayEnabled || false);
                        setDelayMinutes(team.delayMinutes || 3);
                    } else {
                        console.error('Team not found');
                        router.push('/modules/cameras');
                    }
                } else {
                    console.error('Failed to fetch camera settings');
                }
            } catch (error) {
                console.error("Error checking access or fetching team players:", error);
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
            <AuthGuard>
                <div className="min-h-screen bg-black flex items-center justify-center p-8">
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
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard loadingMessage="Loading team cameras...">
            {players.length === 0 ? (
                <div className="min-h-screen bg-black flex items-center justify-center p-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">No Players Found</h2>
                        <p className="text-gray-400 mb-6">
                            {teamName ? `No camera feeds configured for ${teamName}` : 'Team not found or no cameras configured'}
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
                    <div className="min-h-screen bg-black">

                <div className="relative w-full aspect-video">
                    {/* Tournament Mode Controls */}
                    <div className="absolute top-4 left-4 z-20 flex gap-2">
                        <button
                            onClick={() => setTournamentMode(!tournamentMode)}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                                tournamentMode 
                                    ? 'bg-red-600/90 text-white' 
                                    : 'bg-gray-600/90 text-white hover:bg-gray-500/90'
                            }`}
                        >
                            {tournamentMode ? `${delayMinutes} MIN DELAY` : 'LIVE MODE'}
                        </button>
                        <div className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                            Press T to toggle
                        </div>
                    </div>

                    {/* Random Mode Indicator */}
                    {randomMode && (
                        <div className="absolute top-4 right-4 z-20 bg-purple-600/90 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                            RANDOM MODE
                        </div>
                    )}

                    {/* Preload all streams as hidden iframes - only for players with valid URLs */}
                    {players.filter(player => {
                        const streamUrl = tournamentMode && player.delayedUrl ? player.delayedUrl : (player.url || player.imagePath);
                        return streamUrl && streamUrl.trim() !== '';
                    }).map((player) => {
                        const streamUrl = tournamentMode && player.delayedUrl ? player.delayedUrl : (player.url || player.imagePath);
                        return (
                            <iframe
                                key={`stream-${player.playerId || player.inGameName}-${tournamentMode ? 'delayed' : 'live'}`}
                                src={streamUrl}
                                className={`absolute inset-0 w-full h-full ${
                                    currentPlayer?.playerId === player.playerId || 
                                    (currentPlayer?.inGameName === player.inGameName && player.inGameName)
                                        ? 'block' 
                                        : 'hidden'
                                }`}
                                allow="autoplay; fullscreen"
                                onError={handleStreamError}
                                title={`${player.inGameName || player.playerName} camera feed${tournamentMode ? ` (${delayMinutes}min delay)` : ''}`}
                            />
                        );
                    })}
                    
                    {/* Fallback display when no stream is available */}
                    {(!currentPlayer?.imagePath || streamFailed) && (
                        <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
                            <div className="text-center">
                                {teamLogo ? (
                                    <Image 
                                        src={teamLogo} 
                                        alt={teamName}
                                        width={128}
                                        height={128}
                                        className="w-32 h-32 object-contain mx-auto mb-4 opacity-50"
                                    />
                                ) : (
                                    <div className="text-gray-400 text-6xl mb-4">📹</div>
                                )}
                                <h2 className="text-2xl font-bold text-white mb-2">No Stream Available</h2>
                                <p className="text-gray-400">
                                    {currentPlayer?.inGameName || currentPlayer?.playerName || 'Player'} stream is not configured
                                </p>
                            </div>
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
                </div>

                {/* Random Mode Indicator - Below Container */}
                {randomMode && (
                    <div className="flex justify-center mt-4">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse">
                            🔄 Random Mode Active
                        </div>
                    </div>
                )}
                <div className="bottom-4 right-4 z-10 space-y-2">
                    {/* Player Controls */}
                    <div className="bg-black/70 text-white px-4 py-2 rounded-lg">
                        <div className="text-xs text-gray-400 mb-2">Individual Players</div>
                        <div className="flex flex-wrap gap-1 font-bold text-white ">
                            {players.map((player, index) => (
                                <button
                                    key={`${player.inGameName || player.playerName || 'player'}-${index}`}
                                    onClick={() => router.push(`/modules/cameras/stream/${teamId}/${encodeURIComponent(player.inGameName || '')}`)}
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
        </Suspense>
            )}
        </AuthGuard>
    );
} 