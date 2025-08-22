"use client";

import React, { useEffect, useState } from "react";
import { EnhancedChampSelectSession } from "@lib/types";
import { ChampSelectDisplay } from "@libLeagueClient/components/champselect/ChampSelectDisplay";
import { Breadcrumbs } from "@lib/components/common";
import { getChampions } from "@lib/champions";
import { getLatestVersion } from "@lib/services/common/unified-asset-cache";
import { getDefaultAsset, getAllRoleIconAssets } from "@/libLeagueClient/components/common";
import { getDynamicMockData } from "@lib/mocks/dynamic-champselect";

const DemoChampSelectPage: React.FC = () => {
  const [mockData, setMockData] = useState<EnhancedChampSelectSession | null>(null);
  const [roleIcons, setRoleIcons] = useState<Record<string, string>>({});
  const [banPlaceholder, setBanPlaceholder] = useState<string>("");


  useEffect(() => {
    const init = async (): Promise<void> => {
      await Promise.allSettled([getChampions()]);
      
      const v = await getLatestVersion();
      setBanPlaceholder(getDefaultAsset(v, "default_ban_placeholder.svg"));
      setRoleIcons(getAllRoleIconAssets(v));
      
      setMockData(getDynamicMockData());
    };
    init().catch(console.error);

    const interval = setInterval(() => {
      setMockData(getDynamicMockData());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
        isOverlay={false}
        showControls={true}
      />
    </>
  );
};

export default DemoChampSelectPage;
