import { BaseCacheService } from './base-cache';
import { DataDragonClient } from '../utils/datadragon-client';
import { AssetValidator } from '../utils/asset-validator';

interface GameUIAsset {
    category: string;
    filename: string;
    path: string;
    size: number;
}

interface GameUIDownloadProgress {
    stage: 'checking' | 'downloading' | 'complete' | 'error';
    current: number;
    total: number;
    currentAsset?: string;
    message: string;
    errors: string[];
}

interface GameUIDownloadResult {
    success: boolean;
    downloadedCount: number;
    totalCount: number;
    errors: string[];
    totalSize: number;
}

class GameUIBlueprintDownloader extends BaseCacheService {
    private isDownloading = false;
    private gameUIProgressCallback?: (progress: GameUIDownloadProgress) => void;

    // Abstract method implementations
    async getAll(): Promise<unknown[]> {
        throw new Error('Not implemented');
    }

    async getById(_id: string): Promise<unknown | null> {
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

    onGameUIProgress(callback: (progress: GameUIDownloadProgress) => void): void {
        this.gameUIProgressCallback = callback;
    }

    private updateGameUIProgress(progress: Partial<GameUIDownloadProgress>): void {
        if (this.gameUIProgressCallback) {
            const fullProgress: GameUIDownloadProgress = {
                stage: 'checking',
                current: 0,
                total: 0,
                message: '',
                errors: [],
                ...progress
            };
            this.gameUIProgressCallback(fullProgress);
        }
    }

    async downloadAllGameUIBlueprint(): Promise<GameUIDownloadResult> {
        if (this.isDownloading) {
            throw new Error('Download already in progress');
        }

        this.isDownloading = true;
        const errors: string[] = [];
        let processedCount = 0;
        let totalSize = 0;

        try {
            this.updateGameUIProgress({
                stage: 'checking',
                current: 0,
                total: 0,
                message: 'Scanning public assets...'
            });

            // Define the known asset categories and their files
            const assetCategories = {
                'dragonpit': [
                    'infernal.png', 'ocean.png', 'hextech.png', 'chemtech.png',
                    'mountain.png', 'elder.png', 'cloud.png'
                ],
                'default': [
                    'player.png'
                ],
                'scoreboard': [
                    'gold.png', 'grubs.png', 'tower.png'
                ],
                'atakhan': [
                    'atakhan_ruinous.png', 'atakhan_voracious.png'
                ],
                'baronpit': [
                    'baron.png', 'grubs.png', 'herald.png'
                ]
            };

            // Calculate total count
            const totalCount = Object.values(assetCategories).reduce((sum, files) => sum + files.length, 0);

            // Check category progress to see what's already been processed
            const categoryProgress = await this.getCategoryProgress('game-ui');
            const completedAssets = categoryProgress.completedItems;
            const alreadyProcessed = completedAssets.length;

            this.updateGameUIProgress({
                stage: 'downloading',
                current: alreadyProcessed,
                total: totalCount,
                message: `Processing ${totalCount - alreadyProcessed} remaining game UI assets...`
            });

            // Process assets by category
            const currentCompletedAssets = [...completedAssets];
            processedCount = alreadyProcessed;

            for (const [category, files] of Object.entries(assetCategories)) {
                this.updateGameUIProgress({
                    current: processedCount,
                    total: totalCount,
                    currentAsset: `Downloading ${category}`,
                    message: `Processing ${category} assets...`
                });

                try {
                    const categoryResult = await this.processCategory(category, files, completedAssets);

                    // Update completed assets list
                    for (const filename of files) {
                        const assetKey = `${category}/${filename}`;
                        if (!completedAssets.includes(assetKey)) {
                            currentCompletedAssets.push(assetKey);
                            processedCount++;

                            // Update category progress after each asset
                            await this.updateCategoryProgress(
                                'game-ui',
                                'current', // No specific version for game UI assets
                                assetKey,
                                totalCount,
                                processedCount,
                                currentCompletedAssets
                            );
                        }
                    }

                    totalSize += categoryResult.totalSize;

                    // Add any errors from category processing
                    errors.push(...categoryResult.errors);
                } catch (error) {
                    const errorMsg = `Failed to process ${category} category: ${error}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);

                    // Update progress to show error
                    this.updateGameUIProgress({
                        current: processedCount,
                        total: totalCount,
                        currentAsset: `${category} category (failed)`,
                        message: `Failed to process ${category}: ${error}`
                    });
                }
            }

            this.updateGameUIProgress({
                stage: 'complete',
                current: processedCount,
                total: totalCount,
                message: 'Game UI downloaded successfully'
            });

            // Clean up manifests after successful completion
            if (processedCount > 0 && errors.length === 0) {
                console.log('All game UI assets processed successfully. Cleaning up manifests for fresh restart capability.');
                await this.cleanupManifestAfterSuccess();
            }

            return {
                success: errors.length === 0,
                downloadedCount: processedCount,
                totalCount,
                errors,
                totalSize
            };

        } catch (error) {
            console.error('Game UI assets processing error:', error);
            this.updateGameUIProgress({
                stage: 'error',
                message: `Processing failed: ${error}`
            });

            return {
                success: false,
                downloadedCount: processedCount,
                totalCount: 0,
                errors: [error as string],
                totalSize
            };
        } finally {
            this.isDownloading = false;
        }
    }

    private async processCategory(category: string, files: string[], completedAssets: string[]): Promise<{ processedCount: number; totalSize: number; errors: string[] }> {
        const errors: string[] = [];
        let processedCount = 0;
        let totalSize = 0;

        try {
            // Process each file in the category
            for (let i = 0; i < files.length; i++) {
                const filename = files[i];
                const assetKey = `${category}/${filename}`;

                // Skip if already processed
                if (completedAssets.includes(assetKey)) {
                    processedCount++;
                    continue;
                }

                try {
                    const version = await DataDragonClient.getLatestVersion();
                    const assetKey = `game/${version}/overlay/${category}/${filename}`;

                    // Check if file already exists using asset validator
                    const cachedPath = AssetValidator.generateCachedPath(assetKey);
                    const fileExists = await AssetValidator.checkFileExists(cachedPath);

                    if (fileExists) {
                        // File already exists, skip processing
                        processedCount++;
                        continue;
                    }

                    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
                        // Use downloadAsset with 'cache' category to ensure proper cache directory
                        const sourcePath = `public/assets/${category}/${filename}`;

                        try {
                            // Use downloadAsset with 'cache' category like champion cache to ensure proper path
                            const downloadResult = await this.downloadAsset(sourcePath, 'cache', assetKey);
                            if (downloadResult) {
                                // Get file size from the downloaded result
                                const actualPath = downloadResult.replace('cache/', '');
                                const sizeResult = await window.electronAPI.getFileSize(actualPath);
                                const fileSize = sizeResult.success ? sizeResult.size || 0 : 0;

                                // Save to asset manifest using the same format as champion cache
                                await this.saveAssetManifest({
                                    [assetKey]: {
                                        path: downloadResult, // This will be cache/game/...
                                        url: sourcePath,
                                        size: fileSize,
                                        timestamp: Date.now(),
                                        checksum: assetKey
                                    }
                                });

                                processedCount++;
                                totalSize += fileSize;
                            } else {
                                errors.push(`Failed to download ${sourcePath}`);
                            }

                        } catch (fileError) {
                            console.error(`Failed to copy file ${sourcePath}:`, fileError);
                            throw new Error(`Failed to process asset from public folder: ${fileError}`);
                        }
                    } else {
                        throw new Error('Electron API not available - game UI assets can only be processed in Electron environment');
                    }

                    this.updateGameUIProgress({
                        current: processedCount,
                        currentAsset: `${category}/${filename}`,
                        message: `Processed ${filename}`
                    });

                } catch (assetError) {
                    const errorMsg = `Failed to process ${category}/${filename}: ${assetError}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);
                }
            }

        } catch (error) {
            throw error;
        }

        return { processedCount, totalSize, errors };
    }

    async getOverlayAsset(category: string, filename: string): Promise<string | null> {
        try {
            // Get the current version to use proper directory structure
            const version = await DataDragonClient.getLatestVersion();
            const assetKey = `game/${version}/overlay/${category}/${filename}`;

            // Check if asset exists using asset validator
            const cachedPath = AssetValidator.generateCachedPath(assetKey);
            const fileExists = await AssetValidator.checkFileExists(cachedPath);
            if (fileExists) {
                return cachedPath;
            }

            // Check if asset exists in manifest
            const manifest = await this.loadAssetManifest();
            if (manifest && manifest[assetKey]) {
                return manifest[assetKey].path;
            }

            // If not cached, try to process it
            console.log(`Asset ${assetKey} not found in cache, processing...`);

            // Process the single asset
            if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
                const sourcePath = `public/assets/${category}/${filename}`;

                try {
                    // Use downloadAsset with 'cache' category like champion cache to ensure proper path
                    const downloadResult = await this.downloadAsset(sourcePath, 'cache', assetKey);
                    if (downloadResult) {
                        // Save to manifest using the same format as champion cache
                        const actualPath = downloadResult.replace('cache/', '');
                        const sizeResult = await window.electronAPI.getFileSize(actualPath);
                        const fileSize = sizeResult.success ? sizeResult.size || 0 : 0;

                        await this.saveAssetManifest({
                            [assetKey]: {
                                path: downloadResult, // This will be cache/game/...
                                url: sourcePath,
                                size: fileSize,
                                timestamp: Date.now(),
                                checksum: assetKey
                            }
                        });

                        return downloadResult;
                    }
                } catch (error) {
                    console.error(`Failed to process asset ${assetKey}:`, error);
                }
            }

            return null;
        } catch (error) {
            console.error(`Failed to get overlay asset ${category}/${filename}:`, error);
            return null;
        }
    }

    async checkOverlayAssetsStatus(): Promise<{ hasAssets: boolean; categories: string[]; totalCount: number }> {
        try {
            // Define the known asset categories and their files
            const assetCategories = {
                'dragonpit': [
                    'infernal.png', 'ocean.png', 'hextech.png', 'chemtech.png',
                    'mountain.png', 'elder.png', 'cloud.png'
                ],
                'default': [
                    'player.png'
                ],
                'scoreboard': [
                    'gold.png', 'grubs.png', 'tower.png'
                ],
                'atakhan': [
                    'atakhan_ruinous.png', 'atakhan_voracious.png'
                ],
                'baronpit': [
                    'baron.png', 'grubs.png', 'herald.png'
                ]
            };

            const categories = Object.keys(assetCategories);
            const totalCount = Object.values(assetCategories).reduce((sum, files) => sum + files.length, 0);

            return {
                hasAssets: totalCount > 0,
                categories,
                totalCount
            };

        } catch (error) {
            console.error('Failed to check overlay assets status:', error);
            return { hasAssets: false, categories: [], totalCount: 0 };
        }
    }

    protected async getCategoryProgress(category: string): Promise<{ downloaded: number; total: number; completedItems: string[] }> {
        try {
            const manifest = await this.loadAssetManifest();
            const completedItems: string[] = [];

            if (manifest) {
                // Look for assets that match the versioned overlay pattern
                for (const assetKey of Object.keys(manifest)) {
                    if (assetKey.includes(`/overlay/`)) {
                        // Extract the simple asset key (category/filename)
                        const parts = assetKey.split('/');
                        if (parts.length >= 2) {
                            const filename = parts[parts.length - 1];
                            const categoryName = parts[parts.length - 2];

                            // Also verify the file actually exists using the same pattern as champion cache
                            const manifestEntry = manifest[assetKey];
                            if (manifestEntry && manifestEntry.path) {
                                const fileExists = await this.checkFileExists(manifestEntry.path);
                                if (fileExists) {
                                    completedItems.push(`${categoryName}/${filename}`);
                                } else {
                                    console.log(`game ui manifest path: ${manifestEntry.path}`);
                                    console.log(`Game UI asset ${assetKey} in manifest but file missing`);
                                }
                            }
                        }
                    }
                }
            }

            return {
                downloaded: completedItems.length,
                total: completedItems.length,
                completedItems
            };
        } catch (error) {
            console.error(`Failed to get category progress for ${category}:`, error);
            return { downloaded: 0, total: 0, completedItems: [] };
        }
    }

    private async cleanupManifestAfterSuccess(): Promise<void> {
        try {
            if (typeof window === 'undefined' || !window.electronAPI) {
                console.log('Electron API not available, skipping manifest cleanup');
                return;
            }

            // Clear the manifest so that if users delete files, the system will start fresh
            await window.electronAPI.saveAssetManifest({});
            console.log('Game UI manifest cleared successfully. System will restart from scratch if files are deleted.');
        } catch (error) {
            console.error('Failed to cleanup manifest after successful download:', error);
        }
    }

    isCurrentlyDownloading(): boolean {
        return this.isDownloading;
    }
}

export const gameUIBlueprintDownloader = new GameUIBlueprintDownloader();
export type { GameUIAsset, GameUIDownloadProgress, GameUIDownloadResult }; 