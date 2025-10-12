"use client";

import React from "react";
import { getStreamTypeIcon, getStreamTypeLabel } from "../utils/urlValidation";
import { useUrlValidation } from "../hooks/useUrlValidation";

interface StreamUrlInputProps {
  title: string;
  description?: string;
  url: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
}

export const StreamUrlInput = ({ 
  title, 
  description, 
  url, 
  onChange, 
  placeholder = "https://twitch.tv/player or OBS Stream URL",
  className = ""
}: StreamUrlInputProps): React.ReactElement => {
  const { validation, showValidation, getInputBorderColor, getStatusColor } = useUrlValidation(url);

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && <p className="text-sm text-gray-400">{description}</p>}
        </div>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Stream URL</label>
          <input
            type="url"
            placeholder={placeholder}
            value={url || ""}
            onChange={(e) => onChange(e.target.value)}
            maxLength={100}
            className={`w-full ${validation.type ? "mb-2" : ""} bg-gray-700 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none transition-colors ${getInputBorderColor()}`}
          />
          {showValidation && validation.type === "configuring" && (
            <p className="text-orange-400 text-sm flex items-center gap-1">
              {React.createElement(getStreamTypeIcon(validation.type), { className: "w-4 h-4" })} {getStreamTypeLabel(validation.type)}
            </p>
          )}
          {showValidation && !validation.isValid && validation.error && validation.type !== "configuring" && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              {React.createElement(getStreamTypeIcon(validation.type), { className: "w-4 h-4" })} {getStreamTypeLabel(validation.type)}
            </p>
          )}
          {showValidation && validation.isValid && (
            <p className="text-green-400 text-sm flex items-center gap-1">
              {React.createElement(getStreamTypeIcon(validation.type), { className: "w-4 h-4" })} {getStreamTypeLabel(validation.type)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
