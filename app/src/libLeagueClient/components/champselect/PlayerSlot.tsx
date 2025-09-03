"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { EnhancedChampSelectPlayer } from "@lib/types";
import { getChampionName, getChampionCenteredSplashImage } from "../common";

// Pick and ban phase configuration - 20 turns total
const PICK_BAN_ORDER: Array<{
  phase: string;
  team: "blue" | "red";
  type: "pick" | "ban";
}> = [
  // Ban phase 1 (6 bans)
  { phase: "BAN_1", team: "blue", type: "ban" },
  { phase: "BAN_1", team: "red", type: "ban" },
  { phase: "BAN_1", team: "blue", type: "ban" },
  { phase: "BAN_1", team: "red", type: "ban" },
  { phase: "BAN_1", team: "blue", type: "ban" },
  { phase: "BAN_1", team: "red", type: "ban" },

  // Pick phase 1 (6 picks)
  { phase: "PICK_1", team: "blue", type: "pick" },
  { phase: "PICK_1", team: "red", type: "pick" },
  { phase: "PICK_1", team: "red", type: "pick" },
  { phase: "PICK_1", team: "blue", type: "pick" },
  { phase: "PICK_1", team: "blue", type: "pick" },
  { phase: "PICK_1", team: "red", type: "pick" },

  // Ban phase 2 (4 bans)
  { phase: "BAN_2", team: "red", type: "ban" },
  { phase: "BAN_2", team: "blue", type: "ban" },
  { phase: "BAN_2", team: "red", type: "ban" },
  { phase: "BAN_2", team: "blue", type: "ban" },

  // Pick phase 2 (4 picks)
  { phase: "PICK_2", team: "red", type: "pick" },
  { phase: "PICK_2", team: "blue", type: "pick" },
  { phase: "PICK_2", team: "blue", type: "pick" },
  { phase: "PICK_2", team: "red", type: "pick" }
];

interface PlayerSlotProps {
  player: EnhancedChampSelectPlayer;
  index: number;
  teamColor: "blue" | "red" | string;
  _currentPhase?: string;
  hoverState?: {
    isHovering: boolean;
    isSelecting: boolean;
    hoveredChampionId: number | null;
    currentTeam: "blue" | "red" | null;
    currentActionType: "pick" | "ban" | null;
    currentTurn?: number;
  };
  roleIcons: Record<string, string>;
  onRegisterImages?: (urls: string[]) => void;
  cardsAnimated?: boolean;
  teamSide: "left" | "right";
}

export const PlayerSlotComponent: React.FC<PlayerSlotProps> = ({
  player,
  index,
  teamColor,
  _currentPhase,
  hoverState,
  roleIcons,
  onRegisterImages,
  cardsAnimated,
  teamSide
}) => {
  const image = getChampionCenteredSplashImage(player.championId);
  const [recentlyPicked, setRecentlyPicked] = useState(false);
  const isPlaceholder = player.cellId < 0;
  const championPicked = player.championId > 0;

  // Register images with parent component
  useEffect(() => {
    if (onRegisterImages) {
      const urls: string[] = [];

      // Add champion splash image
      if (player.championId && image) {
        urls.push(image);
      }

      // Add role icon if player has a role
      if (player.role && roleIcons[player.role]) {
        urls.push(roleIcons[player.role]);
      }

      onRegisterImages(urls);
    }
  }, [player.championId, player.role, image, roleIcons, onRegisterImages]);

  const getCurrentPickingPlayerIndex = (): number => {
    if (!hoverState?.currentTurn || hoverState?.currentActionType !== "pick") {
      return -1;
    }

    const currentTurn = hoverState.currentTurn;
    const currentAction = PICK_BAN_ORDER[currentTurn];

    // Use teamSide instead of teamColor since teamColor is a CSS color value
    const isBlueTeam = teamSide === "left";
    const expectedTeam = isBlueTeam ? "blue" : "red";

    if (!currentAction || currentAction.type !== "pick" || currentAction.team !== expectedTeam) {
      return -1;
    }

    // Separate mappings for blue and red teams
    const bluePlayerMapping: Record<number, number> = {
      6: 0, // Blue first pick
      9: 1, // Blue second pick
      10: 2, // Blue third pick
      17: 3, // Blue fourth pick
      18: 4 // Blue fourth pick
    };

    const redPlayerMapping: Record<number, number> = {
      7: 0, // Red first pick
      8: 1, // Red second pick
      11: 2, // Red third pick
      16: 3, // Red fourth pick
      19: 4 // Red fifth pick
    };

    const mapping = isBlueTeam ? bluePlayerMapping : redPlayerMapping;
    return mapping[currentTurn] ?? -1;
  };

  // Check if this specific player slot should show hover effect
  const isCurrentPickingPlayer = getCurrentPickingPlayerIndex() === index;
  const isCurrentlyPicking = hoverState?.currentActionType === "pick" && isCurrentPickingPlayer;

  useEffect(() => {
    // Only trigger recentlyPicked when this specific player's champion was just picked
    // We need to track if this player was previously picking and now has a confirmed champion
    if (championPicked && !recentlyPicked && isCurrentPickingPlayer && !isCurrentlyPicking) {
      // Small delay to ensure the pick is confirmed
      const confirmTimer = setTimeout(() => {
        setRecentlyPicked(true);

        // Reset recently picked state after animation
        const resetTimer = setTimeout(() => {
          setRecentlyPicked(false);
        }, 3000); // 3 seconds for stats display

        // Cleanup the reset timer
        return () => clearTimeout(resetTimer);
      }, 500); // 500ms delay to ensure pick is confirmed

      return () => clearTimeout(confirmTimer);
    }
  }, [championPicked, recentlyPicked, isCurrentPickingPlayer, isCurrentlyPicking]);

  const getAnimationDelay = (): number => {
    if (!cardsAnimated) return 0;

    // Cards animate from middle outward
    if (teamSide === "left") {
      // Blue team (left): support -> bottom -> middle -> jungle -> top
      // Index mapping: 4=SUPPORT, 3=BOTTOM, 2=MIDDLE, 1=JUNGLE, 0=TOP
      if (index === 4) return 0; // SUPPORT first
      if (index === 3) return 0.2; // BOTTOM second
      if (index === 2) return 0.4; // MIDDLE third
      if (index === 1) return 0.6; // JUNGLE fourth
      if (index === 0) return 0.8; // TOP last
    } else {
      // Red team (right): top -> jungle -> middle -> bottom -> support
      // Index mapping: 0=TOP, 1=JUNGLE, 2=MIDDLE, 3=BOTTOM, 4=SUPPORT
      if (index === 0) return 0; // TOP first
      if (index === 1) return 0.2; // JUNGLE second
      if (index === 2) return 0.4; // MIDDLE third
      if (index === 3) return 0.6; // BOTTOM fourth
      if (index === 4) return 0.8; // SUPPORT last
    }
    return 0;
  };

  return (
    <div
      key={player.cellId}
      className={`relative w-full transition-all duration-500 ${cardsAnimated ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"} `}
      style={{
        transitionDelay: `${getAnimationDelay()}s`
      }}
    >
      <div
        className={`flex-1 h-80 max-h-screen ${isPlaceholder ? "bg-black/80 border-gray-600/80" : "bg-black/950"} overflow-hidden relative flex flex-col justify-end transition-all duration-3000 ${
          isCurrentlyPicking ? (teamSide === "left" ? "is-picking-blue" : "is-picking-red") : ""
        } ${recentlyPicked ? "recently-picked" : ""}`}
        style={
          !isPlaceholder
            ? {
                backgroundColor: `${teamColor}20`,
                borderLeft: `1px solid ${teamColor}80`,
                borderRight: `1px solid ${teamColor}80`
              }
            : {}
        }
      >
        {!isPlaceholder && image && image.trim() !== "" ? (
          <Image
            src={image}
            alt={getChampionName(player.championId) || player.summonerName || `Player ${index + 1}`}
            fill
            sizes="100vw"
            className="object-cover object-center absolute inset-0 z-0"
            priority
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-transparent flex items-start justify-center text-gray-500 text-sm z-0 pt-16">
            {!isPlaceholder && player.role && roleIcons[player.role] ? (
              <Image
                src={roleIcons[player.role]} // || PLAYER_CARD_ROLE_ICONS[player.role]}
                alt={player.role}
                width={12}
                height={12}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">{isPlaceholder ? "⚪" : "👤"}</div>
                <div className="text-sm">{isPlaceholder ? "Empty Slot" : "No Role"}</div>
              </div>
            )}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent z-10" />
        <div className="relative z-20 p-3 pl-0 flex flex-col items-center text-center justify-end max-w-full">
          <div className="flex items-end mb-3 w-full">
            <div
              className="text-2xl font-semibold text-white max-w-full rotate-270 origin-bottom-left transform-gpu"
              style={{ position: "absolute", bottom: "10px", left: "40px" }}
            >
              {isPlaceholder ? "Empty Slot" : player.summonerName || player.playerInfo?.name || `Player ${index + 1}`}
            </div>
            {!isPlaceholder && player.role && roleIcons[player.role] && championPicked && (
              <div className="absolute bottom-5 right-5">
                <Image
                  src={roleIcons[player.role]}
                  alt={player.role}
                  width={64}
                  height={64}
                  className="w-8 h-8 object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlayerSlot = React.memo(PlayerSlotComponent);

export { PlayerSlot };
