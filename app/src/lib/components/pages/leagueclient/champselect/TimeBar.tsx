"use client";

import { TeamColors } from "@lib/types/tournament";
import { redColor, blueColor } from "@lib/utils/constants";
import React from "react";

interface TimeBarProps {
  timer?: {
    adjustedTimeLeftInPhase: number;
    totalTimeInPhase: number;
    phase: string;
  };
  tournamentData?: {
    blueTeam?: { colors?: TeamColors };
    redTeam?: { colors?: TeamColors };
  };
  hoverState?: {
    isHovering: boolean;
    isSelecting: boolean;
    hoveredChampionId: number | null;
    currentTeam: "blue" | "red" | null;
    currentActionType: "pick" | "ban" | null;
    currentTurn?: number;
  };
}

export const TimeBar: React.FC<TimeBarProps> = ({
  timer,
  tournamentData,
  hoverState,
}) => {
  if (!timer) return null;

  // Determine current picking/banning team
  const currentTeam = hoverState?.currentTeam || "blue";

  // Determine timer color
  const blueTeamColor = tournamentData?.blueTeam?.colors?.primary || blueColor;
  const redTeamColor = tournamentData?.redTeam?.colors?.primary || redColor;

  let timerColor = currentTeam === "blue" ? blueTeamColor : redTeamColor;
  if (tournamentData) {
    if (currentTeam === "blue" && tournamentData.blueTeam?.colors?.secondary) {
      timerColor = tournamentData.blueTeam.colors.secondary;
    } else if (
      currentTeam === "red" &&
      tournamentData.redTeam?.colors?.secondary
    ) {
      timerColor = tournamentData.redTeam.colors.secondary;
    }
  }

  const progressPercent = Math.max(
    0,
    (timer.adjustedTimeLeftInPhase / timer.totalTimeInPhase) * 100,
  );

  return (
    <div className="w-full mb-4 relative h-2">
      {/* Left side timer bar */}
      <div className="absolute left-0 top-0 h-2" style={{ width: "50%" }}>
        <div
          className="h-full"
          style={{
            width: `${progressPercent}%`,
            maxWidth: "100%",
            background: timerColor,
            transition: "width 1s linear",
            float: "right",
            height: "100%",
          }}
        />
      </div>

      {/* Right side timer bar */}
      <div className="absolute right-0 top-0 h-2" style={{ width: "50%" }}>
        <div
          className="h-full"
          style={{
            width: `${progressPercent}%`,
            maxWidth: "100%",
            background: timerColor,
            transition: "width 1s linear",
            float: "left",
            height: "100%",
          }}
        />
      </div>

      {/* Background bar */}
      <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden" />
    </div>
  );
};
