// Local imports for utility functions
import { AssetValidator } from './asset-validator';
import { CacheCompletenessChecker } from './cache-completeness-checker';
import type { CacheCompletenessResult } from './cache-completeness-checker';

// DataDragon API Client
export { DataDragonClient } from './datadragon-client';
export type { DataDragonVersions, DataDragonResponse } from './datadragon-client';

// Asset Validation Utilities
export { AssetValidator } from './asset-validator';
export type { AssetValidationResult, AssetValidationOptions } from './asset-validator';

// Cache Completeness Checking
export { CacheCompletenessChecker } from './cache-completeness-checker';
export type { CacheCompletenessResult, CacheValidationOptions } from './cache-completeness-checker';

// Asset Migration Utilities
export { AssetMigrator } from './asset-migrator';
export type { MigrationResult, MigrationOptions } from './asset-migrator';

/**
 * Commonly used utility combinations for convenience
 */

// Quick file existence check with proper path generation
export async function checkAssetExists(type: 'champion' | 'item' | 'overlay' | 'rune', version: string, ...parts: string[]): Promise<boolean> {
    const assetKey = AssetValidator.generateAssetKey(type, version, ...parts);
    const cachedPath = AssetValidator.generateCachedPath(assetKey);
    return AssetValidator.checkFileExists(cachedPath);
}

// Quick completeness check for any asset type
export async function quickCompletenessCheck(type: 'champions' | 'items' | 'overlayAssets', version?: string): Promise<CacheCompletenessResult> {
    const options = { version, keyFilesOnly: true };

    switch (type) {
        case 'champions':
            return CacheCompletenessChecker.checkChampions(options);
        case 'items':
            return CacheCompletenessChecker.checkItems(options);
        case 'overlayAssets':
            return CacheCompletenessChecker.checkOverlayAssets(options);
        default:
            throw new Error(`Unknown asset type: ${type}`);
    }
} 