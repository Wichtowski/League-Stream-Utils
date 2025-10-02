"use client";

import React, { useEffect } from "react";
import type { EnhancedChampSelectSession } from "@lib/types";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useDownload } from "@lib/contexts/DownloadContext";
import { ChampSelectDisplay } from "@libLeagueClient/components/champselect/ChampSelectDisplay";
import { useLCU, useChampSelectAssets } from "@lib/services";
 

const ChampSelectOverlayPage: React.FC = () => {
  const { setActiveModule } = useNavigation();
  const { downloadState } = useDownload();
 

  // Use custom hooks for LCU and assets
  const { isConnected, champSelectSession } = useLCU();
  const { assets } = useChampSelectAssets();

  // No match/tournament dependency; render using LCU data only

  // Enable polling when connected and not downloading
  useEffect(() => {
    if (isConnected && !downloadState.isDownloading) {
      // Polling is handled by the useLCU hook internally
    }
  }, [isConnected, downloadState.isDownloading]);

  // Set active module on mount
  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

  if (!assets.roleIcons || !assets.banPlaceholder || !champSelectSession || !isConnected) {
    return <></>;
  }

  const data = champSelectSession as EnhancedChampSelectSession;

  return (
    <ChampSelectDisplay
      data={data}
      roleIcons={assets.roleIcons}
      banPlaceholder={assets.banPlaceholder}
    />
  );
};

export default ChampSelectOverlayPage;
