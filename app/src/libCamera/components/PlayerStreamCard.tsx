"use client";

import React from "react";
import { CameraPlayer } from "@libCamera/types";
import { getStreamTypeIcon, getStreamTypeLabel } from "../utils/urlValidation";
import { useUrlValidation } from "../hooks/useUrlValidation";

interface PlayerStreamCardProps {
  player: CameraPlayer;
  onChange: (playerId: string, url: string) => void;
}

export const PlayerStreamCard = ({ player, onChange }: PlayerStreamCardProps): React.ReactElement => {
  const { validation, showValidation, getInputBorderColor, getStatusColor } = useUrlValidation(player.url || "");

  const handleUrlChange = (url: string) => {
    onChange(player.playerId || "", url);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{player.playerName}</h3>
          {showValidation && validation.isValid && validation.type && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-400 flex items-center gap-1">
                {React.createElement(getStreamTypeIcon(validation.type), { className: "w-4 h-4" })} {getStreamTypeLabel(validation.type)}
              </span>
            </div>
          )}
        </div>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Live Stream URL</label>
          <input
            type="url"
            placeholder="https://twitch.tv/player or OBS Stream URL"
            value={player.url || ""}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none transition-colors ${getInputBorderColor()}`}
          />
          {showValidation && !validation.isValid && validation.error && (
            <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
              <span>⚠️</span>
              {validation.error}
            </p>
          )}
          {showValidation && validation.isValid && (
            <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
              <span>✅</span>
              Valid stream URL
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
