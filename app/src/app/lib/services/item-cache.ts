import { BaseCacheService } from './base-cache';
import { DDRAGON_CDN } from '../constants';
import { DataDragonClient } from '../utils/dataDragon/client';
import path from 'path';

interface DataDragonItem {
    name: string;
    description: string;
    colloq: string;
    plaintext: string;
    into: string[];
    from: string[];
    image: {
        full: string;
        sprite: string;
        group: string;
        x: number;
        y: number;
        w: number;
        h: number;
    };
    gold: {
        base: number;
        purchasable: boolean;
        total: number;
        sell: number;
    };
    tags: string[];
    maps: { [key: string]: boolean };
    stats: { [key: string]: number };
    depth: number;
    consumed: boolean;
    stacks: number;
    consumeOnFull: boolean;
    specialRecipe: number;
    inStore: boolean;
    hideFromAll: boolean;
    requiredChampion: string;
    requiredAlly: string;
}

interface DataDragonItemResponse {
    type: string;
    version: string;
    basic: DataDragonItem;
    data: { [key: string]: DataDragonItem };
    groups: Array<{ id: string; MaxGroupOwnable: string }>;
    tree: Array<{ header: string; tags: string[] }>;
}

interface ItemCacheData {
    id: string;
    name: string;
    description: string;
    plaintext: string;
    cost: number;
    sellValue: number;
    tags: string[];
    stats: { [key: string]: number };
    image: string;
    buildPath: {
        into: string[];
        from: string[];
    };
}

class ItemCacheService extends BaseCacheService<ItemCacheData> {

    async getAll(): Promise<ItemCacheData[]> {
        return this.getAllItems();
    }

    async getById(key: string): Promise<ItemCacheData | null> {
        return this.getItemById(key);
    }

    async downloadItemData(itemId: string, version: string): Promise<ItemCacheData> {
        await this.initialize();

        // Cache checking temporarily disabled - using direct download for now

        // Download item data from DataDragon
        const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/item.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch item data for ${itemId}: ${response.status}`);
        }

        const itemData: DataDragonItemResponse = await response.json();
        const item = itemData.data[itemId];

        if (!item) {
            throw new Error(`Item ${itemId} not found in DataDragon data`);
        }

        // Create item directory structure using the correct path format
        const itemDir = `game/${version}/items/${itemId}`;

        // Download item image
        const imageResult = await this.downloadItemImage(itemId, version, itemDir);

        // Create comprehensive item data
        const cacheData: ItemCacheData = {
            id: itemId,
            name: item.name,
            description: item.description,
            plaintext: item.plaintext,
            cost: item.gold.total,
            sellValue: item.gold.sell,
            tags: item.tags,
            stats: item.stats,
            image: imageResult.icon,
            buildPath: {
                into: item.into,
                from: item.from
            }
        };

        // Don't save individual item data to manifest - rely on category manifest system
        // Individual item data is already tracked in the category progress

        return cacheData;
    }

    private async downloadItemImage(itemId: string, version: string, itemDir: string): Promise<{
        icon: string;
    }> {
        const imageUrl = `${DDRAGON_CDN}/${version}/img/item/${itemId}.png`;
        const imageAssetKey = `${itemDir}/${itemId}.png`;

        // Check if file exists on disk (avoid unnecessary downloads)
        if (typeof window !== 'undefined' && window.electronAPI) {
            const userDataPath = await window.electronAPI.getUserDataPath();
            const fullPath = path.join(userDataPath, 'assets', 'cache', imageAssetKey);
            const fileCheck = await window.electronAPI.checkFileExists(fullPath);

            if (fileCheck.success && fileCheck.exists) {
                // File exists on disk, return cached path
                return {
                    icon: `cache/${imageAssetKey}`
                };
            }
        }

        // File doesn't exist, download it (fallback for missing items)
        let iconPath = imageUrl; // Fallback to URL

        try {
            const imageResult = await this.downloadAsset(imageUrl, 'cache', imageAssetKey);
            if (imageResult) {
                iconPath = `cache/${imageAssetKey}`;

                // Don't save to legacy manifest - rely on category manifest system
            }
        } catch (error) {
            console.warn(`Failed to download item image for ${itemId}:`, error);
        }

        return {
            icon: iconPath
        };
    }

    async getAllItems(): Promise<ItemCacheData[]> {
        try {
            const version = await this.getLatestVersion();

            // Get list of all items from DataDragon
            const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/item.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch items list: ${response.status}`);
            }

            const data: DataDragonItemResponse = await response.json();
            const itemKeys = Object.keys(data.data);

            const items: ItemCacheData[] = [];

            // Report progress
            this.updateProgress({
                current: 0,
                total: itemKeys.length,
                stage: 'item-data',
                itemName: 'items'
            });

            for (const itemKey of itemKeys) {
                try {
                    const item = await this.downloadItemData(itemKey, version);
                    items.push(item);

                    this.updateProgress({
                        current: items.length,
                        total: itemKeys.length,
                        stage: 'item-data',
                        itemName: data.data[itemKey].name
                    });
                } catch (error) {
                    console.error(`Failed to download item ${itemKey}:`, error);
                }
            }

            return items;
        } catch (error) {
            console.error('Error getting all items:', error);
            throw error;
        }
    }

    async getItemById(itemId: string): Promise<ItemCacheData | null> {
        try {
            const version = await this.getLatestVersion();
            return await this.downloadItemData(itemId, version);
        } catch (error) {
            console.error(`Error getting item ${itemId}:`, error);
            return null;
        }
    }

    async checkCacheCompleteness(): Promise<{
        isComplete: boolean;
        missingItems: string[];
        totalItems: number;
        cachedItems: number;
    }> {
        try {
            const version = await DataDragonClient.getLatestVersion();

            // Get all items using DataDragon client
            const itemsResponse = await DataDragonClient.getItems(version);
            const data = itemsResponse;
            const allItemKeys = Object.keys(data.data);

            const missingItems: string[] = [];

            // Check for file existence directly on disk - simple and reliable
            if (typeof window !== 'undefined' && window.electronAPI) {
                const userDataPath = await window.electronAPI.getUserDataPath();

                for (const itemKey of allItemKeys) {
                    // Check if the main item image exists (this is the key asset)
                    const itemImagePath = path.join(userDataPath, 'assets', 'cache', 'game', version, 'items', itemKey, `${itemKey}.png`);
                    const fileCheck = await window.electronAPI.checkFileExists(itemImagePath);

                    if (!fileCheck.success || !fileCheck.exists) {
                        missingItems.push(itemKey);
                    }
                }
            } else {
                // Fallback if electron API not available - assume all missing
                missingItems.push(...allItemKeys);
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

    async downloadAllItemsOnStartup(): Promise<void> {
        try {
            // Get the current version
            const version = await this.getLatestVersion();

            // Get all items from DataDragon to know the total count first
            const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/item.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch items list: ${response.status}`);
            }

            const data: DataDragonItemResponse = await response.json();
            const allItemKeys = Object.keys(data.data);
            const totalItems = allItemKeys.length;

            // Now emit 'checking' stage with the correct total count
            this.updateProgress({
                current: 0,
                total: totalItems,
                stage: 'checking',
                itemName: 'Checking items...',
                assetType: 'item-images'
            });

            // Use cache completeness check to determine what actually needs downloading
            const cacheCheck = await this.checkCacheCompleteness();
            const missingItems = cacheCheck.missingItems;
            const downloadedCount = cacheCheck.cachedItems;

            console.log(`Found ${downloadedCount} items already downloaded out of ${totalItems} total`);
            console.log(`Missing items: ${missingItems.length}`);

            // Update progress after checking to show current count
            this.updateProgress({
                current: downloadedCount,
                total: totalItems,
                stage: 'checking',
                itemName: `Found ${downloadedCount}/${totalItems} items`,
                assetType: 'item-images'
            });

            // Emit 'downloading' stage even if nothing to download
            this.updateProgress({
                current: downloadedCount,
                total: totalItems,
                stage: 'downloading',
                itemName: missingItems.length > 0 ? `Starting download...` : 'All items cached',
                currentAsset: missingItems[0] || '',
                assetType: 'item-images'
            });

            if (missingItems.length === 0) {
                // All items are already downloaded
                console.log('All items are already downloaded!');
                this.updateProgress({
                    current: totalItems,
                    total: totalItems,
                    stage: 'complete',
                    itemName: 'Items downloaded successfully',
                    currentAsset: 'Items downloaded successfully',
                    assetType: 'item-images'
                });
                return;
            }

            console.log(`Downloading ${missingItems.length} missing items...`);

            // Download missing items only
            let currentDownloadedCount = downloadedCount;

            for (let i = 0; i < missingItems.length; i++) {
                const itemKey = missingItems[i];
                try {
                    await this.downloadItemData(itemKey, version);
                    currentDownloadedCount++;

                    // Update category progress
                    await this.updateCategoryProgress(
                        'items',
                        version,
                        itemKey,
                        totalItems,
                        currentDownloadedCount,
                        [...allItemKeys.filter(key => !missingItems.includes(key) || missingItems.indexOf(key) <= i)]
                    );

                    // Report progress after each item
                    this.updateProgress({
                        current: currentDownloadedCount,
                        total: totalItems,
                        stage: 'downloading',
                        itemName: `Item ${itemKey} (${currentDownloadedCount}/${totalItems})`,
                        currentAsset: itemKey,
                        assetType: 'item-images'
                    });

                    // Add a small delay to allow UI updates
                    await new Promise(resolve => setTimeout(resolve, 10));
                } catch (error) {
                    console.error(`Failed to download item ${itemKey}:`, error);
                    // Still increment count even if download failed
                    currentDownloadedCount++;
                }
            }

            // Report final completion
            this.updateProgress({
                current: totalItems,
                total: totalItems,
                stage: 'complete',
                itemName: 'Items downloaded successfully',
                currentAsset: 'Items downloaded successfully',
                assetType: 'item-images'
            });

            // Clean up manifests after successful completion
            console.log('All items downloaded successfully. Cleaning up manifests for fresh restart capability.');
            await this.cleanupManifestAfterSuccess();

        } catch (error) {
            console.error('Error downloading items on startup:', error);
        }
    }

    private async cleanupManifestAfterSuccess(): Promise<void> {
        try {
            if (typeof window === 'undefined' || !window.electronAPI) {
                console.log('Electron API not available, skipping manifest cleanup');
                return;
            }

            // No need to clear legacy manifest - using category manifest system now
            console.log('Item download completed successfully.');
        } catch (error) {
            console.error('Failed to cleanup manifest after successful download:', error);
        }
    }

    async clearCache(): Promise<void> {
        await this.initialize();
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }
        await window.electronAPI.clearAssetCache();
    }

    async getCacheStats(): Promise<{ totalItems: number; cacheSize: number; version: string }> {
        await this.initialize();
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }
        const statsResult = await window.electronAPI.getAssetCacheStats();
        return {
            totalItems: statsResult.stats?.fileCount || 0,
            cacheSize: statsResult.stats?.totalSize || 0,
            version: this.version
        };
    }
}

export const itemCacheService = new ItemCacheService();
