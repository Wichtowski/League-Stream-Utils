import { useEffect, useState, useRef } from "react";
import type { EnhancedChampSelectSession, GameState } from "@lib/types";
import { getDynamicMockData } from "@lib/mocks/dynamic-champselect";

export type UseChampSelectDataResult = {
  data: EnhancedChampSelectSession | null;
  loading: boolean;
  error: string | null;
};

// Pick and ban phase configuration - 22 turns total (same as in dynamic-champselect.ts)
const PICK_BAN_ORDER: Array<{
  phase: string;
  team: "blue" | "red";
  type: "pick" | "ban";
}> = [
  // Ban phase 1 (6 bans)
  { phase: "ban1", team: "blue", type: "ban" },
  { phase: "ban1", team: "red", type: "ban" },
  { phase: "ban1", team: "blue", type: "ban" },
  { phase: "ban1", team: "red", type: "ban" },
  { phase: "ban1", team: "blue", type: "ban" },
  { phase: "ban1", team: "red", type: "ban" },

  // Pick phase 1 (6 picks)
  { phase: "pick1", team: "blue", type: "pick" },
  { phase: "pick1", team: "red", type: "pick" },
  { phase: "pick1", team: "red", type: "pick" },
  { phase: "pick1", team: "blue", type: "pick" },
  { phase: "pick1", team: "blue", type: "pick" },
  { phase: "pick1", team: "red", type: "pick" },

  // Ban phase 2 (4 bans)
  { phase: "ban2", team: "red", type: "ban" },
  { phase: "ban2", team: "blue", type: "ban" },
  { phase: "ban2", team: "red", type: "ban" },
  { phase: "ban2", team: "blue", type: "ban" },

  // Pick phase 2 (6 picks)
  { phase: "pick2", team: "red", type: "pick" },
  { phase: "pick2", team: "blue", type: "pick" },
  { phase: "pick2", team: "blue", type: "pick" },
  { phase: "pick2", team: "red", type: "pick" },
  { phase: "pick2", team: "red", type: "pick" },
  { phase: "pick2", team: "blue", type: "pick" }
];

export type TurnInfo = {
  currentTurn: number;
  totalTurns: number;
  currentAction: {
    phase: string;
    team: "blue" | "red";
    type: "pick" | "ban";
  } | null;
  nextAction: {
    phase: string;
    team: "blue" | "red";
    type: "pick" | "ban";
  } | null;
  isCurrentTeamTurn: boolean;
};

export const useTurnSequence = (data: EnhancedChampSelectSession | null): TurnInfo => {
  const [turnInfo, setTurnInfo] = useState<TurnInfo>({
    currentTurn: 0,
    totalTurns: PICK_BAN_ORDER.length,
    currentAction: null,
    nextAction: null,
    isCurrentTeamTurn: false
  });

  useEffect(() => {
    if (!data) return;

    // Calculate current turn based on completed actions
    const allBans = [...(data.bans?.myTeamBans || []), ...(data.bans?.theirTeamBans || [])];
    const allPicks = [
      ...(data.myTeam || []).filter((p) => p.championId > 0),
      ...(data.theirTeam || []).filter((p) => p.championId > 0)
    ];

    let currentTurn = 0;

    // Count completed bans
    for (let i = 0; i < 6; i++) {
      if (allBans.length > i) {
        currentTurn++;
      } else {
        break;
      }
    }

    // Count completed picks from first pick phase
    for (let i = 0; i < 6; i++) {
      if (allPicks.length > i) {
        currentTurn++;
      } else {
        break;
      }
    }

    // Count completed bans from second ban phase
    for (let i = 6; i < 10; i++) {
      if (allBans.length > i) {
        currentTurn++;
      } else {
        break;
      }
    }

    // Count remaining picks
    for (let i = 6; i < 12; i++) {
      if (allPicks.length > i) {
        currentTurn++;
      } else {
        break;
      }
    }

    const currentAction = currentTurn < PICK_BAN_ORDER.length ? PICK_BAN_ORDER[currentTurn] : null;
    const nextAction = currentTurn + 1 < PICK_BAN_ORDER.length ? PICK_BAN_ORDER[currentTurn + 1] : null;

    setTurnInfo({
      currentTurn,
      totalTurns: PICK_BAN_ORDER.length,
      currentAction,
      nextAction,
      isCurrentTeamTurn: currentAction?.team === "blue" // This would need to be determined by actual team side
    });
  }, [data]);

  return turnInfo;
};

export type HoverAnimationState = {
  hoveredChampionId: number | null;
  isCurrentTurn: boolean;
  currentActionType: "pick" | "ban" | null;
  currentTeam: "blue" | "red" | null;
  animationClasses: string;
  setHoveredChampionId: (championId: number | null) => void;
};

export const useChampionHoverAnimation = (
  data: EnhancedChampSelectSession | null,
  turnInfo: TurnInfo
): HoverAnimationState => {
  const [hoveredChampionId, setHoveredChampionId] = useState<number | null>(null);

  const isCurrentTurn = turnInfo.currentAction !== null;
  const currentActionType = turnInfo.currentAction?.type || null;
  const currentTeam = turnInfo.currentAction?.team || null;

  const getAnimationClasses = (): string => {
    if (!isCurrentTurn || !hoveredChampionId) return "";

    const baseClasses = "animate-pulse transition-all duration-300";

    if (currentActionType === "ban") {
      return `${baseClasses} ring-4 ring-red-500/70 shadow-lg shadow-red-500/50 scale-110`;
    } else if (currentActionType === "pick") {
      const teamColor = currentTeam === "blue" ? "blue" : "red";
      return `${baseClasses} ring-4 ring-${teamColor}-500/70 shadow-lg shadow-${teamColor}-500/50 scale-110`;
    }

    return baseClasses;
  };

  return {
    hoveredChampionId,
    isCurrentTurn,
    currentActionType,
    currentTeam,
    animationClasses: getAnimationClasses(),
    setHoveredChampionId
  };
};

export const useGameStateHoverAnimation = (gameState: GameState | null) => {
  const isCurrentTurn = gameState?.currentTurn !== null;
  const currentActionType = gameState?.currentTurn?.type || null;
  const currentTeam = gameState?.currentTurn?.team || null;

  // Get hover state from server
  const blueTeamHover = gameState?.hoverState?.blueTeam;
  const redTeamHover = gameState?.hoverState?.redTeam;

  const getAnimationClasses = (championId: number): string => {
    // Check if this champion is being hovered by either team
    const isHoveredByBlue = blueTeamHover?.hoveredChampionId === championId;
    const isHoveredByRed = redTeamHover?.hoveredChampionId === championId;

    if (!isHoveredByBlue && !isHoveredByRed) return "";

    // Basic hover effect that always works
    const baseClasses = "transition-all duration-300";

    // Enhanced effects only when it's the current turn and the hovering team is the current team
    if (isCurrentTurn && currentTeam) {
      const isHoveredByCurrentTeam =
        (currentTeam === "blue" && isHoveredByBlue) || (currentTeam === "red" && isHoveredByRed);

      if (isHoveredByCurrentTeam) {
        if (currentActionType === "ban") {
          return `${baseClasses} animate-pulse ring-4 ring-red-500/70 shadow-lg shadow-red-500/50 scale-110`;
        } else if (currentActionType === "pick") {
          const teamColor = currentTeam === "blue" ? "blue" : "red";
          return `${baseClasses} animate-pulse ring-4 ring-${teamColor}-500/70 shadow-lg shadow-${teamColor}-500/50 scale-110`;
        }
      }
    }

    // Basic hover effect for when it's not the current turn or different team
    return `${baseClasses} ring-2 ring-white/30 shadow-lg shadow-white/20 scale-105`;
  };

  return {
    isCurrentTurn,
    currentActionType,
    currentTeam,
    getAnimationClasses,
    blueTeamHover,
    redTeamHover
  };
};

function getBackendUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("backend");
}

export const useChampSelectData = (): UseChampSelectDataResult => {
  const [data, setData] = useState<EnhancedChampSelectSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const backend = getBackendUrl();

    if (!backend) {
      setData(getDynamicMockData());
      setLoading(false);
      return;
    }

    if (backend.startsWith("ws://") || backend.startsWith("wss://")) {
      // WebSocket mode
      const ws = new WebSocket(backend);
      wsRef.current = ws;

      ws.onopen = () => setLoading(false);
      ws.onmessage = (event) => {
        setData(JSON.parse(event.data));
        setError(null);
      };
      ws.onerror = () => setError("WebSocket error");
      ws.onclose = () => setError("WebSocket closed");

      return () => ws.close();
    } else if (backend.startsWith("http://") || backend.startsWith("https://")) {
      // HTTP polling mode
      setLoading(true);

      const poll = async () => {
        try {
          const res = await fetch(backend);
          if (!res.ok) throw new Error("HTTP error");
          setData(await res.json());
          setError(null);
        } catch (_error) {
          setError("HTTP error");
        } finally {
          setLoading(false);
        }
      };

      poll();
      const interval = setInterval(poll, 1000);

      return () => {
        clearInterval(interval);
      };
    } else {
      setError("Invalid backend URL");
      setLoading(false);
    }
  }, []);

  return { data, loading, error };
};
