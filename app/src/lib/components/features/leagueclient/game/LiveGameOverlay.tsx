"use client";

import React from "react";
import { useLiveGameData } from "@lib/hooks/useLiveGameData";
import { LivePlayer } from "@lib/services/game/game-service";
import Image from "next/image";
import { getChampionSquareImage } from "@lib/components/features/leagueclient/common";

export const LiveGameOverlay: React.FC = () => {
  const { gameData, isConnected, error } = useLiveGameData();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="text-red-400 text-center">
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p>{error}</p>
          <p className="text-sm mt-2">Make sure a League of Legends game is running</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="text-yellow-400 text-center">
          <h2 className="text-xl font-bold mb-2">Waiting for Game</h2>
          <p>Waiting for League of Legends game to start...</p>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-4">
        <div className="text-blue-400 text-center">
          <h2 className="text-xl font-bold mb-2">Loading Game Data</h2>
          <p>Connecting to live game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Game Stats Header */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-400">
                {gameData.gameMode} - {gameData.mapName}
              </h1>
              <p className="text-gray-300">
                Game Time: {Math.floor(gameData.gameTime / 60)}:{(gameData.gameTime % 60).toString().padStart(2, '0')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                {gameData.blueTeam.objectives.dragon} - {gameData.redTeam.objectives.dragon}
              </div>
              <div className="text-sm text-gray-400">Dragons</div>
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="grid grid-cols-2 gap-6">
          {/* Blue Team */}
          <div className="bg-blue-900/20 rounded-lg p-4">
            <h2 className="text-xl font-bold text-blue-400 mb-4">Blue Team</h2>
            <div className="space-y-3">
                             {gameData.blueTeam.players.map((player, index: number) => (
                 <PlayerCard key={index} player={player} team="blue" />
               ))}
            </div>
          </div>

          {/* Red Team */}
          <div className="bg-red-900/20 rounded-lg p-4">
            <h2 className="text-xl font-bold text-red-400 mb-4">Red Team</h2>
            <div className="space-y-3">
                             {gameData.redTeam.players.map((player, index: number) => (
                 <PlayerCard key={index} player={player} team="red" />
               ))}
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold text-yellow-400 mb-4">Objectives</h2>
          <div className="grid grid-cols-3 gap-4">
            <ObjectiveCard
              title="Baron"
              blueValue={gameData.blueTeam.objectives.baron}
              redValue={gameData.redTeam.objectives.baron}
              icon="🐉"
            />
            <ObjectiveCard
              title="Dragon"
              blueValue={gameData.blueTeam.objectives.dragon}
              redValue={gameData.redTeam.objectives.dragon}
              icon="🐲"
            />
            <ObjectiveCard
              title="Towers"
              blueValue={gameData.blueTeam.objectives.tower}
              redValue={gameData.redTeam.objectives.tower}
              icon="🏰"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface PlayerCardProps {
  player: LivePlayer;
  team: "blue" | "red";
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, team }) => {
  const teamColor = team === "blue" ? "blue" : "red";
  const championImage = getChampionSquareImage(player.championName);
  
  return (
    <div className={`bg-${teamColor}-800/30 rounded-lg p-3 border border-${teamColor}-600/50`}>
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-lg">🎯</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-white">{player.summonerName}</h3>
              <p className="text-sm text-gray-300">{player.championName}</p>
               {championImage && (
                 <Image src={championImage} alt={player.championName} width={32} height={32} />
               )}
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-yellow-400">
                {player.scores.kills}/{player.scores.deaths}/{player.scores.assists}
              </div>
              <div className="text-sm text-gray-400">CS: {player.scores.creepScore}</div>
            </div>
          </div>
          
          {/* Items */}
          <div className="flex space-x-1 mt-2">
            {player.items.map((item: any, index: number) => (
              <div key={index} className="w-6 h-6 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                <span className="text-xs">⚔️</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ObjectiveCardProps {
  title: string;
  blueValue: number;
  redValue: number;
  icon: string;
}

const ObjectiveCard: React.FC<ObjectiveCardProps> = ({ title, blueValue, redValue, icon }) => {
  return (
    <div className="bg-gray-700 rounded-lg p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <div className="flex justify-between items-center">
        <span className="text-blue-400 font-bold text-xl">{blueValue}</span>
        <span className="text-gray-400">vs</span>
        <span className="text-red-400 font-bold text-xl">{redValue}</span>
      </div>
    </div>
  );
};
