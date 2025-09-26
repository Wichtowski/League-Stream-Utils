"use client";

import React, { useEffect, useState } from "react";
import type { EnhancedChampSelectSession } from "@lib/types";
import type { Match, Tournament } from "@libTournament/types";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useDownload } from "@lib/contexts/DownloadContext";
import { ChampSelectDisplay } from "@libLeagueClient/components/champselect/ChampSelectDisplay";
import { useLCU, useChampSelectAssets } from "@lib/services";
import { useRouter } from "next/navigation";

const ChampSelectOverlayPage: React.FC = () => {
  const { setActiveModule } = useNavigation();
  const { downloadState } = useDownload();
  const router = useRouter();

  // Use custom hooks for LCU and assets
  const { isConnected, champSelectSession } = useLCU();
  const { assets } = useChampSelectAssets();

  // State for match and tournament data
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);

  // Load match and tournament from localStorage and redirect to new route
  useEffect(() => {
    try {
      const lastSelectedMatch = localStorage.getItem("lastSelectedMatch");
      const lastSelectedTournament = localStorage.getItem("lastSelectedTournament");

      if (
        lastSelectedMatch &&
        lastSelectedTournament &&
        lastSelectedMatch.trim() !== "" &&
        lastSelectedTournament.trim() !== ""
      ) {
        try {
          const parsedMatch = JSON.parse(lastSelectedMatch);
          const parsedTournament = JSON.parse(lastSelectedTournament);

          // Redirect to the new URL parameter-based route
          router.push(
            `/modules/leagueclient/${parsedTournament.tournamentId || parsedTournament.id}/${parsedMatch.matchId || parsedMatch.id}/champselect`
          );
          return;
        } catch (parseError) {
          console.error("Failed to parse match/tournament from localStorage:", parseError);
          localStorage.removeItem("lastSelectedMatch");
          localStorage.removeItem("lastSelectedTournament");
        }
      }

      // Fallback to old behavior if no stored data
      if (lastSelectedMatch && lastSelectedMatch.trim() !== "") {
        try {
          const parsedMatch = JSON.parse(lastSelectedMatch);
          setMatch(parsedMatch);
          console.log("Loaded match from localStorage:", parsedMatch);
        } catch (parseError) {
          console.error("Failed to parse match from localStorage:", parseError);
          localStorage.removeItem("lastSelectedMatch");
        }
      }

      if (lastSelectedTournament && lastSelectedTournament.trim() !== "") {
        try {
          const parsedTournament = JSON.parse(lastSelectedTournament);
          setTournament(parsedTournament);
          console.log("Loaded tournament from localStorage:", parsedTournament);
        } catch (parseError) {
          console.error("Failed to parse tournament from localStorage:", parseError);
          localStorage.removeItem("lastSelectedTournament");
        }
      }
    } catch (error) {
      console.error("Failed to load match/tournament from localStorage:", error);
    }
  }, [router]);

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
