"use client";

import React, { useEffect } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { SpectatorDisplay } from "@libLeagueClient/components/game/SpectatorDisplay";
import { useGameData } from "@lib/hooks/useGameData";

const SpectatorPage: React.FC = () => {
  const { setActiveModule } = useNavigation();
  const { gameData, isConnected, error } = useGameData();

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);


  return (
    <SpectatorDisplay 
      gameData={gameData} 
      isConnected={isConnected} 
      error={error} 
    />
  );
};

export default SpectatorPage;
