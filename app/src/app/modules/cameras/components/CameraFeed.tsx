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
    tournamentMode?: boolean; // Enable 3-minute delay for tournaments
    forceDelay?: boolean; // Force use of delayed stream
}

export default function CameraFeed({
    player,
    onStreamError,
    className = "w-full h-full",
    showPlayerInfo = false,
    playerInfoSize = 'large',
    teamName,
    tournamentMode = false,
    forceDelay = false
}: CameraFeedProps) {
    const [streamFailed, setStreamFailed] = useState(false);

    const handleStreamError = () => {
        setStreamFailed(true);
        onStreamError?.();
    };

    const playerName = player.inGameName || player.playerName || 'Unknown Player';
    
    // Determine which stream URL to use
    const getStreamUrl = (): string | undefined => {
        // Priority order for stream selection:
        // 1. Force delay mode - use delayedUrl
        // 2. Tournament mode + player has useDelay enabled - use delayedUrl
        // 3. Player has useDelay enabled - use delayedUrl
        // 4. Fall back to regular url
        // 5. Fall back to imagePath for static images
        
        if (forceDelay && player.delayedUrl) {
            return player.delayedUrl;
        }
        
        if (tournamentMode && (player.useDelay || player.delayedUrl)) {
            return player.delayedUrl || player.url;
        }
        
        if (player.useDelay && player.delayedUrl) {
            return player.delayedUrl;
        }
        
        return player.url || player.imagePath;
    };

    const streamUrl = getStreamUrl();
    const isDelayed = (forceDelay || (tournamentMode && player.useDelay) || player.useDelay) && player.delayedUrl;

    return (
        <div className={`relative ${className}`}>
            {/* Tournament Mode Indicator */}
            {isDelayed && (
                <div className="absolute top-4 right-4 z-20 bg-red-600/90 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                        3 MIN DELAY
                    </div>
                </div>
            )}

            {streamUrl && !streamFailed ? (
                // Check if it's a video stream URL (iframe) or static image
                streamUrl.includes('http') && (streamUrl.includes('twitch.tv') || streamUrl.includes('youtube.com') || streamUrl.includes('rtmp://') || streamUrl.includes('.m3u8')) ? (
                    <iframe
                        src={streamUrl}
                        className="w-full h-full"
                        allow="autoplay; fullscreen"
                        onError={handleStreamError}
                        title={`${playerName} camera feed${isDelayed ? ' (3min delay)' : ''}`}
                    />
                ) : (
                    <Image
                        src={streamUrl}
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
                                <h2 className={`font-bold text-white drop-shadow-lg mb-4 ${playerInfoSize === 'large' ? 'text-8xl' : 'text-2xl'
                                    }`}>
                                    {playerName}
                                </h2>
                                <p className={`text-gray-300 drop-shadow-lg ${playerInfoSize === 'large' ? 'text-3xl' : 'text-sm'
                                    }`}>
                                    {player.role} {teamName && `• ${teamName}`}
                                </p>
                                <p className={`text-gray-400 mt-4 ${playerInfoSize === 'large' ? 'text-lg' : 'text-xs'
                                    }`}>
                                    {tournamentMode ? 'No delayed camera feed configured' : 'No camera feed configured'}
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
                        <div className={`mb-2 ${playerInfoSize === 'large' ? 'text-6xl mb-4' : 'text-xl mb-1'}`}>⚠️</div>
                        <h2 className={`font-bold mb-2 ${playerInfoSize === 'large' ? 'text-4xl' : 'text-sm'}`}>
                            Stream Error
                        </h2>
                        <p className={playerInfoSize === 'large' ? 'text-xl' : 'text-sm'}>
                            Unable to load {isDelayed ? 'delayed ' : ''}camera feed for {playerName}
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

            {/* Live/Delayed Indicator in bottom corner */}
            <div className="absolute bottom-4 left-4 z-20">
                <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    isDelayed 
                        ? 'bg-red-600/90 text-white' 
                        : 'bg-green-600/90 text-white'
                }`}>
                    {isDelayed ? 'DELAYED' : 'LIVE'}
                </div>
            </div>
        </div>
    );
} 