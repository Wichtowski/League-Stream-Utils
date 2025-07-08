import { DDRAGON_CDN } from '../constants';
import { BaseCacheService } from './base-cache';

export interface Item {
    id: number;
    name: string;
    description: string;
    plaintext: string;
    image: {
        full: string;
    };
    gold: {
        base: number;
        purchasable: boolean;
        total: number;
        sell: number;
    };
    tags: string[];
    stats: { [key: string]: number };
    depth: number;
    specialRecipe?: number;
    stacks?: number;
    consumeOnFull?: boolean;
    inStore?: boolean;
    hideFromAll?: boolean;
    requiredChampion?: string;
    requiredAlly?: string;
    imagePath: string;
}

interface DataDragonItem {
    id: string;
    name: string;
    description: string;
    plaintext: string;
    image: {
        full: string;
    };
    gold: {
        base: number;
        purchasable: boolean;
        total: number;
        sell: number;
    };
    tags: string[];
    stats: { [key: string]: number };
    depth: number;
    specialRecipe?: number;
    stacks?: number;
    consumeOnFull?: boolean;
    inStore?: boolean;
    hideFromAll?: boolean;
    requiredChampion?: string;
    requiredAlly?: string;
}

interface DataDragonItemResponse {
    data: { [key: string]: DataDragonItem };
}

export class ItemCacheService extends BaseCacheService {
    async getAll(): Promise<Item[]> {
        await this.initialize();
        const version = await this.getLatestVersion();
        this.version = version;
        const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/item.json`);
        if (!response.ok) throw new Error(`Failed to fetch items list: ${response.status}`);
        const data: DataDragonItemResponse = await response.json();
        const itemKeys = Object.keys(data.data);
        const items: Item[] = [];
        let currentIndex = 0;
        this.updateProgress({ current: 0, total: itemKeys.length, itemName: '', stage: 'item-data' });
        for (const itemKey of itemKeys) {
            currentIndex++;
            const itemData = data.data[itemKey];
            this.updateProgress({ current: currentIndex, total: itemKeys.length, itemName: itemData.name, stage: 'item-data' });
            const item = await this.downloadItemData(itemKey, version, itemData);
            items.push(item);
        }
        this.updateProgress({ current: itemKeys.length, total: itemKeys.length, itemName: '', stage: 'complete' });
        return items;
    }

    async getById(id: string): Promise<Item | null> {
        await this.initialize();
        const version = await this.getLatestVersion();
        try {
            return await this.downloadItemData(id, version);
        } catch {
            return null;
        }
    }

    private async downloadItemData(itemId: string, version: string, itemData?: DataDragonItem): Promise<Item> {
        await this.initialize();
        const itemPath = `${this.cacheDir}/game/${version}/item/${itemId}`;
        const dataPath = `${itemPath}/data.json`;
        const cachedData = await this.loadData(dataPath);
        if (cachedData && Object.keys(cachedData).length > 0) return cachedData as Item;
        if (!itemData) {
            const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/item.json`);
            const allData: DataDragonItemResponse = await response.json();
            itemData = allData.data[itemId];
        }
        await this.createDirectory(itemPath);
        const imageUrl = `${DDRAGON_CDN}/${version}/img/item/${itemData.image.full}`;
        const imagePath = `${itemPath}/${itemData.image.full}`;
        const imageDownloaded = await this.downloadImage(imageUrl, imagePath);
        const cacheData: Item = {
            id: parseInt(itemData.id),
            name: itemData.name,
            description: itemData.description,
            plaintext: itemData.plaintext,
            image: itemData.image,
            gold: itemData.gold,
            tags: itemData.tags,
            stats: itemData.stats,
            depth: itemData.depth,
            specialRecipe: itemData.specialRecipe,
            stacks: itemData.stacks,
            consumeOnFull: itemData.consumeOnFull,
            inStore: itemData.inStore,
            hideFromAll: itemData.hideFromAll,
            requiredChampion: itemData.requiredChampion,
            requiredAlly: itemData.requiredAlly,
            imagePath: imageDownloaded ? `${itemPath}/${itemData.image.full}` : imageUrl
        };
        await this.saveData(dataPath, cacheData);
        return cacheData;
    }

    async clearCache(): Promise<void> {
        await this.initialize();
        if (typeof window === 'undefined' || !window.electronAPI) throw new Error('Electron API not available');
        await window.electronAPI.clearAssetCache();
    }

    async getCacheStats(): Promise<{ totalItems: number; cacheSize: number; version: string }> {
        await this.initialize();
        if (typeof window === 'undefined' || !window.electronAPI) throw new Error('Electron API not available');
        const statsResult = await window.electronAPI.getAssetCacheStats();
        return {
            totalItems: statsResult.stats?.fileCount || 0,
            cacheSize: statsResult.stats?.totalSize || 0,
            version: this.version
        };
    }
}

export const itemCacheService = new ItemCacheService();
