"use client";

import React from "react";
import { getStreamTypeIcon, getStreamTypeLabel } from "../utils/urlValidation";
import { useUrlValidation } from "../hooks/useUrlValidation";

interface TeamStreamSectionProps {
  teamStreamUrl: string;
  onChange: (url: string) => void;
}

export const TeamStreamSection = ({ teamStreamUrl, onChange }: TeamStreamSectionProps): React.ReactElement => {
  const { validation, showValidation, getInputBorderColor, getStatusColor } = useUrlValidation(teamStreamUrl);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 col-span-1 lg:col-span-2 xl:col-span-3">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Team Stream</h3>
          <p className="text-sm text-gray-400">Single stream representing the whole team</p>
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
          <label className="block text-sm text-gray-300 mb-2">Team Stream URL</label>
          <input
            type="url"
            placeholder="https://twitch.tv/team or OBS Stream URL"
            value={teamStreamUrl || ""}
            onChange={(e) => onChange(e.target.value)}
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
