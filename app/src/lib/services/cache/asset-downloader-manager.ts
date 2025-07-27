import { AssetDownloader } from './asset-downloader';

class AssetDownloaderManager {
    private static instance: AssetDownloaderManager;
    private downloader: AssetDownloader | null = null;

    private constructor() {}

    static getInstance(): AssetDownloaderManager {
        if (!AssetDownloaderManager.instance) {
            AssetDownloaderManager.instance = new AssetDownloaderManager();
        }
        return AssetDownloaderManager.instance;
    }

    setDownloader(downloader: AssetDownloader): void {
        this.downloader = downloader;
    }

    async pauseAllProcesses(): Promise<void> {
        try {
            // Pause the asset downloader if it exists
            if (this.downloader) {
                this.downloader.pauseDownload();
            }

            // Pause background processes via Electron API
            if (typeof window !== 'undefined' && window.electronAPI?.pauseBackgroundProcesses) {
                await window.electronAPI.pauseBackgroundProcesses();
            }
        } catch (error) {
            console.warn('Failed to pause all processes:', error);
        }
    }

    async resumeAllProcesses(): Promise<void> {
        try {
            // Resume the asset downloader if it exists
            if (this.downloader) {
                this.downloader.resumeDownload();
            }

            // Resume background processes via Electron API
            if (typeof window !== 'undefined' && window.electronAPI?.resumeBackgroundProcesses) {
                await window.electronAPI.resumeBackgroundProcesses();
            }
        } catch (error) {
            console.warn('Failed to resume all processes:', error);
        }
    }

    isPaused(): boolean {
        return this.downloader?.isPaused() || false;
    }
}

export const assetDownloaderManager = AssetDownloaderManager.getInstance(); 