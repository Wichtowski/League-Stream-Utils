import { AssetValidator } from './asset-validator';
import { DataDragonClient } from './datadragon-client';

export interface CacheCompletenessResult {
    isComplete: boolean;
    missingItems: string[];
    totalItems: number;
    cachedItems: number;
}

export interface CacheValidationOptions {
    checkFiles?: boolean;
    keyFilesOnly?: boolean;
    version?: string;
}

/**
 * Centralized cache completeness checker to eliminate duplicate verification logic
 */
export class CacheCompletenessChecker {
    /**
     * Check champion cache completeness
     */
    static async checkChampions(options: CacheValidationOptions = {}): Promise<CacheCompletenessResult> {
        const { checkFiles = true, keyFilesOnly = true, version } = options;

        try {
            const actualVersion = version || await DataDragonClient.getLatestVersion();

            // Get all champions from DataDragon
            const championsResponse = await DataDragonClient.getChampions(actualVersion);
            const allChampionKeys = Object.keys(championsResponse.data);

            if (!checkFiles) {
                return {
                    isComplete: false,
                    missingItems: allChampionKeys,
                    totalItems: allChampionKeys.length,
                    cachedItems: 0
                };
            }

            const missingChampions: string[] = [];

            for (const championKey of allChampionKeys) {
                if (keyFilesOnly) {
                    // Only check the key file (square image) for quick validation
                    const squareImagePath = AssetValidator.generateCachedPath(
                        AssetValidator.generateAssetKey('champion', actualVersion, championKey, 'square.png')
                    );
                    const exists = await AssetValidator.checkFileExists(squareImagePath);

                    if (!exists) {
                        missingChampions.push(championKey);
                    }
                } else {
                    // Check all champion files (more thorough but slower)
                    const requiredFiles = ['square.png', 'splash.jpg', 'splashCentered.jpg', 'loading.jpg'];
                    let allFilesExist = true;

                    for (const fileName of requiredFiles) {
                        const filePath = AssetValidator.generateCachedPath(
                            AssetValidator.generateAssetKey('champion', actualVersion, championKey, fileName)
                        );
                        const exists = await AssetValidator.checkFileExists(filePath);

                        if (!exists) {
                            allFilesExist = false;
                            break;
                        }
                    }

                    if (!allFilesExist) {
                        missingChampions.push(championKey);
                    }
                }
            }

            return {
                isComplete: missingChampions.length === 0,
                missingItems: missingChampions,
                totalItems: allChampionKeys.length,
                cachedItems: allChampionKeys.length - missingChampions.length
            };

        } catch (error) {
            console.error('Error checking champion cache completeness:', error);
            return {
                isComplete: false,
                missingItems: [],
                totalItems: 0,
                cachedItems: 0
            };
        }
    }

    /**
     * Check item cache completeness
     */
    static async checkItems(options: CacheValidationOptions = {}): Promise<CacheCompletenessResult> {
        const { checkFiles = true, keyFilesOnly = true, version } = options;

        try {
            const actualVersion = version || await DataDragonClient.getLatestVersion();

            // Get all items from DataDragon
            const itemsResponse = await DataDragonClient.getItems(actualVersion);
            const allItemKeys = Object.keys(itemsResponse.data);

            if (!checkFiles) {
                return {
                    isComplete: false,
                    missingItems: allItemKeys,
                    totalItems: allItemKeys.length,
                    cachedItems: 0
                };
            }

            const missingItems: string[] = [];

            for (const itemKey of allItemKeys) {
                if (keyFilesOnly) {
                    // Only check the icon file for quick validation
                    const iconPath = AssetValidator.generateCachedPath(
                        AssetValidator.generateAssetKey('item', actualVersion, itemKey, 'icon.png')
                    );
                    const exists = await AssetValidator.checkFileExists(iconPath);

                    if (!exists) {
                        missingItems.push(itemKey);
                    }
                } else {
                    // Check both data and icon files
                    const iconPath = AssetValidator.generateCachedPath(
                        AssetValidator.generateAssetKey('item', actualVersion, itemKey, 'icon.png')
                    );
                    const iconExists = await AssetValidator.checkFileExists(iconPath);

                    if (!iconExists) {
                        missingItems.push(itemKey);
                    }
                }
            }

            return {
                isComplete: missingItems.length === 0,
                missingItems,
                totalItems: allItemKeys.length,
                cachedItems: allItemKeys.length - missingItems.length
            };

        } catch (error) {
            console.error('Error checking item cache completeness:', error);
            return {
                isComplete: false,
                missingItems: [],
                totalItems: 0,
                cachedItems: 0
            };
        }
    }

    /**
     * Check overlay assets completeness
     */
    static async checkOverlayAssets(options: CacheValidationOptions = {}): Promise<CacheCompletenessResult> {
        const { checkFiles = true, version } = options;

        try {
            const actualVersion = version || await DataDragonClient.getLatestVersion();

            // Define known overlay asset categories and files
            const overlayAssets = {
                'dragonpit': ['infernal.png', 'ocean.png', 'hextech.png', 'chemtech.png', 'mountain.png', 'elder.png', 'cloud.png'],
                'default': ['player.png'],
                'scoreboard': ['gold.png', 'grubs.png', 'tower.png'],
                'atakhan': ['atakhan_ruinous.png', 'atakhan_voracious.png'],
                'baronpit': ['baron.png', 'grubs.png', 'herald.png']
            };

            const allAssetKeys: string[] = [];
            Object.entries(overlayAssets).forEach(([category, files]) => {
                files.forEach(file => {
                    allAssetKeys.push(`${category}/${file}`);
                });
            });

            if (!checkFiles) {
                return {
                    isComplete: false,
                    missingItems: allAssetKeys,
                    totalItems: allAssetKeys.length,
                    cachedItems: 0
                };
            }

            const missingAssets: string[] = [];

            for (const assetKey of allAssetKeys) {
                const [category, filename] = assetKey.split('/');
                const filePath = AssetValidator.generateCachedPath(
                    `game/${actualVersion}/overlay/${category}/${filename}`
                );
                const exists = await AssetValidator.checkFileExists(filePath);

                if (!exists) {
                    missingAssets.push(assetKey);
                }
            }

            return {
                isComplete: missingAssets.length === 0,
                missingItems: missingAssets,
                totalItems: allAssetKeys.length,
                cachedItems: allAssetKeys.length - missingAssets.length
            };

        } catch (error) {
            console.error('Error checking overlay assets completeness:', error);
            return {
                isComplete: false,
                missingItems: [],
                totalItems: 0,
                cachedItems: 0
            };
        }
    }

    /**
     * Check completeness using category manifest (faster for large sets)
     */
    static async checkCompletenessFromManifest(
        category: string,
        expectedItems: string[],
        loadCategoryManifestFn: (category: string) => Promise<{ completedItems: string[] }>
    ): Promise<CacheCompletenessResult> {
        try {
            const manifest = await loadCategoryManifestFn(category);
            const completedItems = manifest?.completedItems || [];

            const missingItems = expectedItems.filter(item => !completedItems.includes(item));

            return {
                isComplete: missingItems.length === 0,
                missingItems,
                totalItems: expectedItems.length,
                cachedItems: completedItems.length
            };
        } catch (error) {
            console.error(`Error checking ${category} completeness from manifest:`, error);
            return {
                isComplete: false,
                missingItems: expectedItems,
                totalItems: expectedItems.length,
                cachedItems: 0
            };
        }
    }

    /**
     * Comprehensive cache check for all asset types
     */
    static async checkAllAssets(options: CacheValidationOptions = {}): Promise<{
        champions: CacheCompletenessResult;
        items: CacheCompletenessResult;
        overlayAssets: CacheCompletenessResult;
        overall: {
            isComplete: boolean;
            totalMissing: number;
            totalAssets: number;
        };
    }> {
        const [champions, items, overlayAssets] = await Promise.all([
            this.checkChampions(options),
            this.checkItems(options),
            this.checkOverlayAssets(options)
        ]);

        const totalMissing = champions.missingItems.length + items.missingItems.length + overlayAssets.missingItems.length;
        const totalAssets = champions.totalItems + items.totalItems + overlayAssets.totalItems;

        return {
            champions,
            items,
            overlayAssets,
            overall: {
                isComplete: totalMissing === 0,
                totalMissing,
                totalAssets
            }
        };
    }
} 