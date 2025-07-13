import { storage } from '@lib/utils/storage';
import { BaseCacheService } from './base-cache';

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
            console.log('Game UI progress update:', fullProgress);
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
            console.log(`Found ${totalCount} game UI assets in ${Object.keys(assetCategories).length} categories`);

            // Check category progress to see what's already been processed
            const categoryProgress = await this.getCategoryProgress('game-ui');
            const completedAssets = categoryProgress.completedItems;
            const alreadyProcessed = completedAssets.length;

            console.log(`Found ${alreadyProcessed} game UI assets already processed out of ${totalCount} total`);

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
                    currentAsset: `${category} category`,
                    message: `Processing ${category} assets...`
                });

                try {
                    console.log(`Processing category: ${category}`);
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

                    console.log(`Processed ${categoryResult.processedCount} assets from ${category} category`);

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
                message: `Successfully processed ${processedCount} game UI assets`
            });

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
            console.log(`Processing category: ${category}`);

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
                    console.log(`Processing asset ${i + 1}/${files.length}: ${filename}`);

                    const storageKey = `overlay/${category}/${filename}`;

                    // In Electron, we can copy the asset from public folder to cache
                    let assetData: Buffer;

                    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
                        // Use Electron API to copy the file from public folder to cache
                        // The path should be relative to the app's root directory
                        const sourcePath = `public/assets/${category}/${filename}`;
                        try {
                            const copyResult = await window.electronAPI.copyAssetFile(sourcePath, storageKey);
                            if (!copyResult.success) {
                                throw new Error(`Failed to copy ${sourcePath}: ${copyResult.error}`);
                            }

                            // Read the copied file to get its data
                            const fileExistsResult = await window.electronAPI.checkFileExists(copyResult.localPath!);
                            if (!fileExistsResult.success || !fileExistsResult.exists) {
                                throw new Error(`Copied file not found: ${copyResult.localPath}`);
                            }

                            // Get file size
                            const sizeResult = await window.electronAPI.getFileSize(copyResult.localPath!);
                            if (!sizeResult.success) {
                                throw new Error(`Failed to get file size: ${sizeResult.error}`);
                            }

                            // Create a placeholder buffer for the file data
                            // The actual file is now in the cache, we just need to track it
                            assetData = Buffer.alloc(sizeResult.size || 1024);

                        } catch (fileError) {
                            console.error(`Failed to copy file ${sourcePath}:`, fileError);
                            // Fallback to fetch if file copy fails
                            const response = await fetch(`/assets/${category}/${filename}`);
                            if (!response.ok) {
                                throw new Error(`Failed to fetch ${category}/${filename}: ${response.status}`);
                            }
                            const arrayBuffer = await response.arrayBuffer();
                            assetData = Buffer.from(arrayBuffer);
                        }
                    } else {
                        // Fallback to fetch for non-Electron environments
                        const response = await fetch(`/assets/${category}/${filename}`);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch ${category}/${filename}: ${response.status}`);
                        }
                        const arrayBuffer = await response.arrayBuffer();
                        assetData = Buffer.from(arrayBuffer);
                    }

                    // Store the asset metadata
                    await storage.set(storageKey, {
                        data: assetData,
                        size: assetData.length,
                        timestamp: Date.now(),
                        url: `/assets/${category}/${filename}`,
                        category: category,
                        filename: filename
                    });

                    console.log(`Successfully processed: ${storageKey} (${assetData.length} bytes)`);

                    processedCount++;
                    totalSize += assetData.length;

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

    async getOverlayAsset(category: string, filename: string): Promise<Buffer | null> {
        try {
            const assetKey = `overlay/${category}/${filename}`;
            const cached = await storage.get<{
                data: Buffer | null;
                size: number;
                timestamp: number;
                url?: string;
                category?: string;
                filename?: string;
            }>(assetKey);

            if (cached && cached.data) {
                // Return the cached data
                return cached.data;
            }

            // If not cached, fetch directly from public assets
            const response = await fetch(`/assets/${category}/${filename}`);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                const assetData = Buffer.from(arrayBuffer);

                // Cache the asset for future use
                await storage.set(assetKey, {
                    data: assetData,
                    size: assetData.length,
                    timestamp: Date.now(),
                    url: `/assets/${category}/${filename}`,
                    category: category,
                    filename: filename
                });

                return assetData;
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

    isCurrentlyDownloading(): boolean {
        return this.isDownloading;
    }
}

export const gameUIBlueprintDownloader = new GameUIBlueprintDownloader();
export type { GameUIAsset, GameUIDownloadProgress, GameUIDownloadResult }; 