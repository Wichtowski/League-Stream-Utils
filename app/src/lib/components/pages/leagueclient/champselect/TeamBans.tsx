import React from "react";
import Image from "next/image";
import { getChampionById } from "@lib/champions";
import { getChampionSquareImage } from "./common";
import type { Champion } from "@lib/types";
import { banPlaceholder } from "@lib/utils/constants";

type TeamBansProps = {
  bans: number[];
  teamColor: string;
  isFearlessDraft?: boolean;
  usedChampions?: Champion[];
  hoverState?: {
    isHovering: boolean;
    isSelecting: boolean;
    hoveredChampionId: number | null;
    currentTeam: "blue" | "red" | null;
    currentActionType: "pick" | "ban" | null;
    currentTurn?: number;
  };
};

const TeamBansComponent: React.FC<TeamBansProps> = ({
  bans,
  teamColor,
  isFearlessDraft = false,
  usedChampions = [],
  hoverState
}) => {
  const maxBans = 5; // Maximum number of bans per team

  // Check if this team should show hover effect for bans
  const isBanHovering =
    hoverState?.isHovering && hoverState?.currentTeam === teamColor && hoverState?.currentActionType === "ban";

  // Calculate which ban slot should be animated based on current turn
  const getCurrentBanSlot = (): number => {
    if (!hoverState?.currentTurn || !isBanHovering) return -1;

    const currentTurn = hoverState.currentTurn;

    // Ban phase 1: turns 0-5 (6 bans total)
    if (currentTurn <= 5) {
      // For blue team: turns 0, 2, 4 (ban slots 0, 1, 2)
      // For red team: turns 1, 3, 5 (ban slots 0, 1, 2)
      if (teamColor === "blue") {
        return Math.floor(currentTurn / 2); // 0, 1, 2
      } else {
        return Math.floor((currentTurn - 1) / 2); // 0, 1, 2
      }
    }

    // Ban phase 2: turns 12-15 (4 bans total)
    if (currentTurn >= 12 && currentTurn <= 15) {
      // For red team: turns 12, 14 (ban slots 3, 4)
      // For blue team: turns 13, 15 (ban slots 3, 4)
      if (teamColor === "red") {
        return 3 + Math.floor((currentTurn - 12) / 2); // 3, 4
      } else {
        return 3 + Math.floor((currentTurn - 13) / 2); // 3, 4
      }
    }

    return -1;
  };

  const currentBanSlot = getCurrentBanSlot();

  // Get all banned champions (current game + series bans in Fearless Draft)
  const allBannedChampions = [...bans];
  if (isFearlessDraft && usedChampions.length > 0) {
    // Add usedChampions that aren't already in current bans
    usedChampions.forEach((champ) => {
      if (!allBannedChampions.includes(champ.id)) {
        allBannedChampions.push(champ.id);
      }
    });
  }

  return (
    <div className="flex flex-row justify-start">
      {Array.from({ length: maxBans }, (_, index) => {
        const championId = bans[index];
        const champ = championId ? getChampionById(championId) : null;
        const isSeriesBan = isFearlessDraft && usedChampions.some((c) => c.id === championId);

        return (
          <div
            key={index}
            className={`relative w-16 h-16 overflow-hidden flex items-center justify-center transition-all duration-500 `}
          >
            {champ ? (
              <>
                <Image
                  src={getChampionSquareImage(championId) || champ.image}
                  alt={champ.name}
                  width={64}
                  height={64}
                  className={`w-full h-full object-cover ${isSeriesBan ? "opacity-30" : "opacity-50"}`}
                />
                {/* Ban placeholder overlay to indicate banned champion */}
                <div
                  className={`absolute inset-0 flex items-center justify-center ${isSeriesBan ? "bg-gray-900/50" : "bg-red-900/30"}`}
                >
                  <Image
                    src={banPlaceholder}
                    alt="Ban Placeholder"
                    width={64}
                    height={64}
                    className={`w-full h-full object-cover ${isSeriesBan ? "opacity-40" : "opacity-60"}`}
                  />
                </div>
                {/* Series ban indicator */}
                {isSeriesBan && (
                  <div className="absolute top-0 right-0 bg-gray-600 text-white text-xs px-1 rounded-bl">S</div>
                )}
              </>
            ) : (
              <Image
                src={banPlaceholder}
                alt="Ban Placeholder"
                width={64}
                height={64}
                className="w-full h-full object-cover opacity-40"
              />
            )}

            {/* Ban placeholder overlay when this slot is being animated */}
            {isBanHovering && currentBanSlot === index && !champ && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src={banPlaceholder}
                  alt="Ban Placeholder"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover opacity-60"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const TeamBans = React.memo(TeamBansComponent);

export { TeamBans };
