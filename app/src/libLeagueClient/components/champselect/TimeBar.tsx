"use client";

import { TeamColors } from "@lib/types/championStats";
import { redColor, blueColor } from "@lib/services/common/constants";
import React, { useEffect, useState, useMemo, useRef } from "react";

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
  animated?: boolean;
}

export const TimeBar: React.FC<TimeBarProps> = ({ timer, tournamentData, hoverState, animated = false }) => {
  const [localProgress, setLocalProgress] = useState<number>(0);
  const lastTimerUpdateRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize the progress calculation to avoid unnecessary recalculations
  const progressPercent = useMemo(() => {
    if (!timer?.adjustedTimeLeftInPhase || !timer?.totalTimeInPhase) {
      return 0;
    }
    return Math.max(0, Math.min(100, (timer.adjustedTimeLeftInPhase / timer.totalTimeInPhase) * 100));
  }, [timer?.adjustedTimeLeftInPhase, timer?.totalTimeInPhase]);

  // Smooth progress updates using local state
  useEffect(() => {
    if (!timer?.adjustedTimeLeftInPhase || !timer?.totalTimeInPhase) {
      setLocalProgress(0);
      return;
    }

    const now = Date.now();

    // Update local progress immediately when timer data changes
    setLocalProgress(progressPercent);
    lastTimerUpdateRef.current = now;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up smooth countdown animation
    intervalRef.current = setInterval(() => {
      setLocalProgress((prev) => {
        if (prev <= 0) return 0;

        // Calculate how much time has passed since the last timer update
        const elapsed = Date.now() - lastTimerUpdateRef.current;
        const expectedProgress = Math.max(
          0,
          progressPercent - (elapsed / 1000) * (100 / (timer.totalTimeInPhase / 1000))
        );

        return Math.max(0, expectedProgress);
      });
    }, 100); // Update every 100ms for smooth animation

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer?.adjustedTimeLeftInPhase, timer?.totalTimeInPhase, progressPercent]);

  // Don't render if no timer data and not in a loading state
  if (!timer?.adjustedTimeLeftInPhase || !timer?.totalTimeInPhase) {
    return (
      <div
        className={`w-full relative h-2 transition-all duration-500 bg-black ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"}`}
      >
        <div className="w-full h-2 bg-white/50 overflow-hidden" />
      </div>
    );
  }

  // Determine current picking/banning team
  const currentTeam = hoverState?.currentTeam || "blue";

  // Determine timer color
  const blueTeamColor = tournamentData?.blueTeam?.colors?.primary || blueColor;
  const redTeamColor = tournamentData?.redTeam?.colors?.primary || redColor;

  let timerColor = currentTeam === "blue" ? blueTeamColor : redTeamColor;
  if (tournamentData) {
    if (currentTeam === "blue" && tournamentData.blueTeam?.colors?.secondary) {
      timerColor = tournamentData.blueTeam.colors.secondary;
    } else if (currentTeam === "red" && tournamentData.redTeam?.colors?.secondary) {
      timerColor = tournamentData.redTeam.colors.secondary;
    }
  }

  // Use local progress for smoother animations
  const displayProgress = Math.max(0, Math.min(100, localProgress));

  return (
    <div
      className={`w-full relative h-2 transition-all duration-500 bg-black ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"}`}
    >
      {/* Left side timer bar */}
      <div className="absolute left-0 top-0 h-2" style={{ width: "50%" }}>
        <div
          className="h-full"
          style={{
            width: `${displayProgress}%`,
            maxWidth: "100%",
            background: timerColor,
            transition: "width 0.1s ease-out",
            float: "right",
            height: "100%"
          }}
        />
      </div>

      {/* Right side timer bar */}
      <div className="absolute right-0 top-0 h-2" style={{ width: "50%" }}>
        <div
          className="h-full"
          style={{
            width: `${displayProgress}%`,
            maxWidth: "100%",
            background: timerColor,
            transition: "width 0.1s ease-out",
            float: "left",
            height: "100%"
          }}
        />
      </div>

      {/* Background bar */}
      <div className="w-full h-2 bg-white/50 overflow-hidden" />
    </div>
  );
};
