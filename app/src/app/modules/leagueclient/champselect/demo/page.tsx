"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { EnhancedChampSelectSession } from "@lib/types";
import { ChampSelectDisplay } from "@libLeagueClient/components/champselect/ChampSelectDisplay";
import { Breadcrumbs } from "@lib/components/common";
import { getChampions } from "@lib/champions";
import { getLatestVersion } from "@lib/services/common/unified-asset-cache";
import { getDefaultAsset, getAllRoleIconAssets } from "@libLeagueClient/components/common";
import { getDynamicMockData, FajnieMiecSklad, LosRatones } from "@lib/mocks/dynamic-champselect";
import { mockTournament, mockMatch } from "@lib/mocks/game";

const DemoChampSelectPage: React.FC = () => {
  const [mockData, setMockData] = useState<EnhancedChampSelectSession | null>(null);
  const [roleIcons, setRoleIcons] = useState<Record<string, string>>({});
  const [banPlaceholder, setBanPlaceholder] = useState<string>("");
  const [showControls, setShowControls] = useState<boolean>(true);
  const lastMockStateRef = useRef<string>("");

  // Memoize the initial mock data to prevent unnecessary re-renders
  const initialMockData = useMemo(() => getDynamicMockData(), []);

  useEffect(() => {
    const init = async (): Promise<void> => {
      await Promise.allSettled([getChampions()]);

      const v = await getLatestVersion();
      setBanPlaceholder(getDefaultAsset(v, "default_ban_placeholder.svg"));
      setRoleIcons(getAllRoleIconAssets(v));

      setMockData(initialMockData);
    };
    init().catch(console.error);
  }, [initialMockData]);

  // Poll for mock state changes to update the demo in real-time
  useEffect(() => {
    if (!showControls) return; // Only poll when controls are visible

    const pollInterval = setInterval(() => {
      const currentMockData = getDynamicMockData();
      const currentState = JSON.stringify({
        phase: currentMockData.phase,
        turn: currentMockData.hoverState?.currentTurn,
        hoveredChampion: currentMockData.hoverState?.hoveredChampionId
      });

      if (currentState !== lastMockStateRef.current) {
        lastMockStateRef.current = currentState;
        setMockData(currentMockData);
      }
    }, 100); // Check every 100ms for smooth updates

    return () => clearInterval(pollInterval);
  }, [showControls]);

  if (!mockData || !roleIcons || !banPlaceholder) {
    return <></>;
  }

  return (
    <div className="bg-white">
      <Breadcrumbs
        items={[
          { label: "League Client", href: "/modules/leagueclient" },
          { label: "Champ Select", href: "/modules/leagueclient/champselect" },
          { label: "Demo", href: "/modules/leagueclient/champselect/demo", isActive: true }
        ]}
      />
      <ChampSelectDisplay
        data={mockData}
        match={mockMatch}
        tournament={mockTournament}
        teams={[FajnieMiecSklad, LosRatones]}
        roleIcons={roleIcons}
        banPlaceholder={banPlaceholder}
        showControls={showControls}
        onToggleControls={() => setShowControls(!showControls)}
      />
    </div>
  );
};

export default DemoChampSelectPage;
