import { championCacheService } from "./champion";
import { itemCacheService } from "./item";
import { gameUIBlueprintDownloader } from "./game-ui";
import { itemsBlueprintDownloader } from "./item";
import { runesBlueprintDownloader } from "./runes";
import { runeStylesDownloader } from "./rune-styles";
import { summonerSpellCacheService } from "./summoner-spell";
import { assetCounterService, AssetCounts } from "./asset-counter";
import { DownloadProgress } from "./base";

export type AssetCategory = "champion" | "item" | "spell" | "rune" | "game-ui" | "overall";

export interface BootstrapProgress extends DownloadProgress {
  category: AssetCategory;
  totalAssets?: number;
  overallProgress?: {
    completedAssets: number;
    totalAssets: number;
    percentage: number;
  };
}

interface CategoryTracker {
  category: AssetCategory;
  current: number;
  total: number;
  stage: string;
  currentAsset: string;
  completedAssets: number;
}

/**
 * Downloads every asset category that is not yet fully cached.
 * Runs at most three categories in parallel.
 * @param onProgress Callback to receive progress updates.
 */
export const downloadAllAssets = async (onProgress?: (progress: BootstrapProgress) => void): Promise<void> => {
  // First, get accurate total asset counts
  let totalAssetCounts: AssetCounts | null = null;

  try {
    onProgress?.({
      current: 0,
      total: 0,
      itemName: "Calculating total assets...",
      stage: "checking",
      percentage: 0,
      category: "overall", // This is overall calculation, not champion-specific
      currentAsset: "Calculating total assets..."
    });

    totalAssetCounts = await assetCounterService.getTotalAssetCounts();

    onProgress?.({
      current: 0,
      total: totalAssetCounts.total,
      itemName: `Found ${totalAssetCounts.total} total assets`,
      stage: "checking",
      percentage: 0,
      category: "overall", // This is overall progress, not champion-specific
      currentAsset: `Found ${totalAssetCounts.total} total assets`,
      totalAssets: totalAssetCounts.total,
      overallProgress: {
        completedAssets: 0,
        totalAssets: totalAssetCounts.total,
        percentage: 0
      }
    });
  } catch (error) {
    console.warn("Failed to get total asset counts:", error);
  }

  const categoryTrackers = new Map<AssetCategory, CategoryTracker>([
    [
      "champion",
      {
        category: "champion",
        current: 0,
        total: totalAssetCounts?.champions || 0,
        stage: "waiting",
        currentAsset: "Waiting...",
        completedAssets: 0
      }
    ],
    [
      "item",
      {
        category: "item",
        current: 0,
        total: totalAssetCounts?.items || 0,
        stage: "waiting",
        currentAsset: "Waiting...",
        completedAssets: 0
      }
    ],
    [
      "game-ui",
      {
        category: "game-ui",
        current: 0,
        total: totalAssetCounts?.gameUI || 0,
        stage: "waiting",
        currentAsset: "Waiting...",
        completedAssets: 0
      }
    ],
    [
      "spell",
      {
        category: "spell",
        current: 0,
        total: totalAssetCounts?.spells || 0,
        stage: "waiting",
        currentAsset: "Waiting...",
        completedAssets: 0
      }
    ],
    [
      "rune",
      {
        category: "rune",
        current: 0,
        total: totalAssetCounts?.runes || 0,
        stage: "waiting",
        currentAsset: "Waiting...",
        completedAssets: 0
      }
    ]
  ]);

  const updateOverallProgress = (): void => {
    if (!totalAssetCounts) return;

    // Calculate overall progress across all categories
    let totalCompletedAssets = 0;
    for (const tracker of categoryTrackers.values()) {
      totalCompletedAssets += tracker.completedAssets;
    }

    const overallPercentage =
      totalAssetCounts.total > 0 ? Math.round((totalCompletedAssets / totalAssetCounts.total) * 100) : 0;

    // Send an overall progress update
    onProgress?.({
      current: totalCompletedAssets,
      total: totalAssetCounts.total,
      itemName: "Overall Progress",
      stage: "downloading",
      percentage: overallPercentage,
      category: "overall", // This is overall progress, not champion-specific
      currentAsset: `${totalCompletedAssets}/${totalAssetCounts.total} assets completed`,
      totalAssets: totalAssetCounts.total,
      overallProgress: {
        completedAssets: totalCompletedAssets,
        totalAssets: totalAssetCounts.total,
        percentage: overallPercentage
      }
    });
  };

  // Champion download task ---------------------------------------------------
  const championTask = async (): Promise<void> => {
    const tracker = categoryTrackers.get("champion")!;

    championCacheService.onProgress((p) => {
      tracker.current = p.current;
      // DON'T override tracker.total - keep the original value (1539)
      tracker.stage = p.stage;
      tracker.currentAsset = p.currentAsset || p.itemName || "champion";

      // Update completed assets for overall progress
      tracker.completedAssets = p.current;

      onProgress?.({
        current: tracker.current,
        total: tracker.total,
        itemName: p.itemName,
        stage: p.stage,
        percentage: tracker.total > 0 ? Math.round((tracker.current / tracker.total) * 100) : 0,
        assetType: p.assetType,
        currentAsset: p.currentAsset,
        category: "champion",
        totalAssets: totalAssetCounts?.total || 0,
        overallProgress: totalAssetCounts
          ? {
              completedAssets: tracker.completedAssets,
              totalAssets: totalAssetCounts.total,
              percentage: Math.round((tracker.completedAssets / totalAssetCounts.total) * 100)
            }
          : undefined
      });
      updateOverallProgress();
    });

    tracker.stage = "checking";
    tracker.currentAsset = "Checking champions...";
    onProgress?.({
      current: 0,
      total: tracker.total,
      itemName: "champions",
      stage: "checking",
      percentage: 0,
      category: "champion",
      totalAssets: totalAssetCounts?.total,
      overallProgress: totalAssetCounts
        ? {
            completedAssets: 0,
            totalAssets: totalAssetCounts.total,
            percentage: 0
          }
        : undefined
    });

    // Download all individual champions (service fetches champion list internally)
    await championCacheService.downloadAllChampionsOnStartup();

    // Don't override the final progress - let the service report it
  };

  // Item download task -------------------------------------------------------
  const itemTask = async (): Promise<void> => {
    const tracker = categoryTrackers.get("item")!;

    // Set up progress callback for items blueprint downloader
    itemsBlueprintDownloader.onProgress((p) => {
      tracker.current = p.current;
      tracker.total = p.total;
      tracker.stage = p.stage;
      tracker.currentAsset = p.currentAsset || p.itemName || "item";

      // Update completed assets for overall progress
      tracker.completedAssets = p.current;

      onProgress?.({
        ...p,
        category: "item",
        totalAssets: totalAssetCounts?.total,
        overallProgress: totalAssetCounts
          ? {
              completedAssets: tracker.completedAssets,
              totalAssets: totalAssetCounts.total,
              percentage: Math.round((tracker.completedAssets / totalAssetCounts.total) * 100)
            }
          : undefined
      });
      updateOverallProgress();
    });

    // First download the items blueprint
    await itemsBlueprintDownloader.downloadBlueprintForCurrentVersion();

    // Set up progress callback for items service
    itemCacheService.onProgress((p) => {
      tracker.current = p.current;
      tracker.total = p.total;
      tracker.stage = p.stage;
      tracker.currentAsset = p.currentAsset || p.itemName || "item";

      // Update completed assets for overall progress
      tracker.completedAssets = p.current;

      onProgress?.({
        ...p,
        category: "item",
        totalAssets: totalAssetCounts?.total,
        overallProgress: totalAssetCounts
          ? {
              completedAssets: tracker.completedAssets,
              totalAssets: totalAssetCounts.total,
              percentage: Math.round((tracker.completedAssets / totalAssetCounts.total) * 100)
            }
          : undefined
      });
      updateOverallProgress();
    });

    // Then download all individual items
    await itemCacheService.downloadAllItemsOnStartup();

    // Don't override the final progress - let the service report it
  };

  // Game UI assets download task ---------------------------------------------
  const gameUITask = async (): Promise<void> => {
    const tracker = categoryTrackers.get("game-ui")!;

    gameUIBlueprintDownloader.onGameUIProgress((p) => {
      tracker.current = p.current;
      tracker.total = p.total;
      tracker.stage = p.stage;
      tracker.currentAsset = p.currentAsset || p.message || "game-ui-assets";

      // Update completed assets for overall progress
      tracker.completedAssets = p.current;

      onProgress?.({
        current: p.current,
        total: p.total,
        itemName: p.currentAsset || p.message || "game-ui-assets",
        stage: p.stage,
        percentage: p.total > 0 ? Math.round((p.current / p.total) * 100) : 0,
        category: "game-ui",
        totalAssets: totalAssetCounts?.total,
        overallProgress: totalAssetCounts
          ? {
              completedAssets: tracker.completedAssets,
              totalAssets: totalAssetCounts.total,
              percentage: Math.round((tracker.completedAssets / totalAssetCounts.total) * 100)
            }
          : undefined
      });
      updateOverallProgress();
    });

    tracker.stage = "checking";
    tracker.currentAsset = "Checking game UI assets...";
    onProgress?.({
      current: 0,
      total: tracker.total,
      itemName: "game-ui-assets",
      stage: "checking",
      percentage: 0,
      category: "game-ui",
      totalAssets: totalAssetCounts?.total,
      overallProgress: totalAssetCounts
        ? {
            completedAssets: 0,
            totalAssets: totalAssetCounts.total,
            percentage: 0
          }
        : undefined
    });

    try {
      await gameUIBlueprintDownloader.downloadAllGameUIBlueprint();

      // Don't override the final progress - let the service report it
    } catch (error) {
      console.error("Game UI assets download failed:", error);
      tracker.stage = "error";
      tracker.currentAsset = "Game UI assets failed";
      onProgress?.({
        current: 0,
        total: 0,
        itemName: "game-ui-assets",
        stage: "error",
        percentage: 0,
        category: "game-ui",
        totalAssets: totalAssetCounts?.total
      });
    }
  };

  // Summoner spell download task -------------------------------------------------------
  const spellTask = async (): Promise<void> => {
    const tracker = categoryTrackers.get("spell")!;

    summonerSpellCacheService.onProgress((p) => {
      tracker.current = p.current;
      tracker.total = p.total;
      tracker.stage = p.stage;
      tracker.currentAsset = p.currentAsset || p.itemName || "spell";

      // Update completed assets for overall progress
      tracker.completedAssets = p.current;

      onProgress?.({
        ...p,
        category: "spell",
        totalAssets: totalAssetCounts?.total,
        overallProgress: totalAssetCounts
          ? {
              completedAssets: tracker.completedAssets,
              totalAssets: totalAssetCounts.total,
              percentage: Math.round((tracker.completedAssets / totalAssetCounts.total) * 100)
            }
          : undefined
      });
      updateOverallProgress();
    });

    tracker.stage = "checking";
    tracker.currentAsset = "Checking summoner spells...";
    onProgress?.({
      current: 0,
      total: tracker.total,
      itemName: "summoner-spells",
      stage: "checking",
      percentage: 0,
      category: "spell",
      totalAssets: totalAssetCounts?.total,
      overallProgress: totalAssetCounts
        ? {
            completedAssets: 0,
            totalAssets: totalAssetCounts.total,
            percentage: 0
          }
        : undefined
    });

    try {
      await summonerSpellCacheService.downloadAllSummonerSpellsOnStartup();
      console.log("Summoner spells download completed successfully");

      // Don't override the final progress - let the service report it
    } catch (error) {
      console.error("Error downloading summoner spells:", error);
      tracker.stage = "error";
      tracker.currentAsset = "Failed to download summoner spells";
      onProgress?.({
        current: 0,
        total: 0,
        itemName: "summoner-spells",
        stage: "error",
        percentage: 0,
        category: "spell",
        totalAssets: totalAssetCounts?.total
      });
    }
  };

  const runeTask = async (): Promise<void> => {
    console.log("Starting rune task...");
    const tracker = categoryTrackers.get("rune")!;

    const handleProgress = (p: DownloadProgress): void => {
      tracker.current = p.current;
      tracker.total = p.total;
      tracker.stage = p.stage;
      tracker.currentAsset = p.currentAsset || p.itemName || "rune";

      // Update completed assets for overall progress
      tracker.completedAssets = p.current;

      onProgress?.({
        ...p,
        category: "rune",
        totalAssets: totalAssetCounts?.total,
        overallProgress: totalAssetCounts
          ? {
              completedAssets: tracker.completedAssets,
              totalAssets: totalAssetCounts.total,
              percentage: Math.round((tracker.completedAssets / totalAssetCounts.total) * 100)
            }
          : undefined
      });
      updateOverallProgress();
    };

    runesBlueprintDownloader.onProgress(handleProgress);
    runeStylesDownloader.onProgress(handleProgress);

    tracker.stage = "checking";
    tracker.currentAsset = "Checking runes...";
    onProgress?.({
      current: 0,
      total: tracker.total,
      itemName: "runes",
      stage: "checking",
      percentage: 0,
      category: "rune",
      totalAssets: totalAssetCounts?.total,
      overallProgress: totalAssetCounts
        ? {
            completedAssets: 0,
            totalAssets: totalAssetCounts.total,
            percentage: 0
          }
        : undefined
    });

    try {
      // Download rune trees (all perk icons)
      await runesBlueprintDownloader.downloadBlueprintForCurrentVersion();
      // Download rune style tree badges (7200_* files)
      await runeStylesDownloader.download();
      console.log("Runes download completed successfully");

      // Don't override the final progress - let the service report it
    } catch (error) {
      console.error("Error downloading runes:", error);
      tracker.stage = "error";
      tracker.currentAsset = "Failed to download runes";
      onProgress?.({
        current: 0,
        total: 0,
        itemName: "runes",
        stage: "error",
        percentage: 0,
        category: "rune",
        totalAssets: totalAssetCounts?.total
      });
    }
  };

  const tasks: Array<() => Promise<void>> = [runeTask, championTask, itemTask, gameUITask, spellTask];

  // Run tasks with concurrency
  let running = 0;
  let index = 0;

  await new Promise<void>((resolve, reject) => {
    const launchNext = (): void => {
      console.log(`launchNext: index=${index}, running=${running}, tasks.length=${tasks.length}`);
      if (index >= tasks.length && running === 0) {
        console.log("All tasks completed");
        resolve();
        return;
      }

      while (running < 5 && index < tasks.length) {
        const taskIndex = index;
        const task = tasks[index++];
        running += 1;
        console.log(`Starting task ${taskIndex} (running: ${running})`);
        task()
          .catch((err) => {
            console.error(`Task ${taskIndex} failed:`, err);
            reject(err);
          })
          .finally(() => {
            running -= 1;
            console.log(`Task ${taskIndex} completed (running: ${running})`);
            launchNext();
          });
      }
    };

    launchNext();
  });

  // No final completion notification needed - each service reports its own completion
};
