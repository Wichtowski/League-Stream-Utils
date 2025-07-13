import { DDRAGON_BASE_URL } from '../constants';
import { CachedAsset } from '../types/electron';
import path from 'path';

export interface DownloadProgress {
    current: number;
    total: number;
    itemName: string;
    stage: string;
    percentage: number;
    assetType?: 'champion' | 'champion-data' | 'champion-images' | 'ability-images' | 'item-data' | 'item-images' | 'spell-data' | 'spell-images' | 'rune-data' | 'rune-images';
    currentAsset?: string;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

// Category-specific manifest for tracking last downloaded item
export interface CategoryManifest {
    category: string;
    version: string;
    lastDownloadedItem: string;
    totalItems: number;
    downloadedCount: number;
    lastUpdated: number;
    completedItems: string[]; // List of completed items for progress tracking
}

export abstract class BaseCacheService<T = unknown> {
    protected cacheDir: string = '';
    protected version: string = '';
    protected isInitialized: boolean = false;
    protected progressCallback: ProgressCallback | null = null;

    onProgress(callback: ProgressCallback): void {
        this.progressCallback = callback;
    }

    protected updateProgress(progress: Partial<DownloadProgress>): void {
        if (this.progressCallback) {
            const currentProgress = {
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

    protected async initialize(): Promise<void> {
        if (this.isInitialized) return;

        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }

        const userDataPath = await window.electronAPI.getUserDataPath();
        this.cacheDir = path.join(userDataPath, 'assets');
        this.isInitialized = true;
    }

    protected async getLatestVersion(): Promise<string> {
        try {
            const response = await fetch(`${DDRAGON_BASE_URL}/api/versions.json`);
            const versions = await response.json();
            return versions[0];
        } catch (error) {
            console.error('Failed to fetch Data Dragon version:', error);
            return '15.13.1'; // Fallback version
        }
    }

    protected async downloadAsset(url: string, category: string, assetKey: string): Promise<string | null> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            return null;
        }

        try {
            const downloadResult = await window.electronAPI.downloadAsset(url, category, assetKey);
            return downloadResult.success ? `${category}/${assetKey}` : null;
        } catch (error) {
            console.warn(`Failed to download asset from ${url}:`, error);
            return null;
        }
    }

    protected async checkFileExists(filePath: string): Promise<boolean> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            return false;
        }

        try {
            const userDataPath = await window.electronAPI.getUserDataPath();
            const fullPath = path.join(userDataPath, 'assets', filePath);
            const result = await window.electronAPI.checkFileExists(fullPath);
            return result.success && result.exists === true;
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    // Category-specific manifest methods
    protected async saveCategoryManifest(category: string, manifest: CategoryManifest): Promise<boolean> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            return false;
        }

        try {
            const manifestPath = `${category}-manifest.json`;
            const manifestContent = JSON.stringify(manifest, null, 2);

            // Use the new category-specific IPC handler
            const result = await window.electronAPI.saveCategoryManifest(category, {
                [manifestPath]: {
                    path: manifestContent,
                    url: '',
                    size: Buffer.from(manifestContent, 'utf8').length,
                    timestamp: Date.now(),
                    checksum: manifestPath
                }
            });

            return result.success;
        } catch (error) {
            console.error(`Failed to save ${category} manifest:`, error);
            return false;
        }
    }

    protected async loadCategoryManifest(category: string): Promise<CategoryManifest | null> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            return null;
        }

        try {
            const manifestPath = `${category}-manifest.json`;

            // Use the new category-specific IPC handler
            const result = await window.electronAPI.loadCategoryManifest(category);

            if (result.success && result.data && result.data[manifestPath]) {
                const manifestData = result.data[manifestPath];
                return JSON.parse(manifestData.path) as CategoryManifest;
            }

            return null;
        } catch (error) {
            console.error(`Failed to load ${category} manifest:`, error);
            return null;
        }
    }

    protected async updateCategoryProgress(
        category: string,
        version: string,
        lastDownloadedItem: string,
        totalItems: number,
        downloadedCount: number,
        completedItems: string[]
    ): Promise<void> {
        const manifest: CategoryManifest = {
            category,
            version,
            lastDownloadedItem,
            totalItems,
            downloadedCount,
            lastUpdated: Date.now(),
            completedItems
        };

        await this.saveCategoryManifest(category, manifest);
    }

    protected async getCategoryProgress(category: string): Promise<{ downloaded: number; total: number; completedItems: string[] }> {
        const manifest = await this.loadCategoryManifest(category);

        if (!manifest) {
            return { downloaded: 0, total: 0, completedItems: [] };
        }

        return {
            downloaded: manifest.downloadedCount,
            total: manifest.totalItems,
            completedItems: manifest.completedItems
        };
    }

    // Legacy methods for backward compatibility
    protected async saveAssetManifest(manifestData: Record<string, CachedAsset>): Promise<boolean> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            return false;
        }

        try {
            const result = await window.electronAPI.saveAssetManifest(manifestData);
            return result.success;
        } catch (error) {
            console.error('Failed to save asset manifest:', error);
            return false;
        }
    }

    protected async loadAssetManifest(): Promise<Record<string, CachedAsset> | null> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            return null;
        }

        try {
            const result = await window.electronAPI.loadAssetManifest();
            return result.success ? result.data ?? null : null;
        } catch (error) {
            console.error('Failed to load asset manifest:', error);
            return null;
        }
    }

    protected async loadData<T>(_filePath: string): Promise<T | null> {
        return null;
    }

    protected async saveData<T>(_filePath: string, _data: T): Promise<boolean> {
        // No-op stub – pretend success (future Electron helper could implement)
        void _filePath;
        void _data;
        return true;
    }

    protected async createDirectory(_dirPath: string): Promise<void> {
        void _dirPath;
    }

    protected async downloadImage(url: string, destPath: string): Promise<boolean> {
        if (typeof window === 'undefined' || !window.electronAPI) return false;
        try {
            const result = await window.electronAPI.downloadAsset(url, 'cache', destPath);
            return result.success;
        } catch {
            return false;
        }
    }

    // Abstract methods that implementing classes must provide
    abstract getAll(): Promise<T[]>;
    abstract getById(id: string): Promise<T | null>;
    abstract clearCache(): Promise<void>;
    abstract getCacheStats(): Promise<{ totalItems: number; cacheSize: number; version: string }>;
} 