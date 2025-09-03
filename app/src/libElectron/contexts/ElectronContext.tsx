"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { assetDownloaderManager } from "@lib/services/assets";

interface ElectronContextType {
  isElectron: boolean;
  isElectronLoading: boolean;
  useLocalData: boolean;
  setUseLocalData: (value: boolean) => void;
  electronAPI: typeof window.electronAPI | undefined;
}

const ElectronContext = createContext<ElectronContextType | undefined>(undefined);

export function ElectronProvider({ children }: { children: ReactNode }) {
  const [isElectron, setIsElectron] = useState(false);
  const [isElectronLoading, setIsElectronLoading] = useState(true);
  const [useLocalData, setUseLocalData] = useState(false);
  const [electronAPI, setElectronAPI] = useState<typeof window.electronAPI | undefined>(undefined);

  useEffect(() => {
    // Use cache only when it says we're in Electron; otherwise verify live
    if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
      setIsElectron(true);
      setElectronAPI(window.electronAPI);

      // Resume background processes after startup
      assetDownloaderManager.resumeAllProcesses().catch(() => {
        console.warn("Failed to resume background processes");
      });

      // Disable mode switching state after startup
      if (window.electronAPI?.setModeSwitching) {
        window.electronAPI.setModeSwitching(false).catch(() => {
          console.warn("Failed to disable mode switching state");
        });
      }

      // Load saved preference for local data mode
      const savedLocalDataMode = localStorage.getItem("electron-use-local-data");
      if (savedLocalDataMode !== null) {
        setUseLocalData(savedLocalDataMode === "true");
      } else {
        setUseLocalData(true);
        localStorage.setItem("electron-use-local-data", "true");
      }

      setIsElectronLoading(false);
      return;
    }

    // Check if running in Electron environment
    const checkElectron = () => {
      console.log("Checking Electron environment...");

      if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
        console.log("Electron detected! Setting up Electron context...");
        setIsElectron(true);
        setElectronAPI(window.electronAPI);

        // Resume background processes after startup
        assetDownloaderManager.resumeAllProcesses().catch(() => {
          console.warn("Failed to resume background processes");
        });

        // Disable mode switching state after startup
        if (window.electronAPI?.setModeSwitching) {
          window.electronAPI.setModeSwitching(false).catch(() => {
            console.warn("Failed to disable mode switching state");
          });
        }

        // Load saved preference for local data mode
        const savedLocalDataMode = localStorage.getItem("electron-use-local-data");
        console.log("Saved local data mode:", savedLocalDataMode);

        if (savedLocalDataMode !== null) {
          setUseLocalData(savedLocalDataMode === "true");
        } else {
          // First time user - default to local mode for better UX
          console.log("First time user, defaulting to local data mode");
          setUseLocalData(true);
          localStorage.setItem("electron-use-local-data", "true");
        }
      } else {
        console.log("Not running in Electron environment");
      }
      setIsElectronLoading(false);
    };

    // Use requestIdleCallback for better performance if available
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      (window as unknown as Window).requestIdleCallback(checkElectron, {
        timeout: 100
      });
    } else {
      // Fallback to setTimeout for immediate execution
      setTimeout(checkElectron, 0);
    }
  }, []);

  const handleSetUseLocalData = (value: boolean) => {
    setUseLocalData(value);
    if (isElectron) {
      localStorage.setItem("electron-use-local-data", value.toString());
    }
  };

  const value = {
    isElectron,
    isElectronLoading,
    useLocalData,
    setUseLocalData: handleSetUseLocalData,
    electronAPI
  };

  return <ElectronContext.Provider value={value}>{children}</ElectronContext.Provider>;
}

export function useElectron() {
  const context = useContext(ElectronContext);
  if (context === undefined) {
    throw new Error("useElectron must be used within an ElectronProvider");
  }
  return context;
}
