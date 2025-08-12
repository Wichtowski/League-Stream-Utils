"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { getDynamicMockData } from "@lib/mocks/dynamic-champselect";
import { getChampions } from "@lib/champions";
import { ChampSelectDisplay } from "@lib/components/features/leagueclient/champselect/ChampSelectDisplay";
import type { GameState } from "@lib/types";

export default function OBSView({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [, setConnected] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Throttling and connection management refs
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  const connectWebSocket = useCallback(() => {
    // For static sessions, we don't need WebSocket connections
    // Instead, we'll use polling to get session updates
    console.log("Static OBS page - using API polling instead of WebSocket");
    setConnected(true);
    
    // Set up polling for session updates
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/pickban/sessions/${resolvedParams.sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.actions) {
            // Update game state based on session data
            setGameState((prevState) => {
              if (!prevState) return prevState;
              
              return {
                ...prevState,
                phase: data.currentPhase || "ban1",
                currentTurn: data.currentTeam && data.currentPosition ? {
                  team: data.currentTeam,
                  type: data.currentPhase?.includes("ban") ? "ban" : "pick",
                  phase: data.currentPhase || "ban1"
                } : null,
                turnNumber: data.currentPosition || 1
              };
            });
          }
        }
      } catch (error) {
        console.error("Failed to poll session data:", error);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup function
    return () => {
      clearInterval(pollInterval);
    };
  }, [resolvedParams.sessionId]);

  useEffect(() => {
    const cleanup = connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
        setWs(null);
      }
      isConnectingRef.current = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, [resolvedParams.sessionId, connectWebSocket]);

  useEffect(() => {
    // Ensure champions cache is populated
    getChampions().catch(console.error);
  }, []);

  // If no game state, show loading
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Connecting to game session...</div>
      </div>
    );
  }

  // Convert game state to mock data format for ChampSelectDisplay
  const mockData = getDynamicMockData();

  return (
    <ChampSelectDisplay
      data={mockData}
      isOverlay={true}
      showControls={showControls}
      onToggleControls={() => setShowControls(!showControls)}
    />
  );
}
