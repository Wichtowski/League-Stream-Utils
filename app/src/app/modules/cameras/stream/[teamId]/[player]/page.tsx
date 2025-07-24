'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from "next/navigation";
import { useNavigation } from '@lib/contexts/NavigationContext';
import { AuthGuard } from '@lib/components/auth';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { CameraFeed, CameraNavigation, PlayerInfoHeader, CameraLayout } from '@lib/components/pages/cameras';
import type { CameraPlayer, CameraTeam } from '@lib/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function PlayerCameraStreamPage() {
    const router = useRouter();
    const params = useParams();
    const teamId = params.teamId as string;
    const playerName = decodeURIComponent(params.player as string);
    const { setActiveModule } = useNavigation();
    const { authenticatedFetch } = useAuthenticatedFetch();
    const [player, setPlayer] = useState<CameraPlayer | null>(null);
    const [teamName, setTeamName] = useState<string>('');
    const [accessDenied, setAccessDenied] = useState(false);
    const [accessReason, setAccessReason] = useState<string>('');

    useEffect(() => {
        setActiveModule('cameras');

        const checkAccessAndFetchPlayer = async () => {
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

                    // Find the specific team
                    const team = teams.find((t: CameraTeam) => t.teamId === teamId);

                    if (team) {
                        setTeamName(team.teamName);

                        // Find the specific player
                        const foundPlayer = team.players.find((p: CameraPlayer) => p.playerName === playerName);

                        if (foundPlayer) {
                            setPlayer({
                                ...foundPlayer,
                                name: foundPlayer.playerName,
                                teamId: team.teamId,
                                teamName: team.teamName
                            });
                        } else {
                            console.error('Player not found');
                            router.push(`/modules/cameras/stream/${teamId}`);
                        }
                    } else {
                        console.error('Team not found');
                        router.push('/modules/cameras');
                    }
                } else {
                    console.error('Failed to fetch camera settings');
                }
            } catch (error) {
                console.error("Error checking access or fetching player:", error);
                setAccessDenied(true);
                setAccessReason('error');
            }
        };

        if (teamId && playerName) {
            checkAccessAndFetchPlayer();
        }
    }, [teamId, playerName, router, setActiveModule, authenticatedFetch]);

    return (
        <AuthGuard loadingMessage="Loading player camera...">
            <div className="mb-4">
                <button
                    onClick={() => router.push('/modules/cameras')}
                    className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg mb-4"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Cameras
                </button>
            </div>
            {accessDenied ? (
                <CameraLayout>
                    <div className="flex items-center justify-center p-8 h-screen">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
                            <p className="text-gray-400 mb-6">
                                {accessReason}
                            </p>
                            <div className="space-x-4">
                                <button
                                    onClick={() => router.push('/modules/cameras')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                                >
                                    Camera Hub
                                </button>
                            </div>
                        </div>
                    </div>
                </CameraLayout>
            ) : !player ? (
                <CameraLayout>
                    <div className="flex items-center justify-center p-8 h-screen">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">Player Not Found</h2>
                            <p className="text-gray-400 mb-6">
                                {teamName ? `Player "${playerName}" not found in ${teamName}` : 'Player or team not found'}
                            </p>
                            <div className="space-x-4">
                                <button
                                    onClick={() => router.push(`/modules/cameras/stream/${teamId}`)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                                >
                                    Back to Team
                                </button>
                                <button
                                    onClick={() => router.push('/modules/cameras')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                                >
                                    Camera Hub
                                </button>
                            </div>
                        </div>
                    </div>
                </CameraLayout>
            ) : (
                <Suspense fallback={<div>Loading...</div>}>
                    <CameraLayout>
                        <PlayerInfoHeader
                            player={player}
                            teamName={teamName}
                            position="top-left"
                            size="large"
                        />

                        <CameraNavigation
                            position="top-right"
                            showHub={true}
                            showTeamView={true}
                            teamId={teamId}
                        />

                        <CameraFeed
                            player={player}
                            className="w-full h-screen"
                            showPlayerInfo={true}
                            playerInfoSize="large"
                            teamName={teamName}
                        />
                    </CameraLayout>
                </Suspense>
            )}
        </AuthGuard>
    );
} 