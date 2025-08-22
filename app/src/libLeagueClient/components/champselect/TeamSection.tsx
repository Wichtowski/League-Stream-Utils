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
  };
  roleIcons: Record<string, string>;
  onRegisterImages?: (urls: string[]) => void;
}

const TeamSection: React.FC<TeamSectionProps> = ({ 
  team, 
  teamColor, 
  currentPhase, 
  hoverState, 
  tournamentData, 
  roleIcons,
  onRegisterImages 
}) => {
  // Register images with parent component
  useEffect(() => {
    if (onRegisterImages) {
      const urls: string[] = [];
      
      // Add role icons
      Object.values(roleIcons).forEach(icon => {
        if (icon) urls.push(icon);
      });
      
      // Add champion images from team players
      team.forEach(player => {
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

  // Create a full team array with placeholder players if needed
  const fullTeam = [...team];
  while (fullTeam.length < 5) {
    fullTeam.push({
      cellId: -fullTeam.length, // Negative to avoid conflicts with real cellIds
      championId: 0,
      summonerId: 0,
      summonerName: `Player ${fullTeam.length + 1}`,
      puuid: "",
      isBot: false,
      isActingNow: false,
      pickTurn: 0,
      banTurn: 0,
      team: teamColor === "blue" ? 100 : 200
    } as EnhancedChampSelectPlayer);
  }

  return (
    <div className="w-full">
      <div className="flex flex-row items-end w-full max-h-screen">
        {fullTeam.map((player, index) => (
          <PlayerSlot
            key={player.cellId}
            player={player}
            index={index}
            teamColor={tournamentData?.blueTeam?.colors?.primary || teamColor}
            _currentPhase={currentPhase}
            hoverState={hoverState}
            roleIcons={roleIcons}
            onRegisterImages={onRegisterImages}
          />
        ))}
      </div>
    </div>
  );
};

export { TeamSection };
