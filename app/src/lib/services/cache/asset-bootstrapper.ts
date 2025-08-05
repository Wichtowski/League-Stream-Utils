import { championCacheService } from "./champion";
import { itemCacheService } from "./item";
import { gameUIBlueprintDownloader } from "../blueprints/game-ui-blueprint-downloader";
import { itemsBlueprintDownloader } from "../blueprints/items-blueprint-downloader";
import { championsBlueprintDownloader } from "../blueprints/champions-blueprint-downloader";
import { runesBlueprintDownloader } from "../blueprints/runes-blueprint-downloader";
import { DownloadProgress } from "./base";

export type AssetCategory = "champion" | "item" | "spell" | "rune" | "game-ui";

export interface BootstrapProgress extends DownloadProgress {
  category: AssetCategory;
}

interface CategoryTracker {
  category: AssetCategory;
  current: number;
  total: number;
  stage: string;
  currentAsset: string;
}

/**
 * Downloads every asset category that is not yet fully cached.
 * Runs at most three categories in parallel.
 * @param onProgress Callback to receive progress updates.
 */
export const downloadAllAssets = async (
  onProgress?: (progress: BootstrapProgress) => void,
): Promise<void> => {
  const categoryTrackers = new Map<AssetCategory, CategoryTracker>([
    [
      "champion",
      {
        category: "champion",
        current: 0,
        total: 0,
        stage: "waiting",
        currentAsset: "Waiting...",
      },
    ],
    [
      "item",
      {
        category: "item",
        current: 0,
        total: 0,
        stage: "waiting",
        currentAsset: "Waiting...",
      },
    ],
    [
      "game-ui",
      {
        category: "game-ui",
        current: 0,
        total: 0,
        stage: "waiting",
        currentAsset: "Waiting...",
      },
    ],
    [
      "spell",
      {
        category: "spell",
        current: 0,
        total: 0,
        stage: "waiting",
        currentAsset: "Waiting...",
      },
    ],
    [
      "rune",
      {
        category: "rune",
        current: 0,
        total: 0,
        stage: "waiting",
        currentAsset: "Waiting...",
      },
    ],
  ]);

  const updateOverallProgress = (): void => {
    // Don't send overall progress updates that interfere with individual category progress
    // Each category should handle its own progress reporting
    return;
  };

  // Champion download task ---------------------------------------------------
  const championTask = async (): Promise<void> => {
    const tracker = categoryTrackers.get("champion")!;

    championCacheService.onProgress((p) => {
      tracker.current = p.current;
      tracker.total = p.total;
      tracker.stage = p.stage;
      tracker.currentAsset = p.currentAsset || p.itemName || "champion";

      onProgress?.({ ...p, category: "champion" });
      updateOverallProgress();
    });

    tracker.stage = "checking";
    tracker.currentAsset = "Checking champions...";
    onProgress?.({
      current: 0,
      total: 0,
      itemName: "champions",
      stage: "checking",
      percentage: 0,
      category: "champion",
    });

    // First download the champions blueprint
    await championsBlueprintDownloader.downloadBlueprintForCurrentVersion();

    // Then download all individual champions
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

      onProgress?.({ ...p, category: "item" });
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

      onProgress?.({ ...p, category: "item" });
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

      onProgress?.({
        current: p.current,
        total: p.total,
        itemName: p.currentAsset || p.message || "game-ui-assets",
        stage: p.stage,
        percentage: p.total > 0 ? Math.round((p.current / p.total) * 100) : 0,
        category: "game-ui",
      });
      updateOverallProgress();
    });

    tracker.stage = "checking";
    tracker.currentAsset = "Checking game UI assets...";
    onProgress?.({
      current: 0,
      total: 0,
      itemName: "game-ui-assets",
      stage: "checking",
      percentage: 0,
      category: "game-ui",
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
      });
    }
  };

  // Placeholder spell/rune tasks (no-op for now) -----------------------------
  const spellTask = async (): Promise<void> => {
    const tracker = categoryTrackers.get("spell")!;
    tracker.stage = "complete";
    tracker.currentAsset = "Spells not implemented";
    onProgress?.({
      current: 0,
      total: 0,
      itemName: "spells",
      stage: "complete",
      percentage: 100,
      category: "spell",
    });
  };

  const runeTask = async (): Promise<void> => {
    console.log("Starting rune task...");
    const tracker = categoryTrackers.get("rune")!;

    runesBlueprintDownloader.onProgress((p) => {
      tracker.current = p.current;
      tracker.total = p.total;
      tracker.stage = p.stage;
      tracker.currentAsset = p.currentAsset || p.itemName || "rune";

      onProgress?.({ ...p, category: "rune" });
      updateOverallProgress();
    });

    tracker.stage = "checking";
    tracker.currentAsset = "Checking runes...";
    onProgress?.({
      current: 0,
      total: 0,
      itemName: "runes",
      stage: "checking",
      percentage: 0,
      category: "rune",
    });

    try {
      await runesBlueprintDownloader.downloadBlueprintForCurrentVersion();
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
      });
    }
  };

  const tasks: Array<() => Promise<void>> = [
    runeTask,
    championTask,
    itemTask,
    gameUITask,
    spellTask,
  ];

  // Run tasks with concurrency
  let running = 0;
  let index = 0;

  await new Promise<void>((resolve, reject) => {
    const launchNext = (): void => {
      console.log(
        `launchNext: index=${index}, running=${running}, tasks.length=${tasks.length}`,
      );
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
