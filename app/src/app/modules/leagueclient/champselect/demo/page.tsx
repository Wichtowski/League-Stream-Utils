"use client";

import React, { useEffect, useState, useMemo } from "react";
import { EnhancedChampSelectSession } from "@lib/types";
import { ChampSelectDisplay } from "@libLeagueClient/components/champselect/ChampSelectDisplay";
import { Breadcrumbs } from "@lib/components/common";
import { getChampions } from "@lib/champions";
import { getLatestVersion } from "@lib/services/common/unified-asset-cache";
import { getDefaultAsset, getAllRoleIconAssets } from "@/libLeagueClient/components/common";
import { getDynamicMockData, FajnieMiecSklad, LosRatones } from "@lib/mocks/dynamic-champselect";
import { mockTournament } from "@lib/mocks/game";

const DemoChampSelectPage: React.FC = () => {
  const [mockData, setMockData] = useState<EnhancedChampSelectSession | null>(null);
  const [roleIcons, setRoleIcons] = useState<Record<string, string>>({});
  const [banPlaceholder, setBanPlaceholder] = useState<string>("");

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

    // implement a more targeted approach that only updates specific data
    // rather than the entire mock data object.
    const interval = setInterval(() => {
      // Only update if there are actual changes (e.g., timer updates, phase changes)
      // For now, we'll disable the automatic updates to prevent the API spam
      // setMockData(getDynamicMockData());
    }, 1000);

    return () => clearInterval(interval);
  }, [initialMockData]);

  if (!mockData || !roleIcons || !banPlaceholder) {
    return <></>;
  }

  return (
    <>
      <Breadcrumbs
          items={[
            { label: "League Client", href: "/modules/leagueclient" },
            { label: "Champ Select", href: "/modules/leagueclient/champselect" },
            { label: "Demo", href: "/modules/leagueclient/champselect/demo", isActive: true }
          ]}
      />
      <ChampSelectDisplay
        data={mockData}
        roleIcons={roleIcons}
        banPlaceholder={banPlaceholder}
        tournament={mockTournament}
        teams={[FajnieMiecSklad, LosRatones]}
        isOverlay={false}
        showControls={true}
      />
    </>
  );
};

export default DemoChampSelectPage;
