"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Champion } from "@lib/types/game";
import { getChampionsCached, getChampions } from "@lib/champions";
import { loadListFromLocal } from "@lib/services/common/unified-asset-cache";

interface ChampionContextType {
  champions: Champion[];
  loading: boolean;
  error: string | null;
  refreshChampions: () => Promise<void>;
}

const ChampionContext = createContext<ChampionContextType | undefined>(undefined);

interface ChampionProviderProps {
  children: ReactNode;
}

export const ChampionProvider: React.FC<ChampionProviderProps> = ({ children }) => {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChampions = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to get from unified cache (champions_cache)
      const cachedData = loadListFromLocal<Champion>("champions");
      if (cachedData && cachedData.data.length > 0) {
        setChampions(cachedData.data);
        setLoading(false);
        return;
      }

      // If no unified cache, try the legacy cached function
      const legacyCached = getChampionsCached();
      if (legacyCached.length > 0) {
        setChampions(legacyCached);
        setLoading(false);
        return;
      }

      // If no cache available, fetch from API (this will populate the cache)
      const championsList = await getChampions();
      setChampions(championsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load champions");
      setChampions([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshChampions = async (): Promise<void> => {
    await loadChampions();
  };

  useEffect(() => {
    loadChampions();
  }, []);

  const value: ChampionContextType = {
    champions,
    loading,
    error,
    refreshChampions
  };

  return <ChampionContext.Provider value={value}>{children}</ChampionContext.Provider>;
};

export const useChampions = (): ChampionContextType => {
  const context = useContext(ChampionContext);
  if (context === undefined) {
    throw new Error("useChampions must be used within a ChampionProvider");
  }
  return context;
};
