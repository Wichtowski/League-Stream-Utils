import React, { useEffect, useMemo, useRef, useState } from "react";
import { LiveGameData } from "@libLeagueClient/types";
import { motion } from "framer-motion";
import { Tournament, Match, GameResult } from "@libTournament/types";
import { LaneHud } from "@libLeagueClient/components/game/LaneHud";
import { TopBar } from "@libLeagueClient/components/game/TopBar";
import {
  getChampionSquareImage,
  getSummonerSpellImageByName,
  getDefaultAsset,
  getDragonPitAsset,
  getBaronPitAsset,
  getScoreboardAsset,
  getAtakhanAsset,
  getCommonAsset
} from "@libLeagueClient/components/common";
import { getItems } from "@lib/items";
import { getChampions } from "@lib/champions";
import { getSummonerSpells } from "@lib/summoner-spells";
import { bindLivePlayersToMatch } from "@lib/services/game/live-binding";
import { getLatestVersion } from "@lib/services/common/unified-asset-cache";
import { useImagePreload } from "@lib/hooks/useImagePreload";
import { Team } from "@libTeam/types";
import { SubTopBar } from "./SubTopBar";
// import { CameraStream } from "@libCamera/components/CameraStream";

export type Resolutions = "FHD" | "WQHD" | "4K";

interface GameDataDisplayProps {
  gameData: LiveGameData;
  match?: Match;
  tournament?: Tournament;
  blueTeamData?: Team;
  redTeamData?: Team;
  resolution?: Resolutions;
}

const MapBackground: React.FC = () => {
  const mapHeight = 250 + (11 * 2);
  const mapWidth = 250 + (12 * 2);

  return (
    <div
      className="absolute bottom-0 right-0 bg-black"
      style={{ width: mapWidth, height: mapHeight }}
    />
  );
};

export const GameDataDisplay: React.FC<GameDataDisplayProps> = ({
  gameData,
  match,
  tournament,
  blueTeamData,
  redTeamData,
  resolution = "WQHD"
}) => {
  const [championsLoaded, setChampionsLoaded] = useState(false);
  const [summonerSpellsLoaded, setSummonerSpellsLoaded] = useState(false);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [gameVersion, setGameVersion] = useState<string>("");
  const [goldIcon, setGoldIcon] = useState<string>("");
  const [towerIcon, setTowerIcon] = useState<string>("");
  const [_baronIcon, setBaronIcon] = useState<string>("");
  const [_grubsIcon, setGrubsIcon] = useState<string>("");
  const [_heraldIcon, setHeraldIcon] = useState<string>("");
  const [_atakhanIcons, setAtakhanIcons] = useState<string[]>([]);
  const [dragonIcons, setDragonIcons] = useState<{ [key: string]: string }>({});
  const [tournamentLogo, setTournamentLogo] = useState<string>("");
  const [orderLogo, setOrderLogo] = useState<string>("");
  const [chaosLogo, setChaosLogo] = useState<string>("");
  const [uiReady, setUiReady] = useState(false);
  const [chaosTeam, setChaosTeam] = useState<Team | null>(null);
  const [orderTeam, setOrderTeam] = useState<Team | null>(null);
  const [_currentGame, setCurrentGame] = useState<GameResult | null>(null);
  const initialPreloadDoneRef = useRef<boolean>(false);
  const seenChampionNamesRef = useRef<Set<string>>(new Set());
  const seenSpellNamesRef = useRef<Set<string>>(new Set());
  const [initialPreloadUrls, setInitialPreloadUrls] = useState<string[]>([]);
  const setupDoneRef = useRef<boolean>(false);
  const uiControlTriggeredRef = useRef<boolean>(false);
  // Camera settings are now used directly from team.cameras.players

  // Set game version and assets when tournament data is available
  useEffect(() => {
    const setupGameAssets = async (): Promise<void> => {
      if (!tournament || !match || setupDoneRef.current) return;

      try {
        setupDoneRef.current = true;

        const resolvedVersion = (await getLatestVersion()) ?? tournament.apiVersion;
        setGameVersion(resolvedVersion);

        setTournamentLogo(
          tournament.logo?.data || tournament.logo?.url || getDefaultAsset(resolvedVersion, "tournament.png")
        );

        await Promise.all([getChampions(), getSummonerSpells(), getItems()]);

        const ongoingGame = match.games?.find((game) => game.winner === "ongoing");
        setCurrentGame(ongoingGame || null);
        setOrderTeam(blueTeamData || null);
        setChaosTeam(redTeamData || null);
        setChampionsLoaded(true);
        setSummonerSpellsLoaded(true);
        setItemsLoaded(true);
        setOrderLogo(
          blueTeamData?.logo?.data || blueTeamData?.logo?.url || getDefaultAsset(resolvedVersion, "order.png")
        );
        setChaosLogo(
          redTeamData?.logo?.data || redTeamData?.logo?.url || getDefaultAsset(resolvedVersion, "chaos.png")
        );
        setGoldIcon(getScoreboardAsset(resolvedVersion, "gold.png"));
        setTowerIcon(getCommonAsset(resolvedVersion, "tower.png"));
        setBaronIcon(getBaronPitAsset(resolvedVersion, "baron.png"));
        setGrubsIcon(getBaronPitAsset(resolvedVersion, "grubs.png"));
        setHeraldIcon(getBaronPitAsset(resolvedVersion, "herald.png"));
        setAtakhanIcons([
          getAtakhanAsset(resolvedVersion, "atakhan_ruinous.png"),
          getAtakhanAsset(resolvedVersion, "atakhan_voracious.png")
        ]);
        setDragonIcons({
          chemtech: getDragonPitAsset(resolvedVersion, "chemtech.png"),
          cloud: getDragonPitAsset(resolvedVersion, "cloud.png"),
          elder: getDragonPitAsset(resolvedVersion, "elder.png"),
          hextech: getDragonPitAsset(resolvedVersion, "hextech.png"),
          infernal: getDragonPitAsset(resolvedVersion, "infernal.png"),
          mountain: getDragonPitAsset(resolvedVersion, "mountain.png"),
          ocean: getDragonPitAsset(resolvedVersion, "ocean.png")
        });
      } catch (error) {
        console.error("Failed to setup game assets:", error);
        setupDoneRef.current = false; // Reset on error so it can retry
      }
    };

    setupGameAssets();
  }, [tournament, match, blueTeamData, redTeamData]);

  // Fetch camera settings when teams are available
  // Camera settings are now available directly from team data - no need to fetch 

  const formatGameTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Player URLs are now directly available in team.cameras.players

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
      const tLogo = tournament?.logo?.data || tournament?.logo?.url || getDefaultAsset(gameVersion, "tournament.png");
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
    tournament?.logo,
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
    if (!initialPreloadDoneRef.current && initialPreloadUrls.length > 0 && initialImagesLoaded) {
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

    if (allDataReady && championsLoaded && summonerSpellsLoaded && itemsLoaded && initialPreloadDoneRef.current) {
      setUiReady(true);
    }
  }, [gameData, championsLoaded, summonerSpellsLoaded, itemsLoaded, initialPreloadUrls, initialImagesLoaded]);

  // Trigger LCU UI control: hide most UI and keep essentials when the display is ready
  useEffect(() => {
    if (!uiReady || uiControlTriggeredRef.current) return;
    uiControlTriggeredRef.current = true;
    (async (): Promise<void> => {
      try {
        await fetch("/api/v1/leagueclient/ui-control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "hideKeepEssentials" })
        });
      } catch (_err) {
      }
    })();
  }, [uiReady]);

  if (!uiReady || !match) {
    return <></>;
  }

  const blueTeamPlayers = gameData.allPlayers.filter((player) => player.team === "ORDER");
  const redTeamPlayers = gameData.allPlayers.filter((player) => player.team === "CHAOS");

  const orderGoldDiff =
    blueTeamPlayers.reduce((sum, player) => sum + (player.gold || 0), 0) -
    redTeamPlayers.reduce((sum, player) => sum + (player.gold || 0), 0);
  const chaosGoldDiff =
    redTeamPlayers.reduce((sum, player) => sum + (player.gold || 0), 0) -
    blueTeamPlayers.reduce((sum, player) => sum + (player.gold || 0), 0);

  const bound = bindLivePlayersToMatch(gameData.allPlayers, match);
  const _orderedBlue = bound.blue.filter(Boolean);
  const _orderedRed = bound.red.filter(Boolean);

  const firstBrick = gameData.events?.find((event) => event.EventName === "FirstBrick");
  
  // Determine which team got the first brick by checking KillerName
  const _firstBrickTeam = firstBrick?.KillerName 
    ? (blueTeamPlayers.some(player => player.summonerName === firstBrick.KillerName) ? "ORDER" : "CHAOS")
    : null;
  const dragonsKilled = gameData.events?.filter((event) => event.EventName === "DragonKill") || [];

  const blueTeamDragonsKilled = dragonsKilled.filter((event) => event.KillerName === blueTeamPlayers.find((player) => player.summonerName === event.KillerName)?.summonerName);
  const redTeamDragonsKilled = dragonsKilled.filter((event) => event.KillerName === redTeamPlayers.find((player) => player.summonerName === event.KillerName)?.summonerName);

  // Baron buff logic - check if baron was killed in the last 180 seconds (3 minutes)
  const currentGameTime = gameData.gameData.gameTime;
  const baronKills = gameData.events?.filter((event) => event.EventName === "BaronKill") || [];
  
  const blueTeamBaronKills = baronKills.filter((event) => 
    event.KillerName && blueTeamPlayers.some(player => player.summonerName === event.KillerName)
  );
  const redTeamBaronKills = baronKills.filter((event) => 
    event.KillerName && redTeamPlayers.some(player => player.summonerName === event.KillerName)
  );

  const blueTeamHasBaronBuff = blueTeamBaronKills.some((event) => 
    currentGameTime - event.EventTime <= 180
  );
  const redTeamHasBaronBuff = redTeamBaronKills.some((event) => 
    currentGameTime - event.EventTime <= 180
  );

  // Calculate team stats
  const blueTeamStats = {
    kills: blueTeamPlayers.reduce((sum, player) => sum + (player.scores?.kills || 0), 0),
    deaths: blueTeamPlayers.reduce((sum, player) => sum + (player.scores?.deaths || 0), 0),
    assists: blueTeamPlayers.reduce((sum, player) => sum + (player.scores?.assists || 0), 0),
    gold: blueTeamPlayers.reduce((sum, player) => sum + (player.gold || 0), 0),
    towers: gameData.events?.filter((event) => event.EventName === "TurretKilled" ).length || 0,
    dragonsSlained: {
      earth: blueTeamDragonsKilled.filter((event) => event.DragonType === "Earth").length,
      elder: blueTeamDragonsKilled.filter((event) => event.DragonType === "Elder").length,
      fire: blueTeamDragonsKilled.filter((event) => event.DragonType === "Fire").length,
      water: blueTeamDragonsKilled.filter((event) => event.DragonType === "Water").length,
      air: blueTeamDragonsKilled.filter((event) => event.DragonType === "Air").length,
      chemtech: blueTeamDragonsKilled.filter((event) => event.DragonType === "Chemtech").length,
      hextech: blueTeamDragonsKilled.filter((event) => event.DragonType === "Hextech").length,
    },
    baronsSlained: blueTeamBaronKills.length,
    hasBaronBuff: blueTeamHasBaronBuff,
    grubs: 0,
    heralds: 0,
    atakhan: 0,
    petal: 0,
  };

  const redTeamStats = {
    kills: redTeamPlayers.reduce((sum, player) => sum + (player.scores?.kills || 0), 0),
    deaths: redTeamPlayers.reduce((sum, player) => sum + (player.scores?.deaths || 0), 0),
    assists: redTeamPlayers.reduce((sum, player) => sum + (player.scores?.assists || 0), 0),
    gold: redTeamPlayers.reduce((sum, player) => sum + (player.gold || 0), 0),
    towers: gameData.events?.filter((event) => event.EventName === "TurretKilled" ).length || 0,
    dragonsSlained: {
      earth: redTeamDragonsKilled.filter((event) => event.DragonType === "Earth").length,
      elder: redTeamDragonsKilled.filter((event) => event.DragonType === "Elder").length,
      fire: redTeamDragonsKilled.filter((event) => event.DragonType === "Fire").length,
      water: redTeamDragonsKilled.filter((event) => event.DragonType === "Water").length,
      air: redTeamDragonsKilled.filter((event) => event.DragonType === "Air").length,
      chemtech: redTeamDragonsKilled.filter((event) => event.DragonType === "Chemtech").length,
      hextech: redTeamDragonsKilled.filter((event) => event.DragonType === "Hextech").length,
    },
    hasBaronBuff: redTeamHasBaronBuff,
  };



  const getResolutionStyles = (): {
    maxWidth: string;
  } => {
    switch (resolution) {
      case "WQHD":
        return {
          maxWidth: "max-w-[1000px]",
        };
      case "4K":
        return {
          maxWidth: "max-w-[1280px]",
        };
      default: // FHD
        return {
          maxWidth: "max-w-[936px]",
        };
    }
  };

  const resolutionStyles = getResolutionStyles();


  return (
    
    <div className="fixed inset-0 text-white font-sans">
      {/* Top Bar - Team Scores & Game Info */}
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        className="absolute top-0 left-0 right-0 h-20 w-[60%] mx-auto bg-black/90"
      >
        <div className="flex flex-col justify-between items-center w-full h-full px-8">
          <TopBar
            orderTeam={orderTeam}
            chaosTeam={chaosTeam}
            orderLogo={orderLogo}
            chaosLogo={chaosLogo}
            blueTeamStats={blueTeamStats}
            redTeamStats={redTeamStats}
            orderGoldDiff={orderGoldDiff}
            chaosGoldDiff={chaosGoldDiff}
            towerIcon={towerIcon}
            goldIcon={goldIcon}
            match={match}
            tournamentLogo={tournamentLogo}
          />
          <SubTopBar
            gameTime={gameData.gameData.gameTime}
            formatGameTime={formatGameTime}
            blueTeamDragons={blueTeamDragonsKilled}
            redTeamDragons={redTeamDragonsKilled}
            dragonIcons={dragonIcons}
          />
         </div>
      </motion.div>

      {/* Left Side Panel - Blue Team Players */}
      {/* <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.1 }}
        className="absolute left-0 top-20 w-64 h-full"
      >
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4 text-center">{orderTeam?.name || "ORDER"}</h3>
          <div className="space-y-3">
            {orderedBlue.map((bp, index) => {
              const p = bp.livePlayer;
              if (!p) return null;
              return (
                <motion.div
                  key={index}
                  initial={{ x: -40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.15 + index * 0.05 }}
                >
                  <PlayerCard player={p} teamColor="blue" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div> */}

      {/* Right Side Panel - Red Team Players */}
      {/* <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.1 }}
        className="absolute right-0 top-20 w-64 h-full"
      >
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4 text-center">{chaosTeam?.name || "CHAOS"}</h3>
          <div className="space-y-3">
            {orderedRed.map((bp, index) => {
              const p = bp.livePlayer;
              if (!p) return null;
              return (
                <motion.div
                  key={index}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.15 + index * 0.05 }}
                >
                  <PlayerCard player={p} teamColor="red" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div> */}

      {/* HUD && camera streams */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center">
        {/* left side camera stream */}
        {/* <div className="shrink-0" style={{ width: "220px", height: "250px" }}>
          <CameraStream
            players={blueTeamData?.cameras?.players || []}
            teamName={blueTeamData?.name || "ORDER"}
            width="100%"
            height="250px"
            showPlayerName={true}
            showRandomModeIndicator={false}
            enableKeyboardControls={false}
            objectFit="cover"
            enableRandomMode={true}
            playerNameSize="small"
            className="w-full"
          />
        </div> */}

        {/* center lane HUD */}
        <div className={`${resolutionStyles.maxWidth}`}>
          <LaneHud gameData={gameData} gameVersion={gameVersion} resolution={resolution} />
        </div>

        {/* right side camera stream */}
        {/* <div className="shrink-0" style={{ width: "220px", height: "250px" }}>
          <CameraStream
            players={redTeamData?.cameras?.players || []}
            teamName={redTeamData?.name || "CHAOS"}
            width="100%"
            height="250px"
            showPlayerName={true}
            showRandomModeIndicator={false}
            enableKeyboardControls={false}
            objectFit="cover"
            enableRandomMode={true}
            playerNameSize="small"
            className="w-full"
          />
        </div> */}
      </div>
      <MapBackground />

    </div>
  );
};
