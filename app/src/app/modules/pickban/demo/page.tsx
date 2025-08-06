"use client";

import React, { useState, useEffect } from "react";
import { getDynamicMockData } from "@lib/mocks/dynamic-champselect";
import { getChampions } from "@lib/champions";
import { ChampSelectDisplay } from "@lib/components/pages/leagueclient/champselect/ChampSelectDisplay";
import { Breadcrumbs } from "@lib/components/common/Breadcrumbs";

const DemoPage: React.FC = () => {
  const [mockData, setMockData] = useState<ReturnType<
    typeof getDynamicMockData
  > | null>(null);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    // Initialize mock data on client side
    setMockData(getDynamicMockData());

    // Ensure champions cache is populated
    getChampions().catch(console.error);

    // Update mock data every second
    const interval = setInterval(() => {
      setMockData(getDynamicMockData());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mockData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading demo...</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 p-4">
        <Breadcrumbs items={[
          { label: "Pick & Ban", href: "/modules/pickban" },
          { label: "Demo", href: "/modules/pickban/demo", isActive: true },
        ]} />
      </div>
      <ChampSelectDisplay
        data={mockData}
        isOverlay={false}
        showControls={showControls}
        onToggleControls={() => setShowControls(!showControls)}
      />
    </>
  );
};

export default DemoPage;
