'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useElectron } from './ElectronContext';

interface MockDataContextType {
  useMockTournamentData: boolean;
  toggleMockTournamentData: (enabled: boolean) => void;
  setUseMockTournamentData: (enabled: boolean) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export function MockDataProvider({ children }: { children: ReactNode }) {
  const { isElectron } = useElectron();
  const [useMockTournamentData, setUseMockTournamentData] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('useMockTournamentData');
      return stored === 'true';
    }
    return false;
  });

  // Persist to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('useMockTournamentData', String(useMockTournamentData));
    }
  }, [useMockTournamentData]);

  // Function to update Electron with mock data state
  const updateElectronMockData = async (enabled: boolean) => {
    if (isElectron && window.electronAPI?.setMockData) {
      try {
        await window.electronAPI.setMockData(enabled);
      } catch (error) {
        console.error('Failed to update Electron mock data:', error);
      }
    }
  };

  // Listen for mock data toggle from Electron
  useEffect(() => {
    if (isElectron && window.electronAPI?.onMockDataToggle) {
      window.electronAPI.onMockDataToggle((...params: [boolean] | [unknown, boolean]) => {
        const enabled = params.length === 1 ? params[0] as boolean : params[1];
        setUseMockTournamentData(enabled);
      });

      return () => {
        window.electronAPI?.removeAllListeners('mock-data-toggle');
      };
    }
  }, [isElectron]);

  const toggleMockTournamentData = (enabled: boolean) => {
    setUseMockTournamentData(enabled);
    updateElectronMockData(enabled);
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