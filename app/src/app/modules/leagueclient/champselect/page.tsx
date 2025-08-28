"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { EnhancedChampSelectSession, ChampSelectSession } from "@lib/types";
import { getChampions } from "@lib/champions";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useDownload } from "@lib/contexts/DownloadContext";
import { LCUConnector } from "@lib/services/external/LCU/connector";
import { storage } from "@lib/services/common/UniversalStorage";
import { ChampSelectDisplay } from "@libLeagueClient/components/champselect/ChampSelectDisplay";
import { getAllRoleIconAssets, getDefaultAsset } from "@libLeagueClient/components/common";
import { getLatestVersion } from "@lib/services/common/unified-asset-cache";

const LCU_SETTINGS_KEY = "lcu-settings";
const LCU_CONNECTION_KEY = "lcu-connection";

interface LCUSettings {
  autoReconnect: boolean;
  lastConnectedAt: Date | null;
}

const ChampSelectOverlayPage: React.FC = () => {
  const { setActiveModule } = useNavigation();
  const { downloadState } = useDownload();
  const [roleIcons, setRoleIcons] = useState<Record<string, string>>({});
  const [banPlaceholder, setBanPlaceholder] = useState<string>("");
  
  // LCU state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [_isInitialized, setIsInitialized] = useState(false);
  const [champSelectSession, setChampSelectSession] = useState<ChampSelectSession | null>(null);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [lastConnectedAt, setLastConnectedAt] = useState<Date | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // LCU Connector instance
  const [lcuConnector] = useState(
    () =>
      new LCUConnector({
        autoReconnect: false,
        maxReconnectAttempts: 5,
        pollInterval: 1000,
        isDownloading: () => downloadState.isDownloading
      })
  );

  const connect = useCallback(async (): Promise<void> => {
    if (isConnecting || isConnected) return;

    try {
      await lcuConnector.connect();
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to connect to LCU:", error);
    }
  }, [lcuConnector, isConnecting, isConnected]);

  const disconnect = useCallback(() => {
    lcuConnector.disconnect();
    setChampSelectSession(null);
    setConnectionAttempts(0);
  }, [lcuConnector]);

  const _reconnect = useCallback(async () => {
    disconnect();
    setTimeout(() => connect(), 500);
  }, [disconnect, connect]);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await storage.get<LCUSettings>(LCU_SETTINGS_KEY);
        if (settings) {
          setAutoReconnect(settings.autoReconnect ?? true);
          setLastConnectedAt(settings.lastConnectedAt ? new Date(settings.lastConnectedAt) : null);
        }
      } catch (error) {
        console.error("Failed to load LCU settings:", error);
      }
    };
    loadSettings();
  }, []);

  // Save settings
  useEffect(() => {
    const saveSettings = async () => {
      try {
        const settings: LCUSettings = {
          autoReconnect,
          lastConnectedAt
        };
        await storage.set(LCU_SETTINGS_KEY, settings);
      } catch (error) {
        console.error("Failed to save LCU settings:", error);
      }
    };
    saveSettings();
  }, [autoReconnect, lastConnectedAt]);

  // Setup LCU connector event handlers
  useEffect(() => {
    lcuConnector.setOnStatusChange((status) => {
      setIsConnecting(status === "connecting");
      setIsConnected(status === "connected");

      if (status === "connected") {
        setConnectionError(null);
        setLastConnectedAt(new Date());
        setConnectionAttempts(0);
        storage.set(LCU_CONNECTION_KEY, { wasConnected: true });
      } else if (status === "error") {
        setConnectionAttempts((prev) => prev + 1);
        storage.set(LCU_CONNECTION_KEY, { wasConnected: false });
      } else if (status === "disconnected") {
        storage.set(LCU_CONNECTION_KEY, { wasConnected: false });
      }
    });

    lcuConnector.setOnChampSelectUpdate((data) => {
      setChampSelectSession(data);
    });

    lcuConnector.setOnError((error) => {
      setConnectionError(error);
      setConnectionAttempts((prev) => prev + 1);
    });
  }, [lcuConnector]);

  // Auto-reconnect logic
  useEffect(() => {
    if (!autoReconnect || isConnected || isConnecting) return;

    const timeoutId = setTimeout(() => {
      if (connectionAttempts < 5) {
        connect();
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [isConnected, isConnecting, autoReconnect, connectionAttempts, connect]);

  // Enable polling when connected and not downloading
  useEffect(() => {
    if (isConnected && !downloadState.isDownloading) {
      lcuConnector.enablePolling();
    } else {
      lcuConnector.disablePolling();
    }
  }, [lcuConnector, isConnected, downloadState.isDownloading]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    const init = async (): Promise<void> => {
      await Promise.allSettled([getChampions()]);
      
      const v = await getLatestVersion();
      setBanPlaceholder(getDefaultAsset(v, "default_ban_placeholder.svg"));
      setRoleIcons(getAllRoleIconAssets(v));
      
    };
    init().catch(console.error);
    
    setActiveModule(null);
  }, [setActiveModule]);

  if (!roleIcons || !banPlaceholder || !champSelectSession || !isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          {isConnecting && <p className="text-white">Connecting to League Client...</p>}
        </div>
      </div>
    );
  }

  const data = champSelectSession as EnhancedChampSelectSession;

  return (
    <ChampSelectDisplay data={data}  roleIcons={roleIcons} banPlaceholder={banPlaceholder} />
  );
};

export default ChampSelectOverlayPage;
