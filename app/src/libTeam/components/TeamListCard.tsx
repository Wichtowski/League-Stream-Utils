"use client";

import React, { useEffect, useState } from "react";
import { SafeImage } from "@lib/components/common/SafeImage";
import { useRouter } from "next/navigation";
import type { Team } from "@lib/types";
import { getTeamLogoUrl } from "@lib/services/common/image";

interface TeamListCardProps {
  team: Team;
  logoSrc?: string;
}

export const TeamListCard: React.FC<TeamListCardProps> = ({ team }) => {
  const router = useRouter();
  const [logoSrc, setLogoSrc] = useState<string>("");

  useEffect(() => {
    // Skip if team ID is invalid or if it's a mock ID
    if (!team._id || team._id === "1") {
      return;
    }

    const getTeamLogo = async () => {
      try {
        const logoSrc = await getTeamLogoUrl(team._id);
        setLogoSrc(logoSrc);
      } catch (error) {
        console.error("Failed to load team logo:", error);
      }
    };
    getTeamLogo();
  }, [team._id]);

  return (
    <div
      onClick={() => router.push(`/modules/teams/${team._id}`)}
      className="group cursor-pointer bg-gray-800 hover:bg-gray-750 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-gray-700 hover:border-gray-600"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Team Logo */}
        <div className="relative">
          <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-700">
            {logoSrc ? (
              <SafeImage
                src={logoSrc}
                alt={`${team?.name} logo`}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs"></div>
            )}
          </div>
        </div>

        {/* Team Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-100 group-hover:text-white transition-colors">{team.name}</h3>
          <div className="space-y-1">
            <p className="text-sm text-gray-400">
              {team.tag} • {team.region}
            </p>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.colors?.primary || "#6B7280" }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.colors?.secondary || "#4B5563" }} />
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.colors?.accent || "#9CA3AF" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
