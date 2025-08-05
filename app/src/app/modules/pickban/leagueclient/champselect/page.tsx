'use client';

import React, { useEffect, useState } from 'react';
import type { EnhancedChampSelectSession } from '@lib/types';
import { getChampions } from '@lib/champions';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useMockDataContext } from '@lib/contexts/MockDataContext';
import { useLCU } from '@lib/contexts/LCUContext';
import { getDynamicMockData } from '@lib/mocks/dynamic-champselect';
import { ChampSelectDisplay } from '@lib/components/pages/leagueclient/champselect/ChampSelectDisplay';
import { BackButton } from '@lib/components/common/buttons';

const ChampSelectOverlayPage: React.FC = () => {
  const { useMockData } = useMockDataContext();
  const { champSelectSession, isConnected, connect, isConnecting, connectionError: _connectionError } = useLCU();
  const { setActiveModule } = useNavigation();
  
  // Check for URL parameters
  const [urlMockEnabled, setUrlMockEnabled] = useState(false);

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

  // Check URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mockParam = urlParams.get('mock');
      
      setUrlMockEnabled(mockParam === 'true');
    }
  }, []);

  // Auto-connect to LCU when not using mock data and URL mock is not enabled
  useEffect(() => {
    if (!useMockData && !urlMockEnabled && !isConnected && !isConnecting) {
      console.log('Auto-connecting to LCU for overlay...');
      connect().catch(console.error);
    }
  }, [useMockData, urlMockEnabled, isConnected, isConnecting, connect]);

  // Determine which data source to use
  const shouldUseUrlMock = urlMockEnabled;
  const shouldUseContextMock = useMockData && !urlMockEnabled;
  const shouldUseRealData = !shouldUseUrlMock && !shouldUseContextMock;

  // Show loading state when transitioning from mock to real data
  if (isConnecting && !champSelectSession && shouldUseRealData) {
    return <></>;
  }

  // If not connected and no data, don't render
  if (!isConnected && !champSelectSession && shouldUseRealData) {
    return <></>;
  }

  // Use URL mock data if enabled
  if (shouldUseUrlMock) {
    const data = getDynamicMockData();

    // Ensure champions cache is populated
    if (typeof window !== 'undefined') {
      getChampions().catch(console.error);
    }

    return (
      <>
        <div className="mb-4">
          <BackButton to="/modules">Back to Modules</BackButton>
        </div>
        <ChampSelectDisplay 
          data={data}
          isOverlay={true}
          />
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
  if (typeof window !== 'undefined') {
    // Trigger load once; ignore errors
    getChampions().catch(console.error);
  }

  return (
    <>
      <div className="mb-4">
        <BackButton to="/modules">Back to Modules</BackButton>
      </div>
      <ChampSelectDisplay 
        data={data}
        isOverlay={true}
        />
    </>
  );
};

export default ChampSelectOverlayPage;