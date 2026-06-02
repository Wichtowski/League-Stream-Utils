import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { getChampionSquareImage } from "../common";
import { PlayerRole } from "@lib/types/common";

import { getAllRoleIconAssets } from "../common";
import { useImagePreload } from "@lib/hooks/useImagePreload";
import { getLatestVersion } from "@lib/services/common/unified-asset-cache";

interface FearlessBan {
  championId: number;
  role: PlayerRole;
}

interface FearlessDraftBansProps {
  customTeamColors: {
    blueTeam: string;
    redTeam: string;
  };
  bans: {
    blue: FearlessBan[];
    red: FearlessBan[];
  };
  onRegisterImages?: (urls: string[]) => void;
  showFearlessBans?: boolean;
}

export const FearlessDraftBans: React.FC<FearlessDraftBansProps> = ({ customTeamColors, bans, showFearlessBans }) => {
  const ROLE_ORDER: FearlessBan["role"][] = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"];
  const [roleIcons, setRoleIcons] = useState<Record<string, string>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Memoize the bans to prevent unnecessary re-renders
  const memoizedBans = useMemo(
    () => ({
      blue: bans.blue,
      red: bans.red
    }),
    [bans.blue, bans.red]
  );

  useEffect(() => {
    const loadVersion = async () => {
      const v = await getLatestVersion();
      const icons = getAllRoleIconAssets(v);
      setRoleIcons(icons);

      // Collect all image URLs
      const urls: string[] = [];

      // Add role icons
      Object.values(icons).forEach((icon) => {
        if (icon) urls.push(icon);
      });

      // Add champion images
      const allBans = [...memoizedBans.blue, ...memoizedBans.red];
      allBans.forEach((ban) => {
        if (ban.championId) {
          const squareImage = getChampionSquareImage(ban.championId);
          if (squareImage) urls.push(squareImage);
        }
      });

      setImageUrls(Array.from(new Set(urls)));
    };
    loadVersion();
  }, [memoizedBans]); // Only depend on memoized bans

  // Preload all images for this component
  const { loaded } = useImagePreload(imageUrls);

  useEffect(() => {
    if (imageUrls.length > 0 && loaded) {
      setImagesLoaded(true);
    } else if (imageUrls.length === 0) {
      setImagesLoaded(true);
    }
  }, [imageUrls, loaded]);

  // Always render but control visibility with opacity
  if (!imagesLoaded) {
    return <></>;
  }

  return (
    <div
      className={`flex flex-row gap-2 mb-2 transition-all duration-600 ${showFearlessBans ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      {roleIcons &&
        ROLE_ORDER.map((role) => {
          const blueBans = bans.blue.filter((ban) => ban.role === role);
          const redBans = bans.red.filter((ban) => ban.role === role);
          if (blueBans.length === 0 && redBans.length === 0) return null;
          return (
            <div
              key={role}
              className="grid items-center gap-x-1 gap-y-0"
              style={{
                gridTemplateColumns: `40px repeat(${redBans.length}, 32px)`
              }}
            >
              {/* Role icon, spans two rows */}
              <div className="row-span-2 flex items-center justify-center">
                <Image
                  height={32}
                  width={role === "SUPPORT" ? 40 : 32}
                  src={roleIcons[role] || "/assets/default/default_ban_placeholder.svg"}
                  alt={role}
                  className={role === "SUPPORT" ? "w-10 h-8" : "w-8 h-8"}
                />
              </div>
              {/* Blue bans (top row) */}
              {Array.from({ length: redBans.length }).map((_, idx) => (
                <div key={`blue-${role}-${idx}`} className="flex items-center justify-center">
                  {blueBans[idx] ? (
                    <Image
                      height={32}
                      width={32}
                      src={getChampionSquareImage(blueBans[idx].championId)}
                      alt={blueBans[idx].championId.toString()}
                      className="w-8 h-8 rounded bg-gray-800"
                      style={{ border: `2px solid ${customTeamColors.blueTeam}` }}
                    />
                  ) : null}
                </div>
              ))}
              {/* Red bans (bottom row) */}
              {Array.from({ length: redBans.length }).map((_, idx) => (
                <div key={`red-${role}-${idx}`} className="flex items-center justify-center">
                  {redBans[idx] ? (
                    <Image
                      height={32}
                      width={32}
                      src={getChampionSquareImage(redBans[idx].championId)}
                      alt={redBans[idx].championId.toString()}
                      className="w-8 h-8 rounded bg-gray-800"
                      style={{ border: `2px solid ${customTeamColors.redTeam}` }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          );
        })}
    </div>
  );
};
