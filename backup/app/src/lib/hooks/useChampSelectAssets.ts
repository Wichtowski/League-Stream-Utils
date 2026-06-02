import { useState, useEffect } from "react";
import { champSelectService } from "@lib/services";
import type { ChampSelectAssets } from "@lib/services/champselect";

export interface UseChampSelectAssetsReturn {
  assets: ChampSelectAssets;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export const useChampSelectAssets = (): UseChampSelectAssetsReturn => {
  const [assets, setAssets] = useState<ChampSelectAssets>(champSelectService.getAssets());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssets = async (): Promise<void> => {
    if (champSelectService.isAssetsLoaded()) {
      setAssets(champSelectService.getAssets());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await champSelectService.loadAssets();
      setAssets(champSelectService.getAssets());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load assets";
      setError(errorMessage);
      console.error("Failed to load ChampSelect assets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const reload = async (): Promise<void> => {
    champSelectService.reset();
    await loadAssets();
  };

  // Load assets on mount
  useEffect(() => {
    loadAssets();
  }, []);

  return {
    assets,
    isLoading,
    error,
    reload
  };
};
