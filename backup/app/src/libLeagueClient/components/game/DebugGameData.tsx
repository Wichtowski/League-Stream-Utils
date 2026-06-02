import React from "react";
import { LiveGameData } from "@libLeagueClient/types";

interface DebugGameDataProps {
  gameData: LiveGameData | null;
  isConnected: boolean;
  error: string | null;
}

export const DebugGameData: React.FC<DebugGameDataProps> = ({ gameData, isConnected, error }) => {
  return (
    <div className="fixed top-4 left-4 bg-black/80 text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto z-50">
      <h3 className="text-lg font-bold mb-2">Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Connected:</strong> {isConnected ? "✅ Yes" : "❌ No"}
        </div>
        
        {error && (
          <div>
            <strong>Error:</strong> <span className="text-red-400">{error}</span>
          </div>
        )}
        
        <div>
          <strong>Game Data:</strong> {gameData ? "✅ Available" : "❌ Not Available"}
        </div>
        
        {gameData && (
          <>
            <div>
              <strong>Game Mode:</strong> {gameData.gameData?.gameMode || "Unknown"}
            </div>
            <div>
              <strong>Map:</strong> {gameData.gameData?.mapName || "Unknown"}
            </div>
            <div>
              <strong>Game Time:</strong> {gameData.gameData?.gameTime || 0}s
            </div>
            <div>
              <strong>Players:</strong> {gameData.allPlayers?.length || 0}
            </div>
            
            {gameData.allPlayers && gameData.allPlayers.length > 0 && (
              <div>
                <strong>Player Names:</strong>
                <ul className="ml-4 mt-1">
                  {gameData.allPlayers.slice(0, 3).map((player, index) => (
                    <li key={index} className="text-xs">
                      {player.summonerName} ({player.championName})
                    </li>
                  ))}
                  {gameData.allPlayers.length > 3 && (
                    <li className="text-xs">... and {gameData.allPlayers.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};


