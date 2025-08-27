import React, { useEffect } from "react";
import Image from "next/image";
import { getChampionById } from "@lib/champions";
import { getChampionSquareImage } from "../common";
import type { Champion } from "@lib/types";


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
  banPlaceholder: string;
  onRegisterImages?: (urls: string[]) => void;
  bansAnimated?: boolean;
  teamSide: "left" | "right";
};

const TeamBansComponent: React.FC<TeamBansProps> = ({
  bans,
  teamColor,
  isFearlessDraft = false,
  usedChampions = [],
  hoverState,
  banPlaceholder,
  onRegisterImages,
  bansAnimated,
  teamSide
}) => {
  const maxBans = 5; // Maximum number of bans per team

  // Register images with parent component
  useEffect(() => {
    if (onRegisterImages) {
      const urls: string[] = [];
      
      // Add ban placeholder
      if (banPlaceholder) urls.push(banPlaceholder);
      
      // Add champion images
      bans.forEach(championId => {
        if (championId) {
          const squareImage = getChampionSquareImage(championId);
          if (squareImage) urls.push(squareImage);
        }
      });
      
      // Add used champions images for fearless draft
      if (isFearlessDraft && usedChampions.length > 0) {
        usedChampions.forEach(champ => {
          if (champ.id) {
            const squareImage = getChampionSquareImage(champ.id);
            if (squareImage) urls.push(squareImage);
          }
        });
      }
      
      onRegisterImages(urls);
    }
  }, [bans, banPlaceholder, isFearlessDraft, usedChampions, onRegisterImages]);

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

  // Calculate animation delay for each ban slot
  const getBanAnimationDelay = (index: number): number => {
    if (!bansAnimated) return 0;
    
    // Bans animate from outside inward
    if (teamSide === "left") {
      // Blue team (left): ban slots animate from right to left (index 4 to 0)
      return (4 - index) * 0.1; // 0.4s, 0.3s, 0.2s, 0.1s, 0s
    } else {
      // Red team (right): ban slots animate from left to right (index 0 to 4)
      return index * 0.1; // 0s, 0.1s, 0.2s, 0.3s, 0.4s
    }
  };

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
            className={`relative w-16 h-16 overflow-hidden flex items-center justify-center transition-all duration-500 ${bansAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{
              transitionDelay: `${getBanAnimationDelay(index)}s`
            }}
          >
            {champ ? (
              <>
                <Image
                  src={getChampionSquareImage(championId) || champ.image || banPlaceholder}
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
