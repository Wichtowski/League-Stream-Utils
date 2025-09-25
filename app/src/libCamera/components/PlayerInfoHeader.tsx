"use client";

import React from "react";
import { CameraPlayer } from "@libCamera/types";

interface PlayerInfoHeaderProps {
  player: CameraPlayer;
  teamName?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: "small" | "medium" | "large";
  showIndex?: boolean;
  index?: number;
}

export const PlayerInfoHeader = ({
  player,
  teamName,
  position = "top-left",
  size = "medium",
  showIndex = false,
  index
}: PlayerInfoHeaderProps): React.ReactElement => {
  const positionClasses = {
    "top-left": "absolute top-4 left-4 z-10",
    "top-right": "absolute top-4 right-4 z-10",
    "bottom-left": "absolute bottom-4 left-4 z-10",
    "bottom-right": "absolute bottom-4 right-4 z-10"
  };

  const sizeClasses = {
    small: {
      container: "px-2 py-1",
      title: "text-sm font-medium",
      subtitle: "text-xs"
    },
    medium: {
      container: "px-3 py-2",
      title: "text-sm font-semibold",
      subtitle: "text-xs"
    },
    large: {
      container: "px-4 py-2",
      title: "text-lg font-bold",
      subtitle: "text-sm"
    }
  };

  const playerName = player.inGameName || player.playerName || "Unknown Player";
  const classes = sizeClasses[size];

  return (
    <div className={`${positionClasses[position]} bg-black/70 text-white rounded-lg ${classes.container}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`${classes.title} text-white`}>{playerName}</h3>
          <p className={`${classes.subtitle} text-gray-300`}>
            {teamName && `${teamName} • `}
            {player.role}
          </p>
        </div>
        {showIndex && index !== undefined && <div className="text-xs text-gray-500 ml-2">#{index + 1}</div>}
      </div>
    </div>
  );
};
