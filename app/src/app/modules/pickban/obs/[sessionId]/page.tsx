"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import { getDynamicMockData } from "@lib/mocks/dynamic-champselect";
import { getChampions } from "@lib/champions";
import { ChampSelectDisplay } from "@lib/components/pages/leagueclient/champselect/ChampSelectDisplay";
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
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (isConnectingRef.current) {
      return; // Already trying to connect
    }

    isConnectingRef.current = true;

    try {
      fetch("/api/v1/pickban/ws")
        .then(() => {
          const websocket = new WebSocket("ws://localhost:8080");

          websocket.onopen = () => {
            isConnectingRef.current = false;
            setConnected(true);
            websocket.send(
              JSON.stringify({
                type: "join",
                sessionId: resolvedParams.sessionId
              })
            );
          };

          websocket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "gameState") {
              setGameState(message.payload);
            }
          };

          websocket.onclose = () => {
            isConnectingRef.current = false;
            setConnected(false);
            setWs(null);

            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
              if (document.visibilityState === "visible") {
                connectWebSocket();
              }
            }, 3000);
          };

          websocket.onerror = () => {
            isConnectingRef.current = false;
            setConnected(false);
          };

          setWs(websocket);
          wsRef.current = websocket;
        })
        .catch((error) => {
          isConnectingRef.current = false;
          console.error("Failed to initialize WebSocket server:", error);
          setTimeout(connectWebSocket, 5000);
        });
    } catch (error) {
      isConnectingRef.current = false;
      console.error("Failed to connect:", error);
      setTimeout(connectWebSocket, 5000);
    }
  }, [resolvedParams.sessionId]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
        setWs(null);
      }
      isConnectingRef.current = false;
    };
  }, [resolvedParams.sessionId, connectWebSocket, gameState, ws]);

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
