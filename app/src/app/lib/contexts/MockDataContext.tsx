'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useElectron } from './ElectronContext';

interface MockDataContextType {
  useMockTournamentData: boolean;
  toggleMockTournamentData: () => void;
  setUseMockTournamentData: (enabled: boolean) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const { isElectron } = useElectron();
  const [useMockTournamentData, setUseMockTournamentData] = useState(false);

  // Function to update Electron with mock data state
  const updateElectronMockData = async (enabled: boolean) => {
    if (isElectron && window.electronAPI?.setMockData) {
      try {
        console.log('MockDataContext: Setting mock data to:', enabled);
        await window.electronAPI.setMockData(enabled);
        console.log('MockDataContext: Successfully set mock data');
      } catch (error) {
        console.error('Failed to update Electron mock data:', error);
      }
    } else {
      console.log('MockDataContext: Not in Electron or setMockData not available');
    }
  };

  // Listen for mock data toggle from Electron
  useEffect(() => {
    if (isElectron && window.electronAPI?.onMockDataToggle) {
      const handleMockDataToggle = (enabled: boolean) => {
        setUseMockTournamentData(enabled);
      };

      window.electronAPI.onMockDataToggle(handleMockDataToggle);

      return () => {
        window.electronAPI?.removeAllListeners('mock-data-toggle');
      };
    }
  }, [isElectron]);

  const toggleMockTournamentData = () => {
    const newState = !useMockTournamentData;
    setUseMockTournamentData(newState);
    updateElectronMockData(newState);
  };

  const setUseMockTournamentDataState = (enabled: boolean) => {
    setUseMockTournamentData(enabled);
    updateElectronMockData(enabled);
  };

  const value: MockDataContextType = {
    useMockTournamentData,
    toggleMockTournamentData,
    setUseMockTournamentData: setUseMockTournamentDataState
  };

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
} 