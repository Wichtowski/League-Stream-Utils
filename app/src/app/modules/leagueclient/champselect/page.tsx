"use client";

import React, { useEffect, useState } from "react";
import type { EnhancedChampSelectSession } from "@lib/types";
import { getChampions } from "@lib/champions";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useMockDataContext } from "@lib/contexts/MockDataContext";
import { useLCU } from "@lib/contexts/LCUContext";
import { getDynamicMockData } from "@lib/mocks/dynamic-champselect";
import { ChampSelectDisplay } from "@lib/components/features/leagueclient/champselect/ChampSelectDisplay";
import { Button } from "@lib/components/common/buttons/Button";

const ChampSelectOverlayPage: React.FC = () => {
  const { useMockData, toggleMockData } = useMockDataContext();
  const { champSelectSession, isConnected, connect, isConnecting, connectionError: _connectionError } = useLCU();
  const { setActiveModule } = useNavigation();

  // Check for URL parameters
  const [urlMockEnabled, setUrlMockEnabled] = useState(false);

  // Function to manually clear mock data setting
  const clearMockDataSetting = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("useMockData");
      window.location.reload();
    }
  };

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

  // Check URL parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const mockParam = urlParams.get("mock");

      setUrlMockEnabled(mockParam === "true");
    }
  }, []);

  // Auto-connect to LCU when not using mock data and URL mock is not enabled
  useEffect(() => {
    if (!useMockData && !urlMockEnabled && !isConnected && !isConnecting) {
      console.log("Auto-connecting to LCU for overlay...");
      connect().catch(console.error);
    }
  }, [useMockData, urlMockEnabled, isConnected, isConnecting, connect]);

  // Determine which data source to use
  const shouldUseUrlMock = urlMockEnabled;
  const shouldUseContextMock = useMockData && !urlMockEnabled;
  const shouldUseRealData = !shouldUseUrlMock && !shouldUseContextMock;

  // Show loading state when transitioning from mock to real data
  if (isConnecting && !champSelectSession && shouldUseRealData) {
    console.log("Connecting to League Client...");
  }

  // If not connected and no data, show connection status
  if (!isConnected && !champSelectSession && shouldUseRealData) {
    console.log("Not connected to League Client...");
    console.log("shouldUseRealData", shouldUseRealData);
  }

  // Use URL mock data if enabled
  if (shouldUseUrlMock) {
    const data = getDynamicMockData();

    // Ensure champions cache is populated
    if (typeof window !== "undefined") {
      getChampions().catch(console.error);
    }

    return (
      <>
        <ChampSelectDisplay data={data} isOverlay={true} />
      </>
    );
  }

  // Show mock data toggle and connection status
  if (shouldUseContextMock) {
    const data = getDynamicMockData();

    // Ensure champions cache is populated
    if (typeof window !== "undefined") {
      getChampions().catch(console.error);
    }

    return (
      <>
        <div className="fixed top-4 left-4 z-50 bg-red-900/90 backdrop-blur-sm border border-red-600 rounded-lg p-3 text-white">
          <div className="text-sm font-medium mb-2">⚠️ Mock Data Enabled</div>
          <div className="text-xs text-red-200 mb-3">
            You&apos;re seeing mock data instead of real League client data
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => toggleMockData(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1"
            >
              Connect to Real League Client
            </Button>
            <Button
              onClick={clearMockDataSetting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-1"
            >
              Force Clear Mock Data Setting
            </Button>
          </div>
        </div>
        <ChampSelectDisplay data={data} isOverlay={true} />
      </>
    );
  }

  // Ensure we have valid data before destructuring
  if (!champSelectSession) {
    return <></>;
  }

  // Use the data directly from LCU context (which now handles both real and mock data)
  const data = champSelectSession as EnhancedChampSelectSession;

  // Ensure champions cache is populated
  if (typeof window !== "undefined") {
    // Trigger load once; ignore errors
    getChampions().catch(console.error);
  }

  return (
    <>
      <div className="fixed top-4 left-4 z-50 bg-green-900/90 backdrop-blur-sm border border-green-600 rounded-lg p-3 text-white">
        <div className="text-sm font-medium mb-2">✅ Connected to League Client</div>
        <div className="text-xs text-green-200">
          Showing real champion select data
        </div>
      </div>
      <ChampSelectDisplay data={data} isOverlay={true} />
    </>
  );
};

export default ChampSelectOverlayPage;
