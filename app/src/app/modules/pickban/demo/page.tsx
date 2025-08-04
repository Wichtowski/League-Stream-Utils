'use client';

import React, { useState, useEffect } from 'react';
import { getDynamicMockData } from '@lib/mocks/dynamic-champselect';
import { getChampions } from '@lib/champions';
import { ChampSelectDisplay } from '../leagueclient/champselect-overlay/components/ChampSelectDisplay';
import { BackButton } from '@lib/components/common/buttons';

const DemoPage: React.FC = () => {
  const [mockData, setMockData] = useState<ReturnType<typeof getDynamicMockData> | null>(null);
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
      <div className="mb-4">
        <BackButton to="/modules">Back to Modules</BackButton>
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