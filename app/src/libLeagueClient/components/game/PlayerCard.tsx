import Image from "next/image";
import { getChampionCenteredSplashImage } from "@libLeagueClient/components/common";
import { getSummonerSpellImageByName } from "@libLeagueClient/components/common";
import { LivePlayer } from "@libLeagueClient/types/LivePlayer";
import { useMemo } from "react";

interface PlayerCardProps {
  player: LivePlayer;
  teamColor: "blue" | "red";
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, teamColor }) => {
  const colorClasses = {
    blue: "border-blue-500 bg-blue-900/30",
    red: "border-red-500 bg-red-900/30"
  };

  // Dynamically load champion image based on current champion
  const championImage = useMemo(() => {
    return getChampionCenteredSplashImage(player.championName);
  }, [player.championName]);

  // Dynamically load summoner spell images
  const summonerSpellOne = useMemo(() => {
    return getSummonerSpellImageByName(player.summonerSpells?.summonerSpellOne?.displayName);
  }, [player.summonerSpells?.summonerSpellOne?.displayName]);

  const summonerSpellTwo = useMemo(() => {
    return getSummonerSpellImageByName(player.summonerSpells?.summonerSpellTwo?.displayName);
  }, [player.summonerSpells?.summonerSpellTwo?.displayName]);

  const healthPercentage = Math.max(0, Math.min(100, ((player.health ?? 0) / (player.maxHealth ?? 1)) * 100));

  return (
    <div className={`border rounded-md p-1 ${colorClasses[teamColor]} transition-all`}>
      <div className="flex items-center">
        <div className="relative mr-1">
          {championImage && <Image src={championImage} alt={player.championName} width={28} height={28} className="rounded" />}
          <div className="absolute -bottom-1 -left-1 bg-yellow-500 text-black text-[10px] leading-none px-1 rounded">
            {player.level || 1}
          </div>
        </div>
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col space-y-0.5 mr-1">
            <div className="w-4 h-4 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
              <Image
                src={summonerSpellOne}
                alt={player.summonerSpells?.summonerSpellOne?.displayName}
                width={12}
                height={12}
              />
            </div>
            <div className="w-4 h-4 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
              <Image
                src={summonerSpellTwo}
                alt={player.summonerSpells?.summonerSpellTwo?.displayName}
                width={12}
                height={12}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-white truncate">{player.summonerName || "Unknown"}</div>
            <div className="text-[9px] text-gray-300 truncate">{player.championName || "Unknown"}</div>
            <div className="w-full bg-gray-700 rounded h-1 mt-0.5">
              <div className="bg-red-500 h-1 rounded" style={{ width: `${healthPercentage}%` }}></div>
            </div>
          </div>
          <div className="ml-1 text-right">
            <div className="text-[10px] font-bold text-white">
              {player.scores?.kills || 0}/{player.scores?.deaths || 0}/{player.scores?.assists || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
