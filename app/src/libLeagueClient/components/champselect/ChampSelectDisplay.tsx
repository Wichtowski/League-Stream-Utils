"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { EnhancedChampSelectSession } from "@lib/types";
import type { Match } from "@lib/types/match";
import type { Tournament } from "@lib/types/tournament";
import { TournamentHeader, TeamSection, MatchInfo, TeamBans } from "./";
import { TimeBar } from "./TimeBar";
import { MockControlPanel } from "./MockControlPanel";
import { ChampSelectLayout } from "./ChampSelectLayout";
import { FearlessDraftBans } from "./FearlessDraftBans";
import { blueColor, redColor } from "@lib/services/common/constants";
import { getChampionCenteredSplashImage, getChampionSquareImage } from "../common";
import { useImagePreload } from "@lib/hooks/useImagePreload";

interface ChampSelectDisplayProps {
  data: EnhancedChampSelectSession;
  match?: Match;
  tournament?: Tournament;
  roleIcons: Record<string, string>;
  banPlaceholder: string;
  isOverlay?: boolean;
  showControls?: boolean;
  onToggleControls?: () => void;
}

const ChampSelectDisplayComponent: React.FC<ChampSelectDisplayProps> = ({
  data,
  match,
  tournament,
  roleIcons,
  banPlaceholder,
  isOverlay = false,
  showControls = false,
  onToggleControls
}) => {
  const { myTeam, theirTeam, tournamentData, bans, timer, hoverState } = data;
  const [uiReady, setUiReady] = useState(false);
  const initialPreloadDoneRef = useRef<boolean>(false);
  const [initialPreloadUrls, setInitialPreloadUrls] = useState<string[]>([]);
  const [childImageUrls, setChildImageUrls] = useState<string[]>([]);
  const [childImagesLoaded, setChildImagesLoaded] = useState(false);

  // Use provided match/tournament data or fall back to tournamentData from the session
  const effectiveTournamentData = tournamentData || (match && tournament ? ({
    tournament: {
      id: tournament.id,
      name: tournament.name,
      logoUrl: typeof tournament.logo === "string" ? tournament.logo : tournament.logo.data || tournament.logo.url || ""
    },
    blueTeam: match.blueTeam,
    redTeam: match.redTeam
  } as unknown as typeof tournamentData) : undefined);

  // Helper function to get team color
  const getTeamColor = (team: { colors?: { primary?: string } } | undefined, fallback: string): string => {
    return team?.colors?.primary || fallback;
  };

  // Helper function to get team logo as string
  const getTeamLogo = (team: { logo: string | { data?: string; url?: string } }): string => {
    if (typeof team.logo === "string") return team.logo;
    return team.logo?.data || team.logo?.url || "";
  };

  // Callback for child components to register their required images
  const registerChildImages = useCallback((urls: string[]) => {
    setChildImageUrls(prev => {
      const newUrls = [...prev, ...urls];
      return Array.from(new Set(newUrls));
    });
  }, []);

  // Compute initial preload set once when data is ready
  useEffect(() => {
    if (!initialPreloadDoneRef.current && data) {
      const urls: string[] = [];
      
      // Static UI assets
      if (banPlaceholder) urls.push(banPlaceholder);
      
      // Role icons
      Object.values(roleIcons).forEach(icon => {
        if (icon) urls.push(icon);
      });

      // Champion images from data
      const allPlayers = [...myTeam, ...theirTeam];
      allPlayers.forEach(player => {
        if (player.championId) {
          const splashImage = getChampionCenteredSplashImage(player.championId);
          const squareImage = getChampionSquareImage(player.championId);
          if (splashImage) urls.push(splashImage);
          if (squareImage) urls.push(squareImage);
        }
      });

      // Ban images
      const allBans = [...bans.myTeamBans, ...bans.theirTeamBans];
      allBans.forEach(championId => {
        if (championId) {
          const squareImage = getChampionSquareImage(championId);
          if (squareImage) urls.push(squareImage);
        }
      });

      // Tournament and team logos
      if (effectiveTournamentData?.blueTeam?.logo) {
        const blueLogo = getTeamLogo(effectiveTournamentData.blueTeam);
        if (blueLogo) urls.push(blueLogo);
      }
      
      if (effectiveTournamentData?.redTeam?.logo) {
        const redLogo = getTeamLogo(effectiveTournamentData.redTeam);
        if (redLogo) urls.push(redLogo);
      }

      if (effectiveTournamentData?.tournament?.logoUrl) {
        urls.push(effectiveTournamentData.tournament.logoUrl);
      }

      // Additional images that might be used by child components
      // MatchInfo component uses a hardcoded tournament logo path
      urls.push("/assets/VML-Nexus-Cup-logo.png");
      
      // Default images that might be used
      urls.push("/assets/default/player.png");
      urls.push("/assets/default-team-logo.png");
      urls.push("/assets/default-coach.png");
      urls.push("/assets/default/default_ban_placeholder.svg");

      setInitialPreloadUrls(Array.from(new Set(urls)));
    }
  }, [data, banPlaceholder, roleIcons, myTeam, theirTeam, bans, effectiveTournamentData]);

  const { loaded: initialImagesLoaded } = useImagePreload(initialPreloadUrls);
  const { loaded: childImagesLoadedStatus } = useImagePreload(childImageUrls);

  useEffect(() => {
    if (!initialPreloadDoneRef.current && initialPreloadUrls.length > 0 && initialImagesLoaded) {
      initialPreloadDoneRef.current = true;
    }

    if (childImageUrls.length > 0 && childImagesLoadedStatus) {
      setChildImagesLoaded(true);
    } else if (childImageUrls.length === 0) {
      setChildImagesLoaded(true);
    }

    if (data && initialPreloadDoneRef.current && childImagesLoaded) {
      setUiReady(true);
    }
  }, [data, initialPreloadUrls, initialImagesLoaded, childImageUrls, childImagesLoadedStatus, childImagesLoaded]);

  if (!uiReady) {
    return <></>;
  }

  const content = (
    <>
      <TournamentHeader tournamentData={effectiveTournamentData} timer={timer} />

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
        above={
          <>
            <div className="flex justify-between mb-2 items-center">
              <TeamBans
                bans={bans.myTeamBans}
                banPlaceholder={banPlaceholder}
                teamColor={getTeamColor(effectiveTournamentData?.blueTeam, blueColor)}
                isFearlessDraft={data.isFearlessDraft}
                usedChampions={data.usedChampions}
                hoverState={hoverState}
                onRegisterImages={registerChildImages}
              />
              {data.isFearlessDraft && data.fearlessBans && (
                <FearlessDraftBans
                  bans={data.fearlessBans}
                  customTeamColors={{
                    blueTeam: getTeamColor(effectiveTournamentData?.blueTeam, blueColor),
                    redTeam: getTeamColor(effectiveTournamentData?.redTeam, redColor)
                  }}
                  onRegisterImages={registerChildImages}
                />
              )}
              <TeamBans
                bans={bans.theirTeamBans}
                teamColor={getTeamColor(effectiveTournamentData?.redTeam, redColor)}
                isFearlessDraft={data.isFearlessDraft}
                usedChampions={data.usedChampions}
                hoverState={hoverState}
                banPlaceholder={banPlaceholder}
                onRegisterImages={registerChildImages}
              />
            </div>
            <TimeBar timer={timer} tournamentData={effectiveTournamentData} hoverState={hoverState} />
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
          />
        }
        center={
          effectiveTournamentData ? (
            <MatchInfo
              blueTeam={{
                name: effectiveTournamentData.blueTeam.name,
                logo: getTeamLogo(effectiveTournamentData.blueTeam)
              }}
              redTeam={{
                name: effectiveTournamentData.redTeam.name,
                logo: getTeamLogo(effectiveTournamentData.redTeam)
              }}
              tournamentLogo={effectiveTournamentData.tournament?.logoUrl || ""}
              timer={timer.adjustedTimeLeftInPhase}
              maxTimer={timer.totalTimeInPhase}
              isBO3={true}
              blueScore={1}
              redScore={0}
              onRegisterImages={registerChildImages}
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
          />
        }
      />
    </>
  );

  if (isOverlay) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-transparent">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="fixed bottom-0 left-0 w-full z-10">{content}</div>

        {onToggleControls && <MockControlPanel isVisible={showControls} onToggle={onToggleControls} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-transparent">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Dynamic Mock Demo</h1>
          <p className="text-gray-300 text-lg">
            This demo showcases the dynamic pick/ban mock system with real-time updates
          </p>
        </div>
        <div className="w-full">{content}</div>
      </div>

      {onToggleControls && <MockControlPanel isVisible={showControls} onToggle={onToggleControls} />}
    </div>
  );
};

const ChampSelectDisplay = React.memo(ChampSelectDisplayComponent);

export { ChampSelectDisplay };
