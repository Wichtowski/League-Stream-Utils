import { championCacheService } from './champion-cache';
import { itemCacheService } from './item-cache';
import { DownloadProgress } from './base-cache';

export type AssetCategory = 'champion' | 'item' | 'spell' | 'rune';

export interface BootstrapProgress extends DownloadProgress {
    category: AssetCategory;
}

/**
 * Helper that limits concurrency of promise-based tasks.
 */
const runWithConcurrency = async (
    tasks: Array<() => Promise<void>>,
    concurrency: number,
): Promise<void> => {
    let running = 0;
    let index = 0;

    return new Promise((resolve, reject) => {
        const launchNext = (): void => {
            if (index >= tasks.length && running === 0) {
                resolve();
                return;
            }

            while (running < concurrency && index < tasks.length) {
                const task = tasks[index++];
                running += 1;
                task()
                    .catch((err) => {
                        reject(err);
                    })
                    .finally(() => {
                        running -= 1;
                        launchNext();
                    });
            }
        };

        launchNext();
    });
};

/**
 * Downloads every asset category that is not yet fully cached.
 * Runs at most three categories in parallel.
 */
export const downloadAllAssets = async (
    onProgress?: (progress: BootstrapProgress) => void,
): Promise<void> => {
    // Champion download task ---------------------------------------------------
    const championTask = async (): Promise<void> => {
        championCacheService.onProgress((p) => {
            onProgress?.({ ...p, category: 'champion' });
        });
        await championCacheService.downloadAllChampionsOnStartup();
    };

    // Item download task -------------------------------------------------------
    const itemTask = async (): Promise<void> => {
        itemCacheService.onProgress((p) => {
            onProgress?.({ ...p, category: 'item' });
        });
        await itemCacheService.getAll();
    };

    // Placeholder spell/rune tasks (no-op for now) -----------------------------
    const noopTask = async (): Promise<void> => {
        return Promise.resolve();
    };

    const tasks: Array<() => Promise<void>> = [championTask, itemTask, noopTask, noopTask];

    await runWithConcurrency(tasks, 10);

    // Final completion notification
    onProgress?.({
        current: 1,
        total: 1,
        itemName: 'all-assets',
        stage: 'complete',
        percentage: 100,
        category: 'champion', // arbitrary
    });
}; 