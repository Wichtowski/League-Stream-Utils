import { useState, useEffect, useCallback } from "react";
import { connectionService } from "@lib/services";
import type { ChampSelectSession } from "@lib/types";
import type { ConnectionStatus } from "@lib/services/external/LCU/connector";

export interface UseLCUReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  status: ConnectionStatus;

  // Champ select data
  champSelectSession: ChampSelectSession | null;

  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
}

export const useLCU = (): UseLCUReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [champSelectSession, setChampSelectSession] = useState<ChampSelectSession | null>(null);

  const connect = useCallback(async (): Promise<void> => {
    if (isConnecting || isConnected) return;

    try {
      await connectionService.connect();
    } catch (error) {
      console.error("Failed to connect to LCU:", error);
    }
  }, [isConnecting, isConnected]);

  const disconnect = useCallback(() => {
    connectionService.disconnect();
    setChampSelectSession(null);
  }, []);

  const reconnect = useCallback(async () => {
    disconnect();
    setTimeout(() => connect(), 500);
  }, [disconnect, connect]);

  // Setup connection service event handlers
  useEffect(() => {
    connectionService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsConnecting(newStatus === "connecting");
      setIsConnected(newStatus === "connected");
    });

    connectionService.onChampSelectUpdate((data) => {
      setChampSelectSession(data);
    });

    connectionService.onError((error) => {
      console.warn("Connection error:", error);
    });
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    const isElectron = typeof window !== "undefined" &&
      (navigator.userAgent.includes("Electron") || typeof (window as unknown as { electronAPI?: unknown }).electronAPI !== "undefined");

    const onLeagueClientPage = typeof window !== "undefined" &&
      window.location.pathname.startsWith("/modules/leagueclient");

    if (isElectron && onLeagueClientPage) {
      connect();
    }
  }, [connect]);

  return {
    isConnected,
    isConnecting,
    status,
    champSelectSession,
    connect,
    disconnect,
    reconnect
  };
};
