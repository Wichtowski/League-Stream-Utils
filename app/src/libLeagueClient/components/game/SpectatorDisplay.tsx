import React from "react";
import { LiveGameData } from "@libLeagueClient/types";
import { LaneHud } from "@libLeagueClient/components/game/LaneHud";
import { DebugGameData } from "./DebugGameData";

interface SpectatorDisplayProps {
  gameData: LiveGameData | null;
  isConnected: boolean;
  error: string | null;
}

export const SpectatorDisplay: React.FC<SpectatorDisplayProps> = ({ 
  gameData, 
  isConnected, 
  error 
}) => {
  if (!isConnected) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-xl">
          {error ? `Error: ${error}` : "Connecting to League Client..."}
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-xl">No game data available</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 text-white font-sans">
      <DebugGameData gameData={gameData} isConnected={isConnected} error={error} />
      
      {/* Simple game info display */}
      <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-2">Game Info</h3>
        <div className="space-y-1 text-sm">
          <div><strong>Mode:</strong> {gameData.gameData?.gameMode || "Unknown"}</div>
          <div><strong>Map:</strong> {gameData.gameData?.mapName || "Unknown"}</div>
          <div><strong>Time:</strong> {Math.floor((gameData.gameData?.gameTime || 0) / 60)}:{(gameData.gameData?.gameTime || 0) % 60 < 10 ? '0' : ''}{Math.floor((gameData.gameData?.gameTime || 0) % 60)}</div>
          <div><strong>Players:</strong> {gameData.allPlayers?.length || 0}</div>
        </div>
      </div>

      {/* Lane HUD */}
      <LaneHud gameData={gameData} gameVersion="15.17.1" />
    </div>
  );
};

