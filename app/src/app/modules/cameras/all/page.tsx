'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useCameras } from '@lib/contexts/CamerasContext';
import { AuthGuard } from '@lib/components/AuthGuard';
import { LoadingSpinner } from '@components/common';

export default function AllCamerasPage() {
    const router = useRouter();
    const { setActiveModule } = useNavigation();
    const { teams, allPlayers, loading, error, refreshCameras } = useCameras();
    const [streamErrors, setStreamErrors] = useState<Set<string>>(new Set());

    useEffect(() => {
        setActiveModule('cameras');
        refreshCameras();
    }, [setActiveModule, refreshCameras]);

    const handleStreamError = (playerName: string) => {
        setStreamErrors(prev => new Set([...prev, playerName]));
    };

    const getGridCols = (count: number) => {
        if (count <= 1) return 'grid-cols-1';
        if (count <= 4) return 'grid-cols-2';
        if (count <= 9) return 'grid-cols-3';
        if (count <= 16) return 'grid-cols-4';
        return 'grid-cols-5';
    };

    if (loading) {
        return (
            <AuthGuard loadingMessage="Loading cameras...">
                <LoadingSpinner fullscreen text="Loading cameras..." />
            </AuthGuard>
        );
    }

    if (allPlayers.length === 0) {
        return (
            <div className="min-h-screen  flex items-center justify-center p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">No Cameras Configured</h2>
                    <p className="text-gray-400 mb-6">Set up your camera configurations first.</p>
                    <button
                        onClick={() => router.push('/modules/cameras')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Configure Cameras
                    </button>
                </div>
            </div>
        );
    }

    return (
        <AuthGuard loadingMessage="Loading cameras...">
            <div className="min-h-screen  p-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">All Cameras</h1>
                            <p className="text-gray-400">
                                {allPlayers.length} camera{allPlayers.length !== 1 ? 's' : ''} from {teams.length} team{teams.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/modules/cameras')}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Setup
                            </button>
                        </div>
                    </div>
                </div>

                {/* Camera Grid */}
                <div className={`grid ${getGridCols(allPlayers.length)} gap-4 auto-rows-fr`}>
                    {allPlayers.map((player, index) => (
                        <div
                            key={`${player.teamName || 'team'}-${player.inGameName || player.playerName || 'player'}-${index}`}
                            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
                        >
                            {/* Player Info Header */}
                            <div className="bg-gray-700 px-3 py-2 border-b border-gray-600">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">{player.inGameName || player.playerName}</h3>
                                        <p className="text-xs text-gray-400">{player.teamName} • {player.role}</p>
                                    </div>
                                    <div className="text-xs text-gray-500">#{index + 1}</div>
                                </div>
                            </div>

                            {/* Camera Feed */}
                            <div className="relative aspect-video bg-gray-800">
                                {player.imagePath && !streamErrors.has(player.inGameName || player.playerName || '') ? (
                                    <iframe
                                        src={player.imagePath}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen"
                                        onError={() => handleStreamError(player.inGameName || player.playerName || '')}
                                        title={`${player.inGameName || player.playerName} camera feed`}
                                    />
                                ) : player.imagePath ? (
                                    <Image
                                        src={player.imagePath}
                                        alt={player.inGameName || player.playerName || 'Player'}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                            <div className="text-2xl mb-2">📹</div>
                                            <p className="text-sm">No feed</p>
                                        </div>
                                    </div>
                                )}

                                {/* Stream Error Overlay */}
                                {streamErrors.has(player.inGameName || player.playerName || '') && (
                                    <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <div className="text-xl mb-1">⚠️</div>
                                            <p className="text-sm">Stream Error</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="mt-6 text-center text-gray-400 text-sm">
                    <p>Use number keys (1-9) in single view to switch between cameras</p>
                </div>
            </div>
        </AuthGuard>
    );
} 