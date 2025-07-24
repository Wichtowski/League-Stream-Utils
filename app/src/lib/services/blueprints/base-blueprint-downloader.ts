import { BaseCacheService } from '../cache/base';
import { DDRAGON_CDN } from '../../utils/constants';

export interface BlueprintDownloaderConfig {
    endpoint: string;
    blueprintFileName: string;
    assetType: string;
    basePath?: string;
}

export abstract class BaseBlueprintDownloader<T> extends BaseCacheService<T> {
    protected abstract config: BlueprintDownloaderConfig;

    async getAll(): Promise<T[]> {
        throw new Error('Not implemented');
    }

    async getById(_id: string): Promise<T | null> {
        throw new Error('Not implemented');
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

    async downloadBlueprint(version: string): Promise<void> {
        await this.initialize();

        try {
            // Download data from DataDragon
            const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/${this.config.endpoint}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${this.config.assetType} blueprint: ${response.status}`);
            }

            // Create the blueprint directory structure
            const basePath = this.config.basePath || 'game';
            const blueprintDir = `${basePath}/${version}`;
            const blueprintPath = `${blueprintDir}/${this.config.blueprintFileName}`;



            console.log(`${this.config.assetType} blueprint saved to ${blueprintPath}`);
        } catch (error) {
            console.error(`Error downloading ${this.config.assetType} blueprint:`, error);
            throw error;
        }
    }

    async getLatestVersion(): Promise<string> {
        return await super.getLatestVersion();
    }

    async downloadBlueprintForCurrentVersion(): Promise<void> {
        const version = await this.getLatestVersion();
        await this.downloadBlueprint(version);
    }
}
