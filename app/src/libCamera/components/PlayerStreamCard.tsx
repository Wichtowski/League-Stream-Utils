"use client";

import React from "react";
import { CameraPlayer } from "@libCamera/types/camera";

interface PlayerStreamCardProps {
  player: CameraPlayer;
  onChange: (playerId: string, url: string) => void;
}

export const PlayerStreamCard = ({ player, onChange }: PlayerStreamCardProps): React.ReactElement => {
  const isConfigured = Boolean(player.url && player.url.trim() !== "");

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{player.playerName}</h3>
        </div>
        <div className={`w-3 h-3 rounded-full ${isConfigured ? "bg-green-500" : "bg-gray-500"}`}></div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Live Stream URL</label>
          <input
            type="url"
            placeholder="https://twitch.tv/player or OBS Stream URL"
            value={player.url || ""}
            onChange={(e) => onChange(player.playerId || "", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
};


