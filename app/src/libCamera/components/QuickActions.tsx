"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CameraPlayer } from "../types";
import { useUrlValidation } from "../hooks/useUrlValidation";

interface QuickActionsProps {
  teamId: string;
  players: CameraPlayer[];
  isMobile: boolean;
}

const PlayerButton = ({ player, teamId }: { player: CameraPlayer; teamId: string }): React.ReactElement => {
  const router = useRouter();
  const { getButtonStyle, isDisabled } = useUrlValidation(player.url || "");

  return (
    <button
      key={player.playerId}
      onClick={() => router.push(`/modules/cameras/${teamId}/stream/${player.playerId}`)}
      className={`${getButtonStyle()} px-4 py-2 rounded-lg transition-colors`}
      disabled={isDisabled()}
    >
      {player.playerName}
    </button>
  );
};

export const QuickActions = ({ teamId, players, isMobile }: QuickActionsProps): React.ReactElement => {
  const router = useRouter();

  return (
    <div className={`mb-8 bg-gray-800 rounded-lg p-6 ${isMobile ? "flex flex-col gap-4" : ""}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className={`flex gap-4 ${isMobile ? "flex-col" : ""}`}>
        <button
          onClick={() => router.push(`/modules/cameras/${teamId}/stream`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
          Team Stream
        </button>
        <button
          onClick={() => router.push(`/modules/cameras/${teamId}/stream/whole`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
          Whole Team Cameras
        </button>
        {players.map((player) => (
          <PlayerButton key={player.playerId} player={player} teamId={teamId} />
        ))}
      </div>
    </div>
  );
};
