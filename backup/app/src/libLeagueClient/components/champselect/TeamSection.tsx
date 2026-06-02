"use client";

import React, { useEffect } from "react";
import type { EnhancedChampSelectPlayer } from "@lib/types";
import { PlayerSlot } from "./PlayerSlot";
import { TeamColors } from "@lib/types/common";
import { getChampionCenteredSplashImage, getChampionSquareImage } from "../common";

interface TeamSectionProps {
  team: EnhancedChampSelectPlayer[];
  teamColor: "blue" | "red" | string;
  bans: {
    blueTeamBans: number[];
    redTeamBans: number[];
  };
  currentPhase?: string;
  hoverState?: {
    isHovering: boolean;
    isSelecting: boolean;
    hoveredChampionId: number | null;
    currentTeam: "blue" | "red" | null;
    currentActionType: "pick" | "ban" | null;
    currentTurn?: number;
  };
  tournamentData?: {
    blueTeam?: { colors?: TeamColors };
    redTeam?: { colors?: TeamColors };
    tournament?: {
      _id: string;
    };
  };
  roleIcons: Record<string, string>;
  onRegisterImages?: (urls: string[]) => void;
  cardsAnimated?: boolean;
  teamSide: "left" | "right";
}

const TeamSection: React.FC<TeamSectionProps> = ({
  team,
  teamColor,
  currentPhase,
  hoverState,
  tournamentData,
  roleIcons,
  onRegisterImages,
  cardsAnimated,
  teamSide
}) => {
  // Register images with parent component
  useEffect(() => {
    if (onRegisterImages) {
      const urls: string[] = [];

      // Add role icons
      Object.values(roleIcons).forEach((icon) => {
        if (icon) urls.push(icon);
      });

      // Add champion images from team players
      team.forEach((player) => {
        if (player.championId) {
          const splashImage = getChampionCenteredSplashImage(player.championId);
          const squareImage = getChampionSquareImage(player.championId);
          if (splashImage) urls.push(splashImage);
          if (squareImage) urls.push(squareImage);
        }
      });

      onRegisterImages(urls);
    }
  }, [team, roleIcons, onRegisterImages]);

  const roleToIndex: Record<string, number> = {
    TOP: 0,
    JUNGLE: 1,
    MID: 2,
    BOTTOM: 3,
    SUPPORT: 4
  };

  const orderedTeam: Array<EnhancedChampSelectPlayer | null> = new Array(5).fill(null);

  team.forEach((p) => {
    const idx = p.role ? roleToIndex[p.role] : undefined;
    if (typeof idx === "number" && idx >= 0 && idx < 5) {
      if (!orderedTeam[idx]) orderedTeam[idx] = p;
    }
  });

  team.forEach((p) => {
    if (!p.role) {
      for (let i = 0; i < 5; i++) {
        if (!orderedTeam[i]) {
          orderedTeam[i] = p;
          break;
        }
      }
    }
  });

  const fullTeam: EnhancedChampSelectPlayer[] = orderedTeam.map((p, i) => {
    if (p) return p;
    return {
      cellId: -(i + 1),
      championId: 0,
      summonerId: 0,
      summonerName: `Player ${i + 1}`,
      puuid: "",
      isBot: false,
      isActingNow: false,
      pickTurn: 0,
      banTurn: 0,
      team: teamColor === "blue" ? 100 : 200
    } as EnhancedChampSelectPlayer;
  });

  return (
    <div className="w-full">
      <div className="flex flex-row items-end w-full max-h-screen">
        {fullTeam.map((player, index) => (
          <div key={player.cellId} className="w-full flex-1">
            <PlayerSlot
              player={player}
              index={index}
              teamColor={tournamentData?.blueTeam?.colors?.primary || teamColor}
              _currentPhase={currentPhase}
              hoverState={hoverState}
              roleIcons={roleIcons}
              onRegisterImages={onRegisterImages}
              cardsAnimated={cardsAnimated}
              teamSide={teamSide}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export { TeamSection };
