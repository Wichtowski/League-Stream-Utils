"use client";

import React, { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { CameraPlayer } from "@libCamera/types";
import { SafeImage } from "@lib/components/common/SafeImage";
import { LoadingSpinner } from "@lib/components/common";

export interface CameraStreamProps {
  players: CameraPlayer[];
  teamName?: string;
  width?: string | number;
  height?: string | number;
  aspectRatio?: string;
  showPlayerName?: boolean;
  showRandomModeIndicator?: boolean;
  enableKeyboardControls?: boolean;
  enableRandomMode?: boolean;
  randomModeInterval?: number;
  onPlayerChange?: (player: CameraPlayer | null) => void;
  onRandomModeToggle?: (enabled: boolean) => void;
  className?: string;
  objectFit?: "cover" | "contain" | "fill" | "scale-down" | "none";
  playerNameSize?: "small" | "medium" | "large";
}

export const CameraStream: React.FC<CameraStreamProps> = ({
  players,
  teamName = "",
  width = "100%",
  height = "auto",
  aspectRatio = "16/9",
  showPlayerName = true,
  showRandomModeIndicator = true,
  enableKeyboardControls = true,
  enableRandomMode = true,
  randomModeInterval = 5000,
  onPlayerChange,
  onRandomModeToggle,
  className = "",
  objectFit = "cover",
  playerNameSize = "medium"
}) => {
  const [currentPlayer, setCurrentPlayer] = useState<CameraPlayer | null>(null);
  const [randomMode, setRandomMode] = useState(enableRandomMode);

  const getRandomPlayer = useCallback((): CameraPlayer | null => {
    if (players.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * players.length);
    return players[randomIndex];
  }, [players]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!enableKeyboardControls) return;

      if (e.key === " ") {
        const nextPlayer = getRandomPlayer();
        if (nextPlayer) {
          setCurrentPlayer(nextPlayer);
        }
      } else if (e.key.toLowerCase() === "r") {
        const newRandomMode = !randomMode;
        setRandomMode(newRandomMode);
        onRandomModeToggle?.(newRandomMode);
      } else if (e.key >= "1" && e.key <= "9") {
        const playerIndex = parseInt(e.key) - 1;
        if (playerIndex >= 0 && playerIndex < players.length) {
          setCurrentPlayer(players[playerIndex]);
          setRandomMode(false);
          onRandomModeToggle?.(false);
        }
      }
    },
    [players, getRandomPlayer, enableKeyboardControls, randomMode, onRandomModeToggle]
  );

  // Set initial player when players are loaded
  useEffect(() => {
    if (players.length > 0 && !currentPlayer) {
      const initialPlayer = getRandomPlayer();
      if (initialPlayer) {
        setCurrentPlayer(initialPlayer);
      }
    }
  }, [players, currentPlayer, getRandomPlayer]);

  // Keyboard event listeners
  useEffect(() => {
    if (!enableKeyboardControls) return;

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress, enableKeyboardControls]);

  // Random mode timer
  useEffect(() => {
    if (!randomMode || players.length <= 1 || !enableRandomMode) return;

    const interval = setInterval(() => {
      const nextPlayer = getRandomPlayer();
      if (nextPlayer) {
        setCurrentPlayer(nextPlayer);
      }
    }, randomModeInterval);

    return () => clearInterval(interval);
  }, [randomMode, players.length, getRandomPlayer, enableRandomMode, randomModeInterval]);

  // Notify parent of player changes
  useEffect(() => {
    onPlayerChange?.(currentPlayer);
  }, [currentPlayer, onPlayerChange]);

  const containerStyle = useMemo(() => {
    const style: React.CSSProperties = {
      width,
      height: height === "auto" ? undefined : height,
      aspectRatio: height === "auto" ? aspectRatio : undefined,
    };
    return style;
  }, [width, height, aspectRatio]);

  if (players.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">
          {teamName ? "No Players Found" : "No Players Available"}
        </h2>
        <p className="text-gray-400 mb-4">
          {teamName
            ? `No camera feeds configured for ${teamName}`
            : "No camera feeds are available"}
        </p>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner fullscreen text="Loading..." />}>
      <div className={`relative ${className}`} style={containerStyle}>
        {/* Main Stream Display */}
        {currentPlayer && (
          <div className="absolute inset-0 w-full h-full block overflow-hidden">
            {currentPlayer.url ? (
              <iframe
                src={currentPlayer.url}
                className={`w-full h-full object-${objectFit} pointer-events-none`}
                allow="autoplay; fullscreen"
                title={`${currentPlayer.inGameName || currentPlayer.playerName} camera feed`}
              />
            ) : currentPlayer.imagePath ? (
              <SafeImage
                src={currentPlayer.imagePath}
                alt={currentPlayer.inGameName || currentPlayer.playerName || "Player"}
                fill={true}
                className={`object-${objectFit}`}
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

        {/* Player Name Overlay */}
        {currentPlayer && showPlayerName && (
          <>
            {/* Shadow Background - Independent */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black via-black/70 to-transparent py-8"></div>
            
            {/* Text - Independent */}
            <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center py-4 px-2">
              <h2 className={`font-bold text-white ${
                playerNameSize === "small" ? "text-lg" :
                playerNameSize === "medium" ? "text-2xl" :
                "text-4xl"
              }`}>
                {currentPlayer.inGameName || currentPlayer.playerName || "Unknown Player"}
              </h2>
            </div>
          </>
        )}
      </div>

      {/* Random Mode Indicator */}
      {randomMode && showRandomModeIndicator && (
        <div className="flex justify-center mt-4">
          <div className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse">
            🔄 Random Mode Active
          </div>
        </div>
      )}
    </Suspense>
  );
};
