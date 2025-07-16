import { BaseBlueprintDownloader, BlueprintDownloaderConfig } from './base-blueprint-downloader';
import { DDRAGON_CDN } from '../constants';
import { CachedAsset } from '../types/electron';
import { DownloadProgress } from './base-cache';

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

    protected progressCallback: ((progress: DownloadProgress) => void) | null = null;

    public onProgress(callback: (progress: DownloadProgress) => void): void {
        this.progressCallback = callback;
    }

    protected updateProgress(progress: Partial<DownloadProgress>): void {
        if (this.progressCallback) {
            const currentProgress: DownloadProgress = {
                current: progress.current ?? 0,
                total: progress.total ?? 0,
                itemName: progress.itemName ?? '',
                stage: progress.stage ?? 'initializing',
                percentage: progress.total && progress.total > 0 ? Math.round((progress.current ?? 0) / progress.total * 100) : 0,
                assetType: progress.assetType,
                currentAsset: progress.currentAsset
            };
            this.progressCallback(currentProgress);
        }
    }

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
        this.version = version;
        await this.initialize();

        try {
            this.updateProgress({
                current: 0,
                total: 1,
                itemName: 'items',
                stage: 'downloading',
                currentAsset: 'Fetching items data...',
                assetType: 'item-data'
            });

            const fullEndpoint = `${DDRAGON_CDN}/${version}/data/en_US/${this.config.endpoint}`;

            const response = await fetch(fullEndpoint);
            if (!response.ok) {
                throw new Error(`Failed to fetch items blueprint: ${response.status}`);
            }

            const data: DataDragonItemResponse = await response.json();
            const totalItems = Object.keys(data.data).length;

            const categoryProgress = await this.getCategoryProgress('items', version);
            let completedItems = categoryProgress.completedItems;

            if (completedItems.length === 0) {
                const existingItems = await this.migrateExistingItems(data, version);
                if (existingItems.length > 0) {
                    completedItems = existingItems;
                }
            }

            const alreadyDownloaded = completedItems.length;

            this.updateProgress({
                current: alreadyDownloaded,
                total: totalItems,
                itemName: 'items',
                stage: 'downloading',
                currentAsset: alreadyDownloaded > 0 ? `Found ${alreadyDownloaded} items already downloaded` : 'Starting item download...',
                assetType: 'item-images'
            });

            const downloadedCount = await this.downloadItemIcons(data, version, completedItems);

            const basePath = this.config.basePath || 'game';
            const blueprintDir = `${basePath}/${version}`;
            const blueprintPath = `${blueprintDir}/${this.config.blueprintFileName}`;

            const dataContent = JSON.stringify(data, null, 2);
            const dataBuffer = Buffer.from(dataContent, 'utf8');

            const manifestData: Record<string, CachedAsset> = {
                [blueprintPath]: {
                    path: dataContent,
                    url: fullEndpoint,
                    size: dataBuffer.length,
                    timestamp: Date.now(),
                    checksum: blueprintPath
                }
            };

            for (const [itemKey, item] of Object.entries(data.data)) {
                if (item.image && item.image.full) {
                    const iconKey = `game/${version}/items/${itemKey}/${item.image.full}`;
                    const iconUrl = `${DDRAGON_CDN}/${version}/img/item/${item.image.full}`;

                    manifestData[iconKey] = {
                        path: iconKey,
                        url: iconUrl,
                        size: 0,
                        timestamp: Date.now(),
                        checksum: iconKey
                    };
                }
            }

            // Don't save to legacy manifest - rely on category manifest system
            // Items are tracked through updateCategoryProgress calls

            this.updateProgress({
                current: downloadedCount,
                total: totalItems,
                itemName: 'items',
                stage: 'complete',
                currentAsset: 'Items downloaded successfully',
                assetType: 'item-images'
            });

        } catch (error) {
            console.error(`Error downloading ${this.config.assetType} blueprint:`, error);
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

        const itemsToDownload: Array<{ itemKey: string; item: DataDragonItem }> = [];
        const alreadyDownloaded = completedItems.length;

        for (const [itemKey, item] of items) {
            if (item.image && item.image.full) {
                if (!completedItems.includes(itemKey)) {
                    itemsToDownload.push({ itemKey, item });
                }
            }
        }

        this.updateProgress({
            current: alreadyDownloaded,
            total: totalItems,
            itemName: 'items',
            stage: 'downloading',
            currentAsset: `Found ${alreadyDownloaded} items already downloaded`,
            assetType: 'item-images'
        });

        if (itemsToDownload.length === 0) {
            return totalItems;
        }

        let downloadedCount = alreadyDownloaded;
        const currentCompletedItems = [...completedItems];

        for (const { itemKey, item } of itemsToDownload) {
            try {
                const iconUrl = `${DDRAGON_CDN}/${version}/img/item/${item.image.full}`;
                const iconKey = `${itemDir}/${itemKey}/${item.image.full}`;

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

                await this.updateCategoryProgress(
                    'items',
                    version,
                    itemKey,
                    totalItems,
                    downloadedCount,
                    currentCompletedItems
                );

                this.updateProgress({
                    current: downloadedCount,
                    total: totalItems,
                    itemName: 'items',
                    stage: 'downloading',
                    currentAsset: `Downloaded ${item.name}`,
                    assetType: 'item-images'
                });
            } catch (_error) {
                this.updateProgress({
                    current: downloadedCount,
                    total: itemsToDownload.length,
                    itemName: 'items',
                    stage: 'downloading',
                    currentAsset: `Failed to download ${item.name}`,
                    assetType: 'item-images'
                });
            }
        }

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