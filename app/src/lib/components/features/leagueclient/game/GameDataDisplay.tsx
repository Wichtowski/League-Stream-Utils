import React, { useEffect, useState } from "react";
import type { LiveGameData, LivePlayer } from "@lib/services/game/game-service";
import Image from "next/image";
import { getChampionSquareImage, getSummonerSpellImageByName } from "@lib/components/features/leagueclient/common";
import { getItemImage } from "@lib/items";
import { getChampions } from "@lib/champions";
import { getSummonerSpells } from "@lib/summoner-spells";
import { getItems } from "@/lib/items";

interface GameDataDisplayProps {
  gameData: LiveGameData;
}

export const GameDataDisplay: React.FC<GameDataDisplayProps> = ({ gameData }) => {
  const [championsLoaded, setChampionsLoaded] = useState(false);
  const [summonerSpellsLoaded, setSummonerSpellsLoaded] = useState(false);
  const [itemsLoaded, setItemsLoaded] = useState(false);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        await getChampions();
        await getSummonerSpells();
        await getItems();
        setChampionsLoaded(true);
        setSummonerSpellsLoaded(true);
        setItemsLoaded(true);
      } catch (error) {
        console.error("Failed to load assets:", error);
      }
    };
    
    if (!championsLoaded || !summonerSpellsLoaded || !itemsLoaded) {
      loadAssets();
    }
  }, [championsLoaded, summonerSpellsLoaded, itemsLoaded]);

  const formatGameTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Hide entire UI if no game data or assets not loaded
  if (!gameData || !gameData.gameData || !gameData.allPlayers || !championsLoaded || !summonerSpellsLoaded || !itemsLoaded) {
    return null;
  }

  const blueTeam = gameData.allPlayers.filter(player => player.team === "ORDER");
  const redTeam = gameData.allPlayers.filter(player => player.team === "CHAOS");

  // Calculate team stats
  const blueTeamStats = {
    kills: blueTeam.reduce((sum, player) => sum + (player.scores?.kills || 0), 0),
    deaths: blueTeam.reduce((sum, player) => sum + (player.scores?.deaths || 0), 0),
    assists: blueTeam.reduce((sum, player) => sum + (player.scores?.assists || 0), 0),
    gold: blueTeam.reduce((sum, player) => sum + (player.gold || 0), 0),
    towers: 0, // You'll need to get this from game data
    dragons: 0,
    barons: 0,
    inhibitors: 0
  };

  const redTeamStats = {
    kills: redTeam.reduce((sum, player) => sum + (player.scores?.kills || 0), 0),
    deaths: redTeam.reduce((sum, player) => sum + (player.scores?.deaths || 0), 0),
    assists: redTeam.reduce((sum, player) => sum + (player.scores?.assists || 0), 0),
    gold: redTeam.reduce((sum, player) => sum + (player.gold || 0), 0),
    towers: 0,
    dragons: 0,
    barons: 0,
    inhibitors: 0
  };

  return (
    <div className="fixed inset-0 bg-black/80 text-white font-sans">
      {/* Top Bar - Team Scores & Game Info */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-blue-900/90 via-gray-900/90 to-red-900/90 border-b-2 border-gray-600">
        <div className="flex justify-between items-center h-full px-8">
          {/* Blue Team (Left) */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">BLUE</div>
              <div className="text-sm text-gray-300">Team</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{blueTeamStats.kills}</div>
              <div className="text-xs text-gray-400">Kills</div>
            </div>
            <div className="flex space-x-4 text-center">
              <div>
                <div className="text-lg font-bold text-yellow-400">{blueTeamStats.towers}</div>
                <div className="text-xs text-gray-400">Towers</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-400">{blueTeamStats.dragons}</div>
                <div className="text-xs text-gray-400">Dragons</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-400">{blueTeamStats.barons}</div>
                <div className="text-xs text-gray-400">Barons</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{(blueTeamStats.gold / 1000).toFixed(1)}K</div>
              <div className="text-xs text-gray-400">Gold</div>
            </div>
          </div>

          {/* Center - Game Info */}
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1 font-mono">
              {formatGameTime(gameData.gameData.gameTime)}
            </div>
            <div className="text-sm text-gray-400">
              {gameData.gameData.gameMode} - {gameData.gameData.mapName}
            </div>
          </div>

          {/* Red Team (Right) */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{(redTeamStats.gold / 1000).toFixed(1)}K</div>
              <div className="text-xs text-gray-400">Gold</div>
            </div>
            <div className="flex space-x-4 text-center">
              <div>
                <div className="text-lg font-bold text-purple-400">{redTeamStats.barons}</div>
                <div className="text-xs text-gray-400">Barons</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-400">{redTeamStats.dragons}</div>
                <div className="text-xs text-gray-400">Dragons</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-400">{redTeamStats.towers}</div>
                <div className="text-xs text-gray-400">Towers</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{redTeamStats.kills}</div>
              <div className="text-xs text-gray-400">Kills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">RED</div>
              <div className="text-sm text-gray-300">Team</div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side Panel - Blue Team Players */}
      <div className="absolute left-0 top-20 w-64 h-full bg-blue-900/20 border-r border-blue-600/50">
        <div className="p-4">
          <h3 className="text-lg font-bold text-blue-400 mb-4 text-center">BLUE TEAM</h3>
          <div className="space-y-3">
            {blueTeam.map((player, index) => (
              <PlayerCard key={index} player={player} teamColor="blue" />
            ))}
          </div>
        </div>
      </div>

      {/* Right Side Panel - Red Team Players */}
      <div className="absolute right-0 top-20 w-64 h-full bg-red-900/20 border-l border-red-600/50">
        <div className="p-4">
          <h3 className="text-lg font-bold text-red-400 mb-4 text-center">RED TEAM</h3>
          <div className="space-y-3">
            {redTeam.map((player, index) => (
              <PlayerCard key={index} player={player} teamColor="red" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar - Player Stats Table
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gray-900/95 border-t-2 border-gray-600">
        <div className="h-full overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="px-2 py-1 text-left text-gray-400">Champion</th>
                <th className="px-2 py-1 text-center text-gray-400">KDA</th>
                <th className="px-2 py-1 text-center text-gray-400">CS</th>
                <th className="px-2 py-1 text-center text-gray-400">Gold</th>
                <th className="px-2 py-1 text-center text-gray-400">Items</th>
                <th className="px-2 py-1 text-center text-gray-400">Team</th>
              </tr>
            </thead>
            <tbody>
              {[...blueTeam, ...redTeam].map((player, index) => (
                <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-800/50">
                  <td className="px-2 py-1">
                    <div className="flex items-center space-x-2">
                      <Image 
                        src={getChampionSquareImage(player.championName) || "/api/local-image?path=default/player.png"} 
                        alt={player.championName} 
                        width={24} 
                        height={24} 
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium text-white">{player.championName}</div>
                        <div className="text-xs text-gray-400">{player.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <span className="font-bold text-white">
                      {player.scores?.kills || 0}/{player.scores?.deaths || 0}/{player.scores?.assists || 0}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-center text-white">{player.scores?.creepScore || 0}</td>
                  <td className="px-2 py-1 text-center text-white">{Math.round((player.gold || 0) / 100) / 10}K</td>
                  <td className="px-2 py-1">
                    <div className="flex space-x-1 justify-center">
                      {player.items?.slice(0, 3).map((item, itemIndex) => (
                        <div key={itemIndex} className="w-5 h-5 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                          <Image src={getItemImage(item.itemID)} alt={item.name} width={20} height={20} />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-1 text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto ${player.team === "ORDER" ? "bg-blue-500" : "bg-red-500"}`}></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div> */}
    </div>
  );
};

interface PlayerCardProps {
  player: LivePlayer;
  teamColor: "blue" | "red";
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, teamColor }) => {
  const colorClasses = {
    blue: "border-blue-500 bg-blue-900/30",
    red: "border-red-500 bg-red-900/30"
  };
  const championImage = getChampionSquareImage(player.championName);
  const summonerSpellOne = getSummonerSpellImageByName(player.summonerSpells?.summonerSpellOne?.displayName);
  const summonerSpellTwo = getSummonerSpellImageByName(player.summonerSpells?.summonerSpellTwo?.displayName);
  const healthPercentage = Math.max(0, Math.min(100, ((player.health ?? 0) / (player.maxHealth ?? 1)) * 100));

  return (
    <div className={`border rounded-lg p-3 ${colorClasses[teamColor]} hover:bg-opacity-50 transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Image 
            src={championImage} 
            alt={player.championName} 
            width={32} 
            height={32} 
            className="rounded"
          />
          <div>
            <div className="font-medium text-white text-sm">{player.summonerName || "Unknown"}</div>
            <div className="text-xs text-gray-300">{player.championName || "Unknown"}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-yellow-400">Lv.{player.level || 1}</div>
          <div className="text-xs text-gray-400">{player.position === "UTILITY" ? "SUPPORT" : player.position}</div>
        </div>
      </div>
      
      {/* Health Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${healthPercentage}%` }}></div>
      </div>
      
      {/* Summoner Spells */}
       <div className="flex space-x-1 mb-2">
         <div className="w-6 h-6 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
           <Image src={summonerSpellOne} alt={player.summonerSpells?.summonerSpellOne?.displayName} width={24} height={24} />
         </div>
         <div className="w-6 h-6 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
           <Image src={summonerSpellTwo} alt={player.summonerSpells?.summonerSpellTwo?.displayName} width={24} height={24} />
         </div>
       </div>
      
      {/* KDA */}
      <div className="text-center">
        <div className="text-sm font-bold text-white">
          {player.scores?.kills || 0}/{player.scores?.deaths || 0}/{player.scores?.assists || 0}
        </div>
        <div className="text-xs text-gray-400">KDA</div>
      </div>
    </div>
  );
};
