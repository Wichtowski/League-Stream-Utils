import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkRequiredAssets, type AssetCheckResult } from "@lib/services/assets/checker";
import { useElectron } from "@libElectron/contexts/ElectronContext";

interface UseAssetCheckOptions {
  redirectIfMissing?: boolean;
  checkOnMount?: boolean;
}

interface UseAssetCheckReturn {
  assetCheck: AssetCheckResult | null;
  isLoading: boolean;
  error: string | null;
  checkAssets: () => Promise<void>;
}

/**
 * Hook to check if required assets are present
 * @param options - Configuration options
 * @returns Asset check state and functions
 */
export function useAssetCheck(options: UseAssetCheckOptions = {}): UseAssetCheckReturn {
  const { redirectIfMissing = true, checkOnMount = true } = options;
  const router = useRouter();
  const { isElectron, isElectronLoading } = useElectron();

  const [assetCheck, setAssetCheck] = useState<AssetCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAssets = useCallback(async (): Promise<void> => {
    // Only check in Electron environment
    if (!isElectron) {
      setAssetCheck({
        hasChampions: true,
        hasItems: true,
        hasGameUI: true,
        hasRunes: true,
        allAssetsPresent: true,
        missingCategories: []
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await checkRequiredAssets();
      setAssetCheck(result);

      if (redirectIfMissing && !result.allAssetsPresent) {
        console.log("Missing assets detected:", result.missingCategories);
        console.log("Redirecting to download page...");
        router.push("/download");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error checking assets";
      setError(errorMessage);
      console.error("Error checking assets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isElectron, redirectIfMissing, router]);

  useEffect(() => {
    // Wait until Electron detection is finished
    if (isElectronLoading) return;

    if (checkOnMount) {
      checkAssets();
    }
  }, [isElectron, isElectronLoading, checkOnMount, checkAssets]);

  return {
    assetCheck,
    isLoading,
    error,
    checkAssets
  };
}
