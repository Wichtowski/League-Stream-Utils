import React from "react";
import type { GameStatus } from "@lib/services/game/game-service";

interface GameStatusDisplayProps {
  gameStatus: GameStatus | null;
}

export const GameStatusDisplay: React.FC<GameStatusDisplayProps> = ({ gameStatus }) => {
  if (!gameStatus) {
    return null;
  }

  const formatGameTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-600 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-400 mb-1">Game Phase</div>
          <div className="text-lg font-semibold text-white">
            {gameStatus.gamePhase}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1">Map</div>
          <div className="text-lg font-semibold text-white">
            {gameStatus.mapName}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-gray-400 mb-1">Game Time</div>
          <div className="text-lg font-semibold text-white">
            {gameStatus.isInGame ? formatGameTime(gameStatus.gameTime) : 'N/A'}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          gameStatus.isInGame 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            gameStatus.isInGame ? 'bg-green-400' : 'bg-yellow-400'
          }`}></div>
          {gameStatus.isInGame ? 'Game in Progress' : 'Waiting for Game'}
        </div>
      </div>
    </div>
  );
};
