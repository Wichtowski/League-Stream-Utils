"use client";

import React, { useEffect, useState } from "react";
import type { EnhancedChampSelectSession, Match, Tournament } from "@lib/types";
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

  // State for match and tournament data
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);

  // Load match and tournament from localStorage
  useEffect(() => {
    try {
      const lastSelectedMatch = localStorage.getItem("lastSelectedMatch");
      const lastSelectedTournament = localStorage.getItem("lastSelectedTournament");

      if (lastSelectedMatch && lastSelectedMatch.trim() !== "") {
        try {
          const parsedMatch = JSON.parse(lastSelectedMatch);
          setMatch(parsedMatch);
          console.log("Loaded match from localStorage:", parsedMatch);
        } catch (parseError) {
          console.error("Failed to parse match from localStorage:", parseError);
          localStorage.removeItem("lastSelectedMatch"); // Clean up invalid data
        }
      }

      if (lastSelectedTournament && lastSelectedTournament.trim() !== "") {
        try {
          const parsedTournament = JSON.parse(lastSelectedTournament);
          setTournament(parsedTournament);
          console.log("Loaded tournament from localStorage:", parsedTournament);
        } catch (parseError) {
          console.error("Failed to parse tournament from localStorage:", parseError);
          localStorage.removeItem("lastSelectedTournament"); // Clean up invalid data
        }
      }
    } catch (error) {
      console.error("Failed to load match/tournament from localStorage:", error);
    }
  }, []);

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

  if (!assets.roleIcons || !assets.banPlaceholder || !champSelectSession || !isConnected || !match || !tournament) {
    console.log("assets", assets);
    console.log("champSelectSession", champSelectSession);
    console.log("isConnected", isConnected);
    console.log("downloadState", downloadState);
    console.log("match", match);
    console.log("tournament", tournament);
    return <></>;
  }

  const data = champSelectSession as EnhancedChampSelectSession;

  return (
    <ChampSelectDisplay
      data={data}
      match={match || ({} as Match)}
      tournament={tournament || ({} as Tournament)}
      roleIcons={assets.roleIcons}
      banPlaceholder={assets.banPlaceholder}
    />
  );
};

export default ChampSelectOverlayPage;
