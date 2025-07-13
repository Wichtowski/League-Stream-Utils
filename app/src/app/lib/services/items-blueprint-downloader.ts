import { BaseBlueprintDownloader, BlueprintDownloaderConfig } from './base-blueprint-downloader';
import { DDRAGON_CDN } from '../constants';
import { CachedAsset } from '../types/electron';

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

export class ItemsBlueprintDownloader extends BaseBlueprintDownloader<DataDragonItemResponse> {
    protected config: BlueprintDownloaderConfig = {
        endpoint: 'item.json',
        blueprintFileName: 'items-blueprint.json',
        assetType: 'item',
        basePath: 'cache/game'
    };

    private async checkItemExists(iconKey: string): Promise<boolean> {
        // Use direct file existence check for reliability
        try {
            const exists = await this.checkFileExists(iconKey);
            return exists;
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    async downloadBlueprint(version: string): Promise<void> {
        console.log('ItemsBlueprintDownloader.downloadBlueprint called with version:', version);
        this.version = version; // Store version for later use
        await this.initialize();

        try {
            // Update progress - fetching data
            this.updateProgress({
                current: 0,
                total: 1,
                itemName: 'items',
                stage: 'downloading',
                currentAsset: 'Fetching items data...',
                assetType: 'item-data'
            });

            const fullEndpoint = `${DDRAGON_CDN}/${version}/data/en_US/${this.config.endpoint}`;
            console.log('Fetching items data from:', fullEndpoint);

            // Download data from DataDragon
            const response = await fetch(fullEndpoint);
            if (!response.ok) {
                throw new Error(`Failed to fetch items blueprint: ${response.status}`);
            }

            const data: DataDragonItemResponse = await response.json();
            const totalItems = Object.keys(data.data).length;
            console.log('Items data fetched successfully, got', totalItems, 'items');

            // Check category progress instead of individual file checks
            const categoryProgress = await this.getCategoryProgress('items');
            let completedItems = categoryProgress.completedItems;

            // If no items in manifest but files might exist, migrate them
            if (completedItems.length === 0) {
                console.log('No items found in category manifest, checking for existing files...');
                const existingItems = await this.migrateExistingItems(data, version);
                if (existingItems.length > 0) {
                    console.log(`Migrated ${existingItems.length} existing items to category manifest`);
                    completedItems = existingItems;
                }
            }

            const alreadyDownloaded = completedItems.length;

            console.log(`Found ${alreadyDownloaded} items already downloaded out of ${totalItems} total`);

            // Update progress - downloading icons with correct totals
            this.updateProgress({
                current: alreadyDownloaded,
                total: totalItems,
                itemName: 'items',
                stage: 'downloading',
                currentAsset: alreadyDownloaded > 0 ? `Found ${alreadyDownloaded} items already downloaded` : 'Starting item download...',
                assetType: 'item-images'
            });

            // Download item icons
            const downloadedCount = await this.downloadItemIcons(data, version, completedItems);

            // Create the blueprint directory structure
            const basePath = this.config.basePath || 'game';
            const blueprintDir = `${basePath}/${version}`;
            const blueprintPath = `${blueprintDir}/${this.config.blueprintFileName}`;

            // Save the blueprint using asset manifest system
            const dataContent = JSON.stringify(data, null, 2);
            const dataBuffer = Buffer.from(dataContent, 'utf8');

            // Create manifest entry for the downloaded items
            const manifestData: Record<string, CachedAsset> = {
                [blueprintPath]: {
                    path: dataContent,
                    url: fullEndpoint,
                    size: dataBuffer.length,
                    timestamp: Date.now(),
                    checksum: blueprintPath
                }
            };

            // Add all downloaded items to the manifest
            for (const [itemKey, item] of Object.entries(data.data)) {
                if (item.image && item.image.full) {
                    const iconKey = `game/${version}/items/${itemKey}/${item.image.full}`;
                    const iconUrl = `${DDRAGON_CDN}/${version}/img/item/${item.image.full}`;

                    manifestData[iconKey] = {
                        path: iconKey,
                        url: iconUrl,
                        size: 0, // Size will be determined by electron
                        timestamp: Date.now(),
                        checksum: iconKey
                    };
                }
            }

            await this.saveAssetManifest(manifestData);

            // Update progress - complete with actual count
            this.updateProgress({
                current: downloadedCount,
                total: totalItems,
                itemName: 'items',
                stage: 'complete',
                currentAsset: 'Items downloaded successfully',
                assetType: 'item-data'
            });

            console.log(`${this.config.assetType} blueprint saved to ${blueprintPath}`);
        } catch (error) {
            console.error(`Error downloading ${this.config.assetType} blueprint:`, error);

            // Update progress - error
            this.updateProgress({
                current: 0,
                total: 1,
                itemName: 'items',
                stage: 'error',
                currentAsset: 'Failed to download items',
                assetType: 'item-data'
            });

            throw error;
        }
    }

    private async downloadItemIcons(data: DataDragonItemResponse, version: string, completedItems: string[]): Promise<number> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }

        const itemDir = `game/${version}/items`;
        const items = Object.entries(data.data);
        const totalItems = items.length;

        // Check which items need to be downloaded based on category progress
        const itemsToDownload: Array<{ itemKey: string; item: DataDragonItem }> = [];
        const alreadyDownloaded = completedItems.length;

        console.log(`Checking ${totalItems} items for existing downloads...`);

        for (const [itemKey, item] of items) {
            if (item.image && item.image.full) {
                if (!completedItems.includes(itemKey)) {
                    itemsToDownload.push({ itemKey, item });
                }
            }
        }

        console.log(`Found ${alreadyDownloaded} items already downloaded, ${itemsToDownload.length} items to download`);

        // Update progress to show correct totals
        this.updateProgress({
            current: alreadyDownloaded,
            total: totalItems,
            itemName: 'items',
            stage: 'downloading',
            currentAsset: `Found ${alreadyDownloaded} items already downloaded`,
            assetType: 'item-images'
        });

        // If all items are already downloaded, skip the download process
        if (itemsToDownload.length === 0) {
            console.log('All item icons already downloaded');
            return totalItems;
        }

        console.log(`Downloading ${itemsToDownload.length} new item icons...`);
        let downloadedCount = alreadyDownloaded;
        const currentCompletedItems = [...completedItems];

        for (const { itemKey, item } of itemsToDownload) {
            try {
                // Create the item icon URL
                const iconUrl = `${DDRAGON_CDN}/${version}/img/item/${item.image.full}`;
                const iconKey = `${itemDir}/${itemKey}/${item.image.full}`;

                // Update progress for current item
                this.updateProgress({
                    current: downloadedCount,
                    total: totalItems,
                    itemName: 'items',
                    stage: 'downloading',
                    currentAsset: `Downloading ${item.name}...`,
                    assetType: 'item-images'
                });

                await this.downloadItemIcon(iconUrl, iconKey);
                downloadedCount++;
                currentCompletedItems.push(itemKey);

                // Update category progress
                await this.updateCategoryProgress(
                    'items',
                    version,
                    itemKey,
                    totalItems,
                    downloadedCount,
                    currentCompletedItems
                );

                // Update progress after successful download
                this.updateProgress({
                    current: downloadedCount,
                    total: totalItems,
                    itemName: 'items',
                    stage: 'downloading',
                    currentAsset: `Downloaded ${item.name}`,
                    assetType: 'item-images'
                });

                if ((downloadedCount - alreadyDownloaded) % 10 === 0) {
                    console.log(`Downloaded ${downloadedCount - alreadyDownloaded}/${itemsToDownload.length} new item icons... (${downloadedCount}/${totalItems} total)`);
                }
            } catch (error) {
                console.error(`Failed to download item icon for ${item.name}:`, error);

                // Update progress even on error to show which item failed
                this.updateProgress({
                    current: downloadedCount,
                    total: totalItems,
                    itemName: 'items',
                    stage: 'downloading',
                    currentAsset: `Failed to download ${item.name}`,
                    assetType: 'item-images'
                });
            }
        }

        console.log(`Successfully downloaded ${downloadedCount - alreadyDownloaded} new item icons (${downloadedCount}/${totalItems} total)`);
        return downloadedCount;
    }

    private async downloadItemIcon(url: string, assetKey: string): Promise<void> {
        try {
            const result = await this.downloadAsset(url, 'cache', assetKey);
            if (!result) {
                throw new Error(`Failed to download item icon from ${url}`);
            }
        } catch (error) {
            console.error(`Error downloading item icon from ${url}:`, error);
            throw error;
        }
    }

    // Migration function to scan existing item files and add them to category manifest
    private async migrateExistingItems(data: DataDragonItemResponse, version: string): Promise<string[]> {
        const existingItems: string[] = [];

        try {
            const allItemEntries = Object.entries(data.data);

            for (const [itemKey, item] of allItemEntries) {
                if (item.image && item.image.full) {
                    // Check if the item icon exists
                    const iconKey = `game/${version}/items/${itemKey}/${item.image.full}`;
                    const fileExists = await this.checkItemExists(iconKey);

                    if (fileExists) {
                        existingItems.push(itemKey);
                    }
                }
            }

            // If we found existing items, update the category manifest
            if (existingItems.length > 0) {
                await this.updateCategoryProgress(
                    'items',
                    version,
                    existingItems[existingItems.length - 1], // Last item as "last downloaded"
                    allItemEntries.length,
                    existingItems.length,
                    existingItems
                );
                console.log(`Successfully migrated ${existingItems.length} existing items to category manifest`);
            }

            return existingItems;
        } catch (error) {
            console.error('Error during items migration:', error);
            return [];
        }
    }

    async getDownloadProgress(version: string): Promise<{ downloaded: number; total: number; percentage: number }> {
        try {
            const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/${this.config.endpoint}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch items list: ${response.status}`);
            }

            const data: DataDragonItemResponse = await response.json();
            const totalItems = Object.keys(data.data).length;
            let downloadedCount = 0;

            for (const [itemKey, item] of Object.entries(data.data)) {
                if (item.image && item.image.full) {
                    const imageKey = `game/${version}/items/${itemKey}/${item.image.full}`;
                    if (await this.checkItemExists(imageKey)) {
                        downloadedCount++;
                    }
                }
            }

            return {
                downloaded: downloadedCount,
                total: totalItems,
                percentage: Math.round((downloadedCount / totalItems) * 100)
            };
        } catch (error) {
            console.error('Error getting download progress:', error);
            return { downloaded: 0, total: 0, percentage: 0 };
        }
    }
}

export const itemsBlueprintDownloader = new ItemsBlueprintDownloader(); 