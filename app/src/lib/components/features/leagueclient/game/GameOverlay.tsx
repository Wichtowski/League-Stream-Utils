import React from "react";
import { useGameData } from "@lib/hooks/useGameData";
import { GameDataDisplay } from "@/lib/components/features/leagueclient/game/GameDataDisplay";

export const GameOverlay: React.FC = () => {
  const {
    gameData,
    isConnected,
    isLoading
  } = useGameData();

  // Show nothing if loading, not connected, or no game data
  if (isLoading || !isConnected || !gameData) {
    return null;
  }

  // Only show the game overlay when there's actual game data
  return <GameDataDisplay gameData={gameData} />;
};
