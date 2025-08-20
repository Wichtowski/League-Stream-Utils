import React, { useEffect, useMemo, useRef, useState } from "react";
import { LiveGameData } from "@libLeagueClient/types/LivePlayer";
import { TeamScoreDisplay } from "@libLeagueClient/components/game/TeamScoreDisplay";
import { PlayerCard } from "@libLeagueClient/components/game/PlayerCard";
import type { Match } from "@lib/types/match";
import type { Tournament } from "@lib/types/tournament";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  getChampionSquareImage,
  getSummonerSpellImageByName,
  // getOverlayAsset,
  getDefaultAsset,
  getDragonPitAsset,
  getBaronPitAsset,
  // getAtakhsanAsset,
  getScoreboardAsset,
  getAtakhanAsset
} from "@libLeagueClient/components/common";
import { getItemImage } from "@lib/items";
import { getChampions } from "@lib/champions";
import { getSummonerSpells } from "@lib/summoner-spells";
import { getItems } from "@lib/items";
import { bindLivePlayersToMatch, createFallbackLivePlayer, getRoleOrder } from "@lib/services/game/live-binding";
import { getLatestVersion } from "@lib/services/common/unified-asset-cache";
import { useImagePreload } from "@lib/hooks/useImagePreload";

interface GameDataDisplayProps {
  gameData: LiveGameData;
  match: Match;
  tournament: Tournament;
}

export const GameDataDisplay: React.FC<GameDataDisplayProps> = ({ gameData, match, tournament }) => {
  const [championsLoaded, setChampionsLoaded] = useState(false);
  const [summonerSpellsLoaded, setSummonerSpellsLoaded] = useState(false);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [gameVersion, setGameVersion] = useState<string>("");
  const [goldIcon, setGoldIcon] = useState<string>("");
  const [towerIcon, setTowerIcon] = useState<string>("");
  const [_baronIcon, setBaronIcon] = useState<string>("");
  const [_grubsIcon, setGrubsIcon] = useState<string>("");
  const [_dragonIcons, setDragonIcons] = useState<string[]>([]);
  const [tournamentLogo, setTournamentLogo] = useState<string>("");
  const [orderLogo, setOrderLogo] = useState<string>("");
  const [chaosLogo, setChaosLogo] = useState<string>("");
  const [uiReady, setUiReady] = useState(false);
  const initialPreloadDoneRef = useRef<boolean>(false);
  const seenChampionNamesRef = useRef<Set<string>>(new Set());
  const seenSpellNamesRef = useRef<Set<string>>(new Set());
  const [initialPreloadUrls, setInitialPreloadUrls] = useState<string[]>([]);

  useEffect(() => {
    const loadAssets = async () => {
      try {
        await getChampions();
        await getSummonerSpells();
        await getItems();
        setChampionsLoaded(true);
        setSummonerSpellsLoaded(true);
        setItemsLoaded(true);
        const resolvedVersion = tournament.gameVersion ?? (await getLatestVersion());
        setGameVersion(resolvedVersion);
        setTournamentLogo(tournament.logo?.data || tournament.logo?.url || getDefaultAsset(resolvedVersion, "tournament.png"));
        setOrderLogo(match.blueTeam.logo?.data || match.blueTeam.logo?.url || getDefaultAsset(resolvedVersion, "order.png"));
        setChaosLogo(match.redTeam.logo?.data || match.redTeam.logo?.url || getDefaultAsset(resolvedVersion, "chaos.png"));
        setGoldIcon(getScoreboardAsset(resolvedVersion, "gold.png"));
        setTowerIcon(getScoreboardAsset(resolvedVersion, "tower.png"));
        setBaronIcon(getBaronPitAsset(resolvedVersion, "baron.png"));
        setBaronIcon(getBaronPitAsset(resolvedVersion, "grubs.png"));
        setBaronIcon(getBaronPitAsset(resolvedVersion, "herald.png"));
        setGrubsIcon(getAtakhanAsset(resolvedVersion, "atakhan_ruinous.png"));
        setGrubsIcon(getAtakhanAsset(resolvedVersion, "atakhan_voracious.png"));
        setDragonIcons([
          getDragonPitAsset(resolvedVersion, "chemtech.png"),
          getDragonPitAsset(resolvedVersion, "cloud.png"),
          getDragonPitAsset(resolvedVersion, "elder.png"),
          getDragonPitAsset(resolvedVersion, "hextech.png"),
          getDragonPitAsset(resolvedVersion, "infernal.png"),
          getDragonPitAsset(resolvedVersion, "mountain.png"),
          getDragonPitAsset(resolvedVersion, "ocean.png"),
        ]);
      } catch (error) {
        console.error("Failed to load assets:", error);
      }
    };
    
    if (!championsLoaded || !summonerSpellsLoaded || !itemsLoaded) {
      loadAssets();
    }
  }, [championsLoaded, summonerSpellsLoaded, itemsLoaded, tournament.gameVersion, gameVersion, tournament.logo, match.blueTeam.logo, match.redTeam.logo]);

  const formatGameTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Compute initial preload set once when base data and assets are ready
  useEffect(() => {
    const hasPlayers = !!gameData?.allPlayers?.length;
    if (
      !initialPreloadDoneRef.current &&
      hasPlayers &&
      championsLoaded &&
      summonerSpellsLoaded &&
      itemsLoaded &&
      gameVersion &&
      goldIcon &&
      towerIcon
    ) {
      const urls: string[] = [];
      // Static UI assets
      const tLogo = tournament.logo?.data || tournament.logo?.url || getDefaultAsset(gameVersion, "tournament.png");
      const oLogo = orderLogo;
      const cLogo = chaosLogo;
      if (goldIcon) urls.push(goldIcon);
      if (towerIcon) urls.push(towerIcon);
      if (tLogo) urls.push(tLogo);
      if (oLogo) urls.push(oLogo);
      if (cLogo) urls.push(cLogo);

      // Champions and current spells
      for (const p of gameData.allPlayers) {
        if (!seenChampionNamesRef.current.has(p.championName)) {
          const champ = getChampionSquareImage(p.championName);
          if (champ) urls.push(champ);
        }
        const s1Name = p.summonerSpells?.summonerSpellOne?.displayName;
        const s2Name = p.summonerSpells?.summonerSpellTwo?.displayName;
        if (s1Name && !seenSpellNamesRef.current.has(s1Name)) {
          const s1 = getSummonerSpellImageByName(s1Name);
          if (s1) urls.push(s1);
        }
        if (s2Name && !seenSpellNamesRef.current.has(s2Name)) {
          const s2 = getSummonerSpellImageByName(s2Name);
          if (s2) urls.push(s2);
        }
      }

      setInitialPreloadUrls(Array.from(new Set(urls)));
    }
  }, [
    gameData?.allPlayers,
    championsLoaded,
    summonerSpellsLoaded,
    itemsLoaded,
    gameVersion,
    goldIcon,
    towerIcon,
    tournament.logo,
    orderLogo,
    chaosLogo
  ]);

  // After initial preload completes, only preload incremental new spell icons (e.g., Spellbook)
  const incrementalUrls = useMemo(() => {
    if (!initialPreloadDoneRef.current || !gameData?.allPlayers?.length) return [] as string[];
    const urls: string[] = [];
    for (const p of gameData.allPlayers) {
      const s1Name = p.summonerSpells?.summonerSpellOne?.displayName;
      const s2Name = p.summonerSpells?.summonerSpellTwo?.displayName;
      if (s1Name && !seenSpellNamesRef.current.has(s1Name)) {
        const s1 = getSummonerSpellImageByName(s1Name);
        if (s1) urls.push(s1);
      }
      if (s2Name && !seenSpellNamesRef.current.has(s2Name)) {
        const s2 = getSummonerSpellImageByName(s2Name);
        if (s2) urls.push(s2);
      }
    }
    return Array.from(new Set(urls));
  }, [gameData?.allPlayers]);

  const { loaded: initialImagesLoaded } = useImagePreload(initialPreloadUrls);
  useImagePreload(incrementalUrls);

  useEffect(() => {
    const allDataReady = !!(gameData && gameData.gameData && gameData.allPlayers);
    if (
      !initialPreloadDoneRef.current &&
      initialPreloadUrls.length > 0 &&
      initialImagesLoaded
    ) {
      // Mark initial batch as complete and record seen champions/spells
      for (const p of gameData.allPlayers) {
        seenChampionNamesRef.current.add(p.championName);
        if (p.summonerSpells?.summonerSpellOne?.displayName) {
          seenSpellNamesRef.current.add(p.summonerSpells.summonerSpellOne.displayName);
        }
        if (p.summonerSpells?.summonerSpellTwo?.displayName) {
          seenSpellNamesRef.current.add(p.summonerSpells.summonerSpellTwo.displayName);
        }
      }
      initialPreloadDoneRef.current = true;
    }

    if (
      allDataReady &&
      championsLoaded &&
      summonerSpellsLoaded &&
      itemsLoaded &&
      initialPreloadDoneRef.current
    ) {
      setUiReady(true);
    }
  }, [
    gameData,
    championsLoaded,
    summonerSpellsLoaded,
    itemsLoaded,
    initialPreloadUrls,
    initialImagesLoaded
  ]);

  if (!uiReady) {
    return (
      <></>
    );
  }

  const blueTeam = gameData.allPlayers.filter(player => player.team === "ORDER");
  const redTeam = gameData.allPlayers.filter(player => player.team === "CHAOS");

  const orderGoldDiff = blueTeam.reduce((sum, player) => sum + (player.gold || 0), 0) - redTeam.reduce((sum, player) => sum + (player.gold || 0), 0);
  const chaosGoldDiff = redTeam.reduce((sum, player) => sum + (player.gold || 0), 0) - blueTeam.reduce((sum, player) => sum + (player.gold || 0), 0);

  const bound = bindLivePlayersToMatch(gameData.allPlayers, match);
  const orderedBlue = getRoleOrder()
    .map((role) => bound.blue.find((b) => b.resolvedRole === role))
    .concat(bound.blue.filter((b) => b.livePlayer && !getRoleOrder().includes(b.resolvedRole)))
    .filter(Boolean) as typeof bound.blue;
  const orderedRed = getRoleOrder()
    .map((role) => bound.red.find((b) => b.resolvedRole === role))
    .concat(bound.red.filter((b) => b.livePlayer && !getRoleOrder().includes(b.resolvedRole)))
    .filter(Boolean) as typeof bound.red;

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
      <motion.div initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 140, damping: 18 }} className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-blue-900/90 via-gray-900/90 to-red-900/90 border-b-2 border-gray-600">
        <div className="flex justify-between items-center h-full px-8">
          {/* Blue Team (Left) */}
            <TeamScoreDisplay
              logo={orderLogo}
              tag={match?.blueTeam?.tag || "BLUE"} 
              kills={blueTeamStats.kills} 
              towers={blueTeamStats.towers} 
              towerIcon={towerIcon} 
              goldDiff={orderGoldDiff} 
              goldIcon={goldIcon} 
              teamGold={blueTeamStats.gold}
              reverse={true} />

          {/* Center - Game Info */}
          <div className="text-center">
            <Image src={tournamentLogo} alt={`${tournament.name} logo`} width={128} height={128} />
            <div className="text-3xl font-bold text-white mb-1 font-mono">
              {formatGameTime(gameData.gameData.gameTime)}
            </div>
          </div>

          {/* Red Team (Right) */}
            <TeamScoreDisplay 
              logo={chaosLogo}
              tag={match?.redTeam?.tag || "RED"}
              kills={redTeamStats.kills}
              towers={redTeamStats.towers}
              towerIcon={towerIcon}
              goldDiff={chaosGoldDiff}
              goldIcon={goldIcon}
              teamGold={redTeamStats.gold} />
        </div>
      </motion.div>

      {/* Left Side Panel - Blue Team Players */}
      <motion.div initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.1 }} className="absolute left-0 top-20 w-64 h-full">
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4 text-center">{match?.blueTeam?.tag || "BLUE"}</h3>
          <div className="space-y-3">
            {orderedBlue.map((bp, index) => {
              const fallback = bp.rosterPlayer ? createFallbackLivePlayer(bp.rosterPlayer, "ORDER") : null;
              const p = bp.livePlayer || fallback;
              if (!p) return null;
              return (
                <motion.div key={index} initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.15 + index * 0.05 }}>
                  <PlayerCard player={p} teamColor="blue" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Right Side Panel - Red Team Players */}
      <motion.div initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.1 }} className="absolute right-0 top-20 w-64 h-full">
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4 text-center">{match?.redTeam?.name || "RED"}</h3>
          <div className="space-y-3">
            {orderedRed.map((bp, index) => {
              const fallback = bp.rosterPlayer ? createFallbackLivePlayer(bp.rosterPlayer, "CHAOS") : null;
              const p = bp.livePlayer || fallback;
              if (!p) return null;
              return (
                <motion.div key={index} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.15 + index * 0.05 }}>
                  <PlayerCard player={p} teamColor="red" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Bottom Bar - Player Stats Table */}
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
      </div>
    </div>
  );
};



