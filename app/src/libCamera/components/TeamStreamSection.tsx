"use client";

import React from "react";

interface TeamStreamSectionProps {
  teamStreamUrl: string;
  onChange: (url: string) => void;
}

export const TeamStreamSection = ({ teamStreamUrl, onChange }: TeamStreamSectionProps): React.ReactElement => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 col-span-1 lg:col-span-2 xl:col-span-3">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Team Stream</h3>
          <p className="text-sm text-gray-400">Single stream representing the whole team</p>
        </div>
        <div
          className={`w-3 h-3 rounded-full ${teamStreamUrl && teamStreamUrl.trim() !== "" ? "bg-green-500" : "bg-gray-500"}`}
        ></div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Team Stream URL</label>
          <input
            type="url"
            placeholder="https://twitch.tv/team or OBS Stream URL"
            value={teamStreamUrl || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
};
