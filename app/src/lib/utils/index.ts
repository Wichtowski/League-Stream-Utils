// Local imports for utility functions
import { AssetValidator } from "./assetManagement/validator";
import { CacheCompletenessChecker } from "./assetManagement/cacheCompletenessChecker";
import type { CacheCompletenessResult } from "./assetManagement/cacheCompletenessChecker";

// DataDragon API Client
export { DataDragonClient } from "./dataDragon/client";
export type { DataDragonVersions, DataDragonResponse } from "./dataDragon/client";

// Asset Validation Utilities
export { AssetValidator } from "./assetManagement/validator";
export type { AssetValidationResult, AssetValidationOptions } from "./assetManagement/validator";

// Cache Completeness Checking
export { CacheCompletenessChecker } from "./assetManagement/cacheCompletenessChecker";
export type { CacheCompletenessResult, CacheValidationOptions } from "./assetManagement/cacheCompletenessChecker";

// Asset Migration Utilities
export { AssetMigrator } from "./assetManagement/migrator";
export type { MigrationResult, MigrationOptions } from "./assetManagement/migrator";

/**
 * Commonly used utility combinations for convenience
 */

// Quick file existence check with proper path generation
export async function checkAssetExists(
  type: "champion" | "item" | "overlay" | "rune",
  version: string,
  ...parts: string[]
): Promise<boolean> {
  const assetKey = AssetValidator.generateAssetKey(type, version, ...parts);
  const cachedPath = AssetValidator.generateCachedPath(assetKey);
  return AssetValidator.checkFileExists(cachedPath);
}

// Quick completeness check for any asset type
export async function quickCompletenessCheck(
  type: "champions" | "items" | "overlayAssets",
  version?: string
): Promise<CacheCompletenessResult> {
  const options = { version, keyFilesOnly: true };

  switch (type) {
    case "champions":
      return CacheCompletenessChecker.checkChampions(options);
    case "items":
      return CacheCompletenessChecker.checkItems(options);
    case "overlayAssets":
      return CacheCompletenessChecker.checkOverlayAssets(options);
    default:
      throw new Error(`Unknown asset type: ${type}`);
  }
}
