import { championCacheService } from "../services/cache/champion";
import { itemCacheService } from "../services/cache/item";
import { gameUIBlueprintDownloader } from "../services/blueprints/game-ui-blueprint-downloader";
import { runesBlueprintDownloader } from "../services/blueprints/runes-blueprint-downloader";
import { NextRouter } from "next/router";

export interface AssetCheckResult {
  hasChampions: boolean;
  hasItems: boolean;
  hasGameUI: boolean;
  hasRunes: boolean;
  allAssetsPresent: boolean;
  missingCategories: string[];
}

/**
 * Checks if all required assets are present
 * @returns Promise<AssetCheckResult> - Result of the asset check
 */
export async function checkRequiredAssets(): Promise<AssetCheckResult> {
  const result: AssetCheckResult = {
    hasChampions: false,
    hasItems: false,
    hasGameUI: false,
    hasRunes: false,
    allAssetsPresent: false,
    missingCategories: []
  };

  try {
    // Check champions
    try {
      const championStats = await championCacheService.getCacheStats();
      result.hasChampions = championStats.totalChampions > 0;
    } catch (error) {
      console.warn("Failed to check champion assets:", error);
      result.hasChampions = false;
    }

    // Check items
    try {
      const itemStats = await itemCacheService.getCacheStats();
      result.hasItems = itemStats.totalItems > 0;
    } catch (error) {
      console.warn("Failed to check item assets:", error);
      result.hasItems = false;
    }

    // Check game UI
    try {
      const gameUIStatus = await gameUIBlueprintDownloader.checkOverlayAssetsStatus();
      result.hasGameUI = gameUIStatus.hasAssets && gameUIStatus.totalCount > 0;
    } catch (error) {
      console.warn("Failed to check game UI assets:", error);
      result.hasGameUI = false;
    }

    // Check runes
    try {
      const runeStats = await runesBlueprintDownloader.getCacheStats();
      result.hasRunes = runeStats.totalItems > 0;
    } catch (error) {
      console.warn("Failed to check rune assets:", error);
      result.hasRunes = false;
    }

    // Determine missing categories
    if (!result.hasChampions) result.missingCategories.push("champions");
    if (!result.hasItems) result.missingCategories.push("items");
    if (!result.hasGameUI) result.missingCategories.push("game-ui");
    if (!result.hasRunes) result.missingCategories.push("runes");

    result.allAssetsPresent = result.missingCategories.length === 0;

    return result;
  } catch (error) {
    console.error("Error checking required assets:", error);
    // If we can't check, assume assets are missing
    result.missingCategories = ["champions", "items", "game-ui", "runes"];
    result.allAssetsPresent = false;
    return result;
  }
}

/**
 * Checks if required assets are present and redirects to download page if missing
 * @param router - Next.js router instance
 * @returns Promise<boolean> - true if assets are present, false if redirected
 */
export async function checkAndRedirectIfMissing(router: NextRouter): Promise<boolean> {
  const result = await checkRequiredAssets();

  if (!result.allAssetsPresent) {
    console.log("Missing assets detected:", result.missingCategories);
    console.log("Redirecting to download page...");
    router.push("/download/assets");
    return false;
  }

  console.log("All required assets are present");
  return true;
}
