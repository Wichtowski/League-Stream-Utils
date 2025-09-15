"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { PlayerRole } from "@lib/types/common";
import type { EnhancedChampSelectSession, Team } from "@lib/types";
import type { Match } from "@lib/types/match";
import type { Tournament } from "@lib/types/tournament";
import {
  // TournamentHeader,
  TeamSection,
  MatchInfo,
  TeamBans
} from "./";
import { TimeBar } from "./TimeBar";
import { MockControlPanel } from "./MockControlPanel";
import { ChampSelectLayout } from "./ChampSelectLayout";
import { FearlessDraftBans } from "./FearlessDraftBans";
import { blueColor, redColor } from "@lib/services/common/constants";
import { getChampionCenteredSplashImage, getChampionSquareImage } from "../common";
import { useImagePreload } from "@lib/hooks/useImagePreload";
import { getItems } from "@lib/items";
import { getChampions } from "@lib/champions";
import { getSummonerSpells } from "@lib/summoner-spells";
import { getTournamentById } from "@/libTournament/database/tournament";
import { getMatchById } from "@/libTournament/database/match";
import { getTeamById } from "@libTeam/database";

interface ChampSelectDisplayProps {
  data: EnhancedChampSelectSession;
  match: Match;
  teams?: Team[];
  tournament: Tournament;
  roleIcons: Record<string, string>;
  banPlaceholder: string;
  showControls?: boolean;
  onToggleControls?: () => void;
}

const ChampSelectDisplayComponent: React.FC<ChampSelectDisplayProps> = ({
  data,
  match,
  teams,
  tournament,
  roleIcons,
  banPlaceholder,
  showControls = false,
  onToggleControls
}) => {
  const { myTeam, theirTeam, tournamentData, bans, timer, hoverState } = data;
  const [uiReady, setUiReady] = useState(false);
  const [loadedTournament, setLoadedTournament] = useState<Tournament | null>(null);
  const [loadedMatch, setLoadedMatch] = useState<Match | null>(null);
  const [_loadedTeams, setLoadedTeams] = useState<Team[]>([]);
  const initialPreloadDoneRef = useRef<boolean>(false);
  const [childImageUrls, setChildImageUrls] = useState<string[]>([]);
  const [childImagesLoaded, setChildImagesLoaded] = useState(false);
  const preloadedUrlsRef = useRef<Set<string>>(new Set());

  // Animation states
  const [mainUIAnimated, setMainUIAnimated] = useState(false);
  const [cardsAnimated, setCardsAnimated] = useState(false);
  const [bansAnimated, setBansAnimated] = useState(false);
  const [showFearlessBans, setShowFearlessBans] = useState(false);
  const [fearlessActive, setFearlessActive] = useState(false);
  const [fearlessBansComputed, setFearlessBansComputed] = useState<{
    blue: { championId: number; role: PlayerRole }[];
    red: { championId: number; role: PlayerRole }[];
  }>({ blue: [], red: [] });
  const [centerAnimated, setCenterAnimated] = useState(false);

  // Load tournament and match data when IDs are provided
  useEffect(() => {
    const loadData = async () => {
      // Skip database operations if we have mock data provided directly
      if (tournament._id || match._id) {
        return;
      }

      if (!match._id) return;

      try {
        const promises: Promise<void>[] = [];

        if (tournament._id) {
          promises.push(getTournamentById(tournament._id).then(setLoadedTournament));
        }

        if (match._id) {
          promises.push(getMatchById(match._id).then(setLoadedMatch));
        }

        await Promise.all(promises);
      } catch (error) {
        console.error("Failed to load tournament or match data:", error);
      }
    };

    loadData();
  }, [match._id, tournament, match]);

  // Load teams when match data is available
  useEffect(() => {
    const loadTeams = async () => {
      // Skip database operations if we have mock data provided directly
      if (teams) {
        return;
      }

      if (!loadedMatch) return;

      try {
        const [blueTeam, redTeam] = await Promise.all([
          getTeamById(loadedMatch.blueTeamId),
          getTeamById(loadedMatch.redTeamId)
        ]);

        if (blueTeam && redTeam) {
          setLoadedTeams([blueTeam, redTeam]);
        }
      } catch (error) {
        console.error("Failed to load team data:", error);
      }
    };

    loadTeams();
  }, [loadedMatch, teams]);

  // Compute fearless state and bans based on match.games[].championsPlayed
  useEffect(() => {
    const m = match || loadedMatch;
    if (!m || !m.games || m.games.length === 0) {
      setFearlessActive(false);
      setFearlessBansComputed({ blue: [], red: [] });
      return;
    }

    const anyChampionsPlayed = m.games.some((g) => g && g.championsPlayed && Object.keys(g.championsPlayed || {}).length > 0);
    setFearlessActive(anyChampionsPlayed);

    if (!anyChampionsPlayed) {
      setFearlessBansComputed({ blue: [], red: [] });
      return;
    }

    const roleOrder: PlayerRole[] = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"];

    // Build playerId -> role maps using provided teams or loaded ones
    const findTeamById = (teamId?: string): Team | undefined => {
      if (!teamId) return undefined;
      if (teams && teams.length) {
        return teams.find((t) => t._id === teamId);
      }
      if (_loadedTeams && _loadedTeams.length) {
        return _loadedTeams.find((t) => t._id === teamId);
      }
      return undefined;
    };

    const blueTeamObj = findTeamById(m.blueTeamId);
    const redTeamObj = findTeamById(m.redTeamId);

    const toRole = (playerId: string, side: "blue" | "red"): PlayerRole | undefined => {
      const team = side === "blue" ? blueTeamObj : redTeamObj;
      const allPlayers: Array<{ _id: string; role?: PlayerRole }> = [
        ...((team?.players?.main as Array<{ _id: string; role?: PlayerRole }>) || []),
        ...((team?.players?.substitutes as Array<{ _id: string; role?: PlayerRole }>) || [])
      ];
      const player = allPlayers.find((p) => p._id === playerId);
      return player?.role;
    };

    const blueUsed: { championId: number; role: PlayerRole }[] = [];
    const redUsed: { championId: number; role: PlayerRole }[] = [];
    const seenBlue = new Set<number>();
    const seenRed = new Set<number>();

    for (const g of m.games) {
      if (!g.championsPlayed) continue;
      const blueTeamId = m.blueTeamId;
      const redTeamId = m.redTeamId;

      const blueMap = g.championsPlayed[blueTeamId] || {};
      for (const [playerId, champId] of Object.entries(blueMap)) {
        const cid = Number(champId);
        if (!seenBlue.has(cid)) {
          seenBlue.add(cid);
          const role = toRole(playerId, "blue") || roleOrder[blueUsed.length % 5];
          blueUsed.push({ championId: cid, role });
        }
      }

      const redMap = g.championsPlayed[redTeamId] || {};
      for (const [playerId, champId] of Object.entries(redMap)) {
        const cid = Number(champId);
        if (!seenRed.has(cid)) {
          seenRed.add(cid);
          const role = toRole(playerId, "red") || roleOrder[redUsed.length % 5];
          redUsed.push({ championId: cid, role });
        }
      }
    }

    setFearlessBansComputed({ blue: blueUsed, red: redUsed });
  }, [match, loadedMatch, teams, _loadedTeams]);

  // Use provided data or loaded data
  const effectiveTournament = tournament || loadedTournament;
  const effectiveMatch = match || loadedMatch;

  useEffect(() => {
    const loadAssets = async () => {
      await getChampions();
      await getSummonerSpells();
      await getItems();
    };
    loadAssets().catch(console.error);
  }, []);

  // Animation sequence coordination
  useEffect(() => {
    if (!childImagesLoaded) return;

    // Step 1: Start main UI animation (middle portion goes up)
    setMainUIAnimated(true);

    // Step 2: After main UI animation, start card animations
    const cardAnimationTimer = setTimeout(() => {
      setCardsAnimated(true);
    }, 800); // Wait for main UI animation to complete

    // Step 3: After cards are animated, start bans animations
    const bansTimer = setTimeout(() => {
      setBansAnimated(true);
    }, 1600); // Wait for all cards to animate

    // Step 4: After bans are animated, show fearless bans
    const fearlessTimer = setTimeout(() => {
      setShowFearlessBans(true);
    }, 2200); // Wait for all bans to animate

    return () => {
      clearTimeout(cardAnimationTimer);
      clearTimeout(bansTimer);
      clearTimeout(fearlessTimer);
    };
  }, [childImagesLoaded]);

  // Use provided match/tournament data or fall back to tournamentData from the session
  const effectiveTournamentData = useMemo(() => {
    // If we have tournamentData from the session, use it
    if (tournamentData) {
      return tournamentData;
    }

    // If we have teams and match provided directly, create tournament data
    if (teams && match && tournament) {
      // Find the actual blue and red teams by their IDs from the match
      const actualBlueTeam = teams.find((team) => team._id === match.blueTeamId);
      const actualRedTeam = teams.find((team) => team._id === match.redTeamId);

      if (actualBlueTeam && actualRedTeam) {
        return {
          tournament: {
            id: tournament._id,
            name: tournament.name,
            logo: tournament.logo
          },
          blueTeam: actualBlueTeam,
          redTeam: actualRedTeam
        };
      }
    }

    // Fallback to creating from match/tournament if available
    if (effectiveMatch && effectiveTournament) {
      return {
        tournament: {
          id: effectiveTournament._id,
          name: effectiveTournament.name,
          logo: effectiveTournament.logo
        },
        blueTeam: effectiveMatch.blueTeamId,
        redTeam: effectiveMatch.redTeamId
      } as unknown as typeof tournamentData;
    }

    return undefined;
  }, [tournamentData, teams, match, tournament, effectiveMatch, effectiveTournament]);

  // Helper function to get team color
  const getTeamColor = (team: { colors?: { primary?: string } } | undefined, fallback: string): string => {
    return team?.colors?.primary || fallback;
  };

  // Helper function to get team logo as string
  const getTeamLogo = (team: { logo?: string | { data?: string; url?: string; type?: string } }): string => {
    if (!team?.logo) return "";
    if (typeof team.logo === "string") return team.logo;
    if (team.logo.type === "upload" && team.logo.data) return team.logo.data;
    if (team.logo.type === "url" && team.logo.url) return team.logo.url;
    return team.logo.data || team.logo.url || "";
  };

  // Callback for child components to register their required images
  const registerChildImages = useCallback((urls: string[]) => {
    setChildImageUrls((prev) => {
      const newUrls = [...prev, ...urls];
      return Array.from(new Set(newUrls));
    });
  }, []);

  // Memoize the initial preload URLs to prevent unnecessary recalculations
  const initialPreloadUrls = useMemo(() => {
    if (!data || initialPreloadDoneRef.current) return [];

    const urls: string[] = [];

    // Static UI assets
    if (banPlaceholder) urls.push(banPlaceholder);

    // Role icons
    Object.values(roleIcons).forEach((icon) => {
      if (icon) urls.push(icon);
    });

    // Champion images from data - only depend on champion IDs, not entire player objects
    const championIds = [
      ...myTeam.map((p) => p.championId).filter(Boolean),
      ...theirTeam.map((p) => p.championId).filter(Boolean)
    ];
    championIds.forEach((championId) => {
      const splashImage = getChampionCenteredSplashImage(championId);
      const squareImage = getChampionSquareImage(championId);
      if (splashImage && !preloadedUrlsRef.current.has(splashImage)) urls.push(splashImage);
      if (squareImage && !preloadedUrlsRef.current.has(squareImage)) urls.push(squareImage);
    });

    // Ban images - only depend on champion IDs, not entire ban objects
    const banChampionIds = [...bans.myTeamBans.filter(Boolean), ...bans.theirTeamBans.filter(Boolean)];
    banChampionIds.forEach((championId) => {
      const squareImage = getChampionSquareImage(championId);
      if (squareImage && !preloadedUrlsRef.current.has(squareImage)) urls.push(squareImage);
    });

    // Tournament and team logos - only depend on logo strings, not entire team objects
    if (effectiveTournamentData?.blueTeam?.logo) {
      const blueLogo = getTeamLogo(effectiveTournamentData.blueTeam);
      if (blueLogo && !preloadedUrlsRef.current.has(blueLogo)) urls.push(blueLogo);
    }

    if (effectiveTournamentData?.redTeam?.logo) {
      const redLogo = getTeamLogo(effectiveTournamentData.redTeam);
      if (redLogo && !preloadedUrlsRef.current.has(redLogo)) urls.push(redLogo);
    }

    // Get tournament logo from the tournament object
    if (effectiveTournamentData?.tournament?.logo) {
      const tournamentLogo =
        typeof effectiveTournamentData.tournament.logo === "string"
          ? effectiveTournamentData.tournament.logo
          : effectiveTournamentData.tournament.logo.data || effectiveTournamentData.tournament.logo.url || "";
      if (tournamentLogo && !preloadedUrlsRef.current.has(tournamentLogo)) urls.push(tournamentLogo);
    }

    return Array.from(new Set(urls));
  }, [
    banPlaceholder,
    roleIcons,
    data,
    myTeam,
    theirTeam,
    bans.myTeamBans,
    bans.theirTeamBans,
    effectiveTournamentData?.blueTeam,
    effectiveTournamentData?.redTeam,
    effectiveTournamentData?.tournament?.logo
  ]);

  // Compute initial preload set once when data is ready
  useEffect(() => {
    if (!initialPreloadDoneRef.current && data) {
      // No need to set state since we're using the memoized value directly
      initialPreloadDoneRef.current = true;
    }
  }, [data]);

  const { loaded: initialImagesLoaded } = useImagePreload(initialPreloadDoneRef.current ? [] : initialPreloadUrls);
  const { loaded: childImagesLoadedStatus } = useImagePreload(initialPreloadDoneRef.current ? [] : childImageUrls);

  // Track which URLs have been preloaded to prevent re-preloading
  useEffect(() => {
    if (initialPreloadUrls.length > 0) {
      initialPreloadUrls.forEach((url) => preloadedUrlsRef.current.add(url));
    }
  }, [initialPreloadUrls]);

  useEffect(() => {
    if (!initialPreloadDoneRef.current && initialPreloadUrls.length > 0 && initialImagesLoaded) {
      initialPreloadDoneRef.current = true;
      // Mark all initial URLs as preloaded to prevent future preloading
      initialPreloadUrls.forEach((url) => preloadedUrlsRef.current.add(url));
    }

    if (childImageUrls.length > 0 && childImagesLoadedStatus) {
      setChildImagesLoaded(true);
    } else if (childImageUrls.length === 0) {
      setChildImagesLoaded(true);
    }

    if (data && initialPreloadDoneRef.current && childImagesLoaded) {
      setUiReady(true);

      // Start animation sequence
      setTimeout(() => {
        setCenterAnimated(true);
      }, 100);

      setTimeout(() => {
        setCardsAnimated(true);
      }, 600);

      setTimeout(() => {
        setBansAnimated(true);
      }, 1200);
    }
  }, [data, initialPreloadUrls, initialImagesLoaded, childImageUrls, childImagesLoadedStatus, childImagesLoaded]);

  if (!uiReady) {
    return <></>;
  }

  const content = (
    <>
      {/* <TournamentHeader tournamentData={effectiveTournamentData} timer={timer} /> */}

      {/* Coaches */}
      <div className="flex justify-between mb-4">
        {effectiveTournamentData?.blueTeam?.coach && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">COACH</div>
              <div className="font-semibold text-white">{effectiveTournamentData.blueTeam.coach.name}</div>
            </div>
          </div>
        )}
        {effectiveTournamentData?.redTeam?.coach && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">COACH</div>
              <div className="font-semibold text-white">{effectiveTournamentData.redTeam.coach.name}</div>
            </div>
          </div>
        )}
      </div>

      <ChampSelectLayout
        mainUIAnimated={mainUIAnimated}
        _cardsAnimated={cardsAnimated}
        above={
          <>
            {/* Only show bans if champion select is not finalized */}
            {data.phase !== "FINALIZATION" && data.phase !== "GAME_STARTING" && data.phase !== "completed" && data.phase !== "finalization" && (
              <div className="flex justify-between items-center items-end">
                <TeamBans
                  bans={bans.myTeamBans}
                  banPlaceholder={banPlaceholder}
                  teamColor={getTeamColor(effectiveTournamentData?.blueTeam, blueColor)}
                  isFearlessDraft={fearlessActive}
                  usedChampions={data.usedChampions}
                  hoverState={hoverState}
                  onRegisterImages={registerChildImages}
                  bansAnimated={bansAnimated}
                  teamSide="left"
                />
                {fearlessActive && (
                  <FearlessDraftBans
                    bans={fearlessBansComputed}
                    customTeamColors={{
                      blueTeam: getTeamColor(effectiveTournamentData?.blueTeam, blueColor),
                      redTeam: getTeamColor(effectiveTournamentData?.redTeam, redColor)
                    }}
                    onRegisterImages={registerChildImages}
                    showFearlessBans={showFearlessBans}
                  />
                )}
                <TeamBans
                  bans={bans.theirTeamBans}
                  teamColor={getTeamColor(effectiveTournamentData?.redTeam, redColor)}
                  isFearlessDraft={fearlessActive}
                  usedChampions={data.usedChampions}
                  hoverState={hoverState}
                  banPlaceholder={banPlaceholder}
                  onRegisterImages={registerChildImages}
                  bansAnimated={bansAnimated}
                  teamSide="right"
                />
              </div>
            )}
            <TimeBar
              timer={timer}
              tournamentData={effectiveTournamentData}
              hoverState={hoverState}
              animated={bansAnimated}
            />
          </>
        }
        left={
          <TeamSection
            team={myTeam}
            bans={{
              blueTeamBans: bans.myTeamBans,
              redTeamBans: bans.theirTeamBans
            }}
            teamColor={getTeamColor(effectiveTournamentData?.blueTeam, blueColor)}
            currentPhase={data.phase}
            hoverState={hoverState}
            roleIcons={roleIcons}
            onRegisterImages={registerChildImages}
            cardsAnimated={cardsAnimated}
            teamSide="left"
          />
        }
        center={
          effectiveTournamentData ? (
            <MatchInfo
              blueTeam={{
                name: effectiveTournamentData.blueTeam.name,
                logo: getTeamLogo(effectiveTournamentData.blueTeam),
                id: effectiveTournamentData.blueTeam._id
              }}
              redTeam={{
                name: effectiveTournamentData.redTeam.name,
                logo: getTeamLogo(effectiveTournamentData.redTeam),
                id: effectiveTournamentData.redTeam._id
              }}
              tournamentLogo={(() => {
                const logo = effectiveTournamentData.tournament?.logo;
                if (typeof logo === "string") return logo;
                if (logo?.type === "upload" && logo.data) return logo.data;
                if (logo?.type === "url" && logo.url) return logo.url;
                return "";
              })()}
              matchFormat={match?.format || "BO5"}
              games={match?.games}
              currentGameSides={(() => {
                if (!match?.games || match.games.length === 0) {
                  // Default side assignment for first game
                  return {
                    blueTeamId: effectiveTournamentData.blueTeam._id,
                    redTeamId: effectiveTournamentData.redTeam._id
                  };
                }

                // Get the most recent game's side assignment
                const latestGame = match.games[match.games.length - 1];
                return {
                  blueTeamId: latestGame.blueTeam,
                  redTeamId: latestGame.redTeam
                };
              })()}
              onRegisterImages={registerChildImages}
              animated={centerAnimated}
              patchVersion={tournament.patchVersion}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="text-2xl font-bold mb-2">Champion Select</div>
              </div>
            </div>
          )
        }
        right={
          <TeamSection
            team={theirTeam}
            bans={{
              blueTeamBans: bans.myTeamBans,
              redTeamBans: bans.theirTeamBans
            }}
            teamColor={getTeamColor(effectiveTournamentData?.redTeam, redColor)}
            currentPhase={data.phase}
            hoverState={hoverState}
            roleIcons={roleIcons}
            onRegisterImages={registerChildImages}
            cardsAnimated={cardsAnimated}
            teamSide="right"
          />
        }
      />
    </>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <div className="absolute inset-0"></div>
      <div className="relative z-10">
        <div className="w-full">{content}</div>
      </div>

      {onToggleControls && <MockControlPanel isVisible={showControls} onToggle={onToggleControls} />}
    </div>
  );
};

const ChampSelectDisplay = React.memo(ChampSelectDisplayComponent);

export { ChampSelectDisplay };
