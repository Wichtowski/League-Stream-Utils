import { BaseCacheService } from './base-cache';
import { DDRAGON_CDN } from '../constants';

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
    private currentVersion: string = '15.13.1';

    async getAll(): Promise<ItemCacheData[]> {
        return this.getAllItems();
    }

    async getById(key: string): Promise<ItemCacheData | null> {
        return this.getItemById(key);
    }

    async downloadItemData(itemId: string, version: string): Promise<ItemCacheData> {
        await this.initialize();

        // Check if item is already cached using asset manifest
        const dataKey = `item-${version}-${itemId}-data`;
        const manifestResult = await this.loadAssetManifest();

        if (manifestResult && manifestResult[dataKey]) {
            // Load cached data
            const cachedData = manifestResult[dataKey];
            if (cachedData && cachedData.path) {
                try {
                    return JSON.parse(cachedData.path);
                } catch {
                    // If parsing fails, continue to download
                }
            }
        }

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

        // Save item data using asset manifest system
        const dataContent = JSON.stringify(cacheData);
        const dataBuffer = Buffer.from(dataContent, 'utf8');

        await this.saveAssetManifest({
            [dataKey]: {
                path: dataContent,
                url: `${DDRAGON_CDN}/${version}/data/en_US/item.json`,
                size: dataBuffer.length,
                timestamp: Date.now(),
                checksum: dataKey
            }
        });

        return cacheData;
    }

    private async downloadItemImage(itemId: string, version: string, itemDir: string): Promise<{
        icon: string;
    }> {
        const imageUrl = `${DDRAGON_CDN}/${version}/img/item/${itemId}.png`;
        const imageAssetKey = `${itemDir}/icon.png`;

        let iconPath = imageUrl; // Fallback to URL

        try {
            const imageResult = await this.downloadAsset(imageUrl, 'cache', imageAssetKey);
            if (imageResult) {
                iconPath = `cache/${imageAssetKey}`;

                // Save image to asset manifest
                await this.saveAssetManifest({
                    [imageAssetKey]: {
                        path: imageResult,
                        url: imageUrl,
                        size: 0, // Size will be calculated by Electron
                        timestamp: Date.now(),
                        checksum: imageAssetKey
                    }
                });
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
            const version = await this.getLatestVersion();

            // Get all items from DataDragon
            const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/item.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch items list: ${response.status}`);
            }

            const data: DataDragonItemResponse = await response.json();
            const allItemKeys = Object.keys(data.data);

            // Load asset manifest to check cached items
            const manifest = await this.loadAssetManifest();
            const missingItems: string[] = [];

            for (const itemKey of allItemKeys) {
                const dataKey = `item-${version}-${itemKey}-data`;
                const imageKey = `game/${version}/items/${itemKey}/icon.png`;

                // Check if both data and image are cached
                const hasData = manifest && manifest[dataKey];
                const hasImage = manifest && manifest[imageKey];

                if (!hasData || !hasImage) {
                    missingItems.push(itemKey);
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

    async downloadAllItemsOnStartup(): Promise<void> {
        try {
            // Emit 'checking' stage at the start
            this.updateProgress({
                current: 0,
                total: 0,
                stage: 'checking',
                itemName: 'Checking items...'
            });

            // Get the current version
            const version = await this.getLatestVersion();

            // Get all items from DataDragon to know the total count
            const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/item.json`);
            if (!response.ok) {
                throw new Error(`Failed to fetch items list: ${response.status}`);
            }

            const data: DataDragonItemResponse = await response.json();
            const allItemKeys = Object.keys(data.data);
            const totalItems = allItemKeys.length;

            // Check category progress instead of individual asset checks
            const categoryProgress = await this.getCategoryProgress('items');
            const completedItems = categoryProgress.completedItems;
            const downloadedCount = completedItems.length;

            console.log(`Found ${downloadedCount} items already downloaded out of ${totalItems} total`);

            // Emit 'downloading' stage even if nothing to download
            this.updateProgress({
                current: downloadedCount,
                total: totalItems,
                stage: 'downloading',
                itemName: `Starting download from item ${downloadedCount + 1}`,
                currentAsset: allItemKeys[downloadedCount] || ''
            });

            if (downloadedCount >= totalItems) {
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

            // Calculate remaining items to download
            const remainingItems = allItemKeys.filter(itemKey => !completedItems.includes(itemKey));
            console.log(`Downloading ${remainingItems.length} remaining items...`);

            // Report initial progress
            this.updateProgress({
                current: downloadedCount,
                total: totalItems,
                stage: 'downloading',
                itemName: `Starting download from item ${downloadedCount + 1}`,
                currentAsset: remainingItems[0] || ''
            });

            // Download remaining items
            let currentDownloadedCount = downloadedCount;
            const currentCompletedItems = [...completedItems];

            for (let i = 0; i < remainingItems.length; i++) {
                const itemKey = remainingItems[i];
                try {
                    await this.downloadItemData(itemKey, version);
                    currentDownloadedCount++;
                    currentCompletedItems.push(itemKey);

                    // Update category progress
                    await this.updateCategoryProgress(
                        'items',
                        version,
                        itemKey,
                        totalItems,
                        currentDownloadedCount,
                        currentCompletedItems
                    );

                    // Report progress after each item
                    this.updateProgress({
                        current: currentDownloadedCount,
                        total: totalItems,
                        stage: 'downloading',
                        itemName: `Item ${itemKey} (${currentDownloadedCount}/${totalItems})`,
                        currentAsset: itemKey
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

        } catch (error) {
            console.error('Error downloading items on startup:', error);
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
