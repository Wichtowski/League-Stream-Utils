"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface MockDataContextType {
  useMockData: boolean;
  toggleMockData: (enabled: boolean) => void;
  setUseMockData: (enabled: boolean) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export function MockDataProvider({ children }: { children: ReactNode }) {
  let isElectron = false;

  // Check if we're in Electron environment without depending on the context
  if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
    isElectron = true;
  }
  const [useMockData, setUseMockData] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("useMockData");
      return stored === "true";
    }
    return false;
  });

  // Persist to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("useMockData", String(useMockData));
    }
  }, [useMockData]);

  // Function to update Electron with mock data state
  const updateElectronMockData = async (enabled: boolean) => {
    if (isElectron && window.electronAPI?.setMockData) {
      try {
        await window.electronAPI.setMockData(enabled);
      } catch (error) {
        console.error("Failed to update Electron mock data:", error);
      }
    }
  };

  // Listen for mock data toggle from Electron
  useEffect(() => {
    if (isElectron && window.electronAPI?.onMockDataToggle) {
      window.electronAPI.onMockDataToggle((...params: [boolean] | [unknown, boolean]) => {
        const enabled = params.length === 1 ? (params[0] as boolean) : params[1];
        setUseMockData(enabled);
      });

      return () => {
        window.electronAPI?.removeAllListeners("mock-data-toggle");
      };
    }
  }, [isElectron]);

  const toggleMockData = (enabled: boolean) => {
    setUseMockData(enabled);
    updateElectronMockData(enabled);
  };

  const setUseMockDataState = (enabled: boolean) => {
    setUseMockData(enabled);
    updateElectronMockData(enabled);
  };

  const value: MockDataContextType = {
    useMockData,
    toggleMockData,
    setUseMockData: setUseMockDataState
  };

  return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

export function useMockDataContext() {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
}
