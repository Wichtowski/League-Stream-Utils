'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { CameraPlayer } from '@lib/types';

interface CameraFeedProps {
    player: CameraPlayer;
    onStreamError?: () => void;
    className?: string;
    showPlayerInfo?: boolean;
    playerInfoSize?: 'small' | 'large';
    teamName?: string;
}

export const CameraFeed = ({
    player,
    onStreamError,
    className = 'w-full h-full',
    showPlayerInfo = false,
    playerInfoSize = 'large',
    teamName
}: CameraFeedProps): React.ReactElement => {
    const [streamFailed, setStreamFailed] = useState(false);

    const handleStreamError = () => {
        setStreamFailed(true);
        onStreamError?.();
    };

    const playerName = player.inGameName || player.playerName || 'Unknown Player';

    return (
        <div className={`relative ${className}`}>
            {streamFailed ? (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                        {showPlayerInfo && (
                            <>
                                <h2
                                    className={`font-bold text-white drop-shadow-lg mb-4 ${
                                        playerInfoSize === 'large' ? 'text-8xl' : 'text-2xl'
                                    }`}
                                >
                                    {playerName}
                                </h2>
                                <p
                                    className={`text-gray-300 drop-shadow-lg ${
                                        playerInfoSize === 'large' ? 'text-3xl' : 'text-sm'
                                    }`}
                                >
                                    {player.role} {teamName && `• ${teamName}`}
                                </p>
                                <p
                                    className={`text-gray-400 mt-4 ${
                                        playerInfoSize === 'large' ? 'text-lg' : 'text-xs'
                                    }`}
                                >
                                    No camera feed configured
                                </p>
                            </>
                        )}
                        {!showPlayerInfo && (
                            <div className="text-center text-gray-400">
                                <div className="text-2xl mb-2">📹</div>
                                <p className="text-sm">No feed</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : player.url && !streamFailed ? (
                player.url.includes('http') &&
                (player.url.includes('twitch.tv') ||
                    player.url.includes('youtube.com') ||
                    player.url.includes('rtmp://') ||
                    player.url.includes('.m3u8')) ? (
                    <iframe
                        src={player.url}
                        className="w-full h-full"
                        allow="autoplay; fullscreen"
                        onError={handleStreamError}
                        title={playerName}
                    />
                ) : (
                    <Image
                        src={player.url}
                        alt={playerName}
                        fill
                        className="object-cover"
                        onError={handleStreamError}
                    />
                )
            ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center">
                        {showPlayerInfo && (
                            <>
                                <h2
                                    className={`font-bold text-white drop-shadow-lg mb-4 ${
                                        playerInfoSize === 'large' ? 'text-8xl' : 'text-2xl'
                                    }`}
                                >
                                    {playerName}
                                </h2>
                                <p
                                    className={`text-gray-300 drop-shadow-lg ${
                                        playerInfoSize === 'large' ? 'text-3xl' : 'text-sm'
                                    }`}
                                >
                                    {player.role} {teamName && `• ${teamName}`}
                                </p>
                                <p
                                    className={`text-gray-400 mt-4 ${
                                        playerInfoSize === 'large' ? 'text-lg' : 'text-xs'
                                    }`}
                                >
                                    No camera feed configured
                                </p>
                            </>
                        )}
                        {!showPlayerInfo && (
                            <div className="text-center text-gray-400">
                                <div className="text-2xl mb-2">📹</div>
                                <p className="text-sm">No feed</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stream Error Overlay */}
            {streamFailed && (
                <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                    <div className="text-center text-white">
                        <div className={`mb-2 ${playerInfoSize === 'large' ? 'text-6xl mb-4' : 'text-xl mb-1'}`}>
                            ⚠️
                        </div>
                        <h2 className={`font-bold mb-2 ${playerInfoSize === 'large' ? 'text-4xl' : 'text-sm'}`}>
                            Stream Error
                        </h2>
                        <p className={playerInfoSize === 'large' ? 'text-xl' : 'text-sm'}>
                            Unable to load camera feed for {playerName}
                        </p>
                        {playerInfoSize === 'large' && (
                            <button
                                onClick={() => setStreamFailed(false)}
                                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                Retry
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
