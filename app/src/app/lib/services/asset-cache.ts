import { DDRAGON_CDN } from '@lib/constants';

export interface AssetCacheConfig {
    maxSize: number; // in MB
    ttl: number; // in milliseconds
    enableCompression: boolean;
}

export interface CachedAsset {
    path: string;
    url: string;
    size: number;
    timestamp: number;
    checksum: string;
}

export interface AssetCacheStats {
    totalAssets: number;
    totalSize: number;
    oldestAsset: number;
    newestAsset: number;
}

class AssetCacheService {
    private config: AssetCacheConfig;
    private cacheDir: string = '';
    private manifestPath: string = '';
    private manifest: Map<string, CachedAsset>;

    constructor(config: AssetCacheConfig = {
        maxSize: 500, // 500MB default
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
        enableCompression: true
    }) {
        this.config = config;
        this.manifest = new Map();
        this.initializeCache();
    }

    private async initializeCache(): Promise<void> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            return;
        }

        try {
            const userDataPath = await window.electronAPI.getUserDataPath();
            this.cacheDir = `${userDataPath}/asset-cache`;
            this.manifestPath = `${this.cacheDir}/manifest.json`;

            await this.loadManifest();
            await this.cleanupExpiredAssets();
        } catch (error) {
            console.warn('Failed to initialize asset cache:', error);
        }
    }

    private async loadManifest(): Promise<void> {
        try {
            if (typeof window !== 'undefined' && window.electronAPI?.loadAssetManifest) {
                const result = await window.electronAPI.loadAssetManifest();
                if (result.success && result.data) {
                    this.manifest = new Map(Object.entries(result.data));
                }
            }
        } catch (error) {
            console.warn('Failed to load asset manifest:', error);
        }
    }

    private async saveManifest(): Promise<void> {
        try {
            if (typeof window !== 'undefined' && window.electronAPI?.saveAssetManifest) {
                const manifestData = Object.fromEntries(this.manifest);
                await window.electronAPI.saveAssetManifest(manifestData);
            }
        } catch (error) {
            console.warn('Failed to save asset manifest:', error);
        }
    }

    async getChampionIcon(championKey: string, version: string): Promise<string> {
        const assetKey = `champion-icon-${championKey}-${version}`;
        const url = `${DDRAGON_CDN}/${version}/img/champion/${championKey}.png`;

        return await this.getAsset(assetKey, url, 'champion-icons');
    }

    async getChampionSplash(championKey: string, version: string): Promise<string> {
        const assetKey = `champion-splash-${championKey}-${version}`;
        const url = `${DDRAGON_CDN}/${version}/img/champion/centered/${championKey}_0.jpg`;

        return await this.getAsset(assetKey, url, 'champion-splashes');
    }

    async getAbilityIcon(abilityImage: string, version: string): Promise<string> {
        const assetKey = `ability-icon-${abilityImage}-${version}`;
        const url = `${DDRAGON_CDN}/${version}/img/spell/${abilityImage}`;

        return await this.getAsset(assetKey, url, 'ability-icons');
    }

    async getItemIcon(itemId: string, version: string): Promise<string> {
        const assetKey = `item-icon-${itemId}-${version}`;
        const url = `${DDRAGON_CDN}/${version}/img/item/${itemId}.png`;

        return await this.getAsset(assetKey, url, 'item-icons');
    }

    private async getAsset(assetKey: string, url: string, category: string): Promise<string> {
        // Check if asset exists and is valid
        const cached = this.manifest.get(assetKey);
        if (cached && this.isAssetValid(cached)) {
            return cached.path;
        }

        // Download and cache the asset
        try {
            const localPath = await this.downloadAsset(assetKey, url, category);

            // Update manifest
            const assetInfo: CachedAsset = {
                path: localPath,
                url,
                size: await this.getFileSize(localPath),
                timestamp: Date.now(),
                checksum: await this.generateChecksum(url)
            };

            this.manifest.set(assetKey, assetInfo);
            await this.saveManifest();

            return localPath;
        } catch (error) {
            console.warn(`Failed to cache asset ${assetKey}:`, error);
            return url; // Fallback to original URL
        }
    }

    private async downloadAsset(assetKey: string, url: string, category: string): Promise<string> {
        if (typeof window === 'undefined' || !window.electronAPI?.downloadAsset) {
            throw new Error('Electron API not available');
        }

        const result = await window.electronAPI.downloadAsset(url, category, assetKey);
        if (!result.success) {
            throw new Error(result.error || 'Failed to download asset');
        }

        return result.localPath!;
    }

    private isAssetValid(asset: CachedAsset): boolean {
        const now = Date.now();
        return now - asset.timestamp < this.config.ttl;
    }

    private async getFileSize(filePath: string): Promise<number> {
        if (typeof window !== 'undefined' && window.electronAPI?.getFileSize) {
            const result = await window.electronAPI.getFileSize(filePath);
            return result.success ? (result.size ?? 0) : 0;
        }
        return 0;
    }

    private async generateChecksum(url: string): Promise<string> {
        // Simple checksum based on URL and timestamp
        const encoder = new TextEncoder();
        const data = encoder.encode(url + Date.now().toString());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async cleanupExpiredAssets(): Promise<void> {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, asset] of this.manifest.entries()) {
            if (now - asset.timestamp > this.config.ttl) {
                expiredKeys.push(key);
            }
        }

        for (const key of expiredKeys) {
            await this.removeAsset(key);
        }
    }

    async removeAsset(assetKey: string): Promise<void> {
        const asset = this.manifest.get(assetKey);
        if (asset) {
            try {
                if (typeof window !== 'undefined' && window.electronAPI?.removeAsset) {
                    await window.electronAPI.removeAsset(asset.path);
                }
            } catch (error) {
                console.warn(`Failed to remove asset file: ${asset.path}`, error);
            }
            this.manifest.delete(assetKey);
        }
    }

    async clearCache(): Promise<void> {
        try {
            if (typeof window !== 'undefined' && window.electronAPI?.clearAssetCache) {
                await window.electronAPI.clearAssetCache();
            }
            this.manifest.clear();
            await this.saveManifest();
        } catch (error) {
            console.warn('Failed to clear asset cache:', error);
        }
    }

    async getStats(): Promise<AssetCacheStats> {
        let totalSize = 0;
        let oldestAsset = Date.now();
        let newestAsset = 0;

        for (const asset of this.manifest.values()) {
            totalSize += asset.size;
            oldestAsset = Math.min(oldestAsset, asset.timestamp);
            newestAsset = Math.max(newestAsset, asset.timestamp);
        }

        return {
            totalAssets: this.manifest.size,
            totalSize,
            oldestAsset,
            newestAsset
        };
    }

    async preloadChampionAssets(championKeys: string[], version: string): Promise<void> {
        const promises = championKeys.map(async (key) => {
            try {
                await this.getChampionIcon(key, version);
                await this.getChampionSplash(key, version);
            } catch (error) {
                console.warn(`Failed to preload assets for champion ${key}:`, error);
            }
        });

        await Promise.allSettled(promises);
    }
}

// Export singleton instance
export const assetCache = new AssetCacheService(); 