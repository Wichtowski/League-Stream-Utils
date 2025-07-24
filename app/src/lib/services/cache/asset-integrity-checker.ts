import { championCacheService } from './champion';

export interface AssetIntegrityResult {
    isValid: boolean;
    missingAssets: string[];
    corruptedAssets: string[];
    totalAssets: number;
    validAssets: number;
    missingCount: number;
    corruptedCount: number;
}

export interface AssetManifest {
    [assetKey: string]: {
        path: string;
        url: string;
        size: number;
        timestamp: number;
        checksum: string;
        downloadSpeed?: number;
        downloadTime?: number;
    };
}

class AssetIntegrityChecker {
    private manifest: AssetManifest = {};
    private isChecking = false;

    async checkAllAssets(): Promise<AssetIntegrityResult> {
        if (this.isChecking) {
            throw new Error('Integrity check already in progress');
        }

        this.isChecking = true;

        try {
            // Legacy manifest loading disabled - using category-specific manifests now

            const missingAssets: string[] = [];
            const corruptedAssets: string[] = [];
            let totalAssets = 0;
            let validAssets = 0;

            // Check champion assets
            const championResult = await this.checkChampionAssets();
            missingAssets.push(...championResult.missing);
            corruptedAssets.push(...championResult.corrupted);
            totalAssets += championResult.total;
            validAssets += championResult.valid;

            // Check item assets (placeholder for future expansion)
            const itemResult = await this.checkItemAssets();
            missingAssets.push(...itemResult.missing);
            corruptedAssets.push(...itemResult.corrupted);
            totalAssets += itemResult.total;
            validAssets += itemResult.valid;

            // Check spell assets (placeholder for future expansion)
            const spellResult = await this.checkSpellAssets();
            missingAssets.push(...spellResult.missing);
            corruptedAssets.push(...spellResult.corrupted);
            totalAssets += spellResult.total;
            validAssets += spellResult.valid;

            // Check rune assets (placeholder for future expansion)
            const runeResult = await this.checkRuneAssets();
            missingAssets.push(...runeResult.missing);
            corruptedAssets.push(...runeResult.corrupted);
            totalAssets += runeResult.total;
            validAssets += runeResult.valid;

            const result: AssetIntegrityResult = {
                isValid: missingAssets.length === 0 && corruptedAssets.length === 0,
                missingAssets,
                corruptedAssets,
                totalAssets,
                validAssets,
                missingCount: missingAssets.length,
                corruptedCount: corruptedAssets.length
            };

            return result;

        } finally {
            this.isChecking = false;
        }
    }

    private async checkChampionAssets(): Promise<{
        missing: string[];
        corrupted: string[];
        total: number;
        valid: number;
    }> {
        const missing: string[] = [];
        const corrupted: string[] = [];
        let total = 0;
        let valid = 0;

        try {
            const version = '15.13.1'; // TODO: Get from service
            const championCompleteness = await championCacheService.checkCacheCompleteness();

            for (const championKey of championCompleteness.missingChampions) {
                const championDir = `game/${version}/champions/${championKey}`;

                // Check champion data
                const dataKey = `${championDir}/data.json`;
                const dataResult = await this.checkAsset(dataKey);
                if (dataResult === 'missing') {
                    missing.push(dataKey);
                } else if (dataResult === 'corrupted') {
                    corrupted.push(dataKey);
                } else {
                    valid++;
                }
                total++;

                // Check champion images
                const imageKeys = [
                    `${championDir}/square.png`,
                    `${championDir}/splash.jpg`,
                    `${championDir}/splashCentered.jpg`,
                    `${championDir}/loading.jpg`
                ];

                for (const imageKey of imageKeys) {
                    const imageResult = await this.checkAsset(imageKey);
                    if (imageResult === 'missing') {
                        missing.push(imageKey);
                    } else if (imageResult === 'corrupted') {
                        corrupted.push(imageKey);
                    } else {
                        valid++;
                    }
                    total++;
                }

                // Check ability images
                const abilityKeys = [
                    `${championDir}/abilities/q.png`,
                    `${championDir}/abilities/w.png`,
                    `${championDir}/abilities/e.png`,
                    `${championDir}/abilities/r.png`,
                    `${championDir}/abilities/passive.png`
                ];

                for (const abilityKey of abilityKeys) {
                    const abilityResult = await this.checkAsset(abilityKey);
                    if (abilityResult === 'missing') {
                        missing.push(abilityKey);
                    } else if (abilityResult === 'corrupted') {
                        corrupted.push(abilityKey);
                    } else {
                        valid++;
                    }
                    total++;
                }
            }

            // Also check existing champions for corruption
            const existingChampions = Object.keys(this.manifest).filter(key =>
                key.startsWith(`game/${version}/champions/`) &&
                !championCompleteness.missingChampions.some(missing => key.includes(missing))
            );

            for (const assetKey of existingChampions) {
                const result = await this.checkAsset(assetKey);
                if (result === 'missing') {
                    missing.push(assetKey);
                } else if (result === 'corrupted') {
                    corrupted.push(assetKey);
                } else {
                    valid++;
                }
                total++;
            }

        } catch (error) {
            console.error('Error checking champion assets:', error);
        }

        return { missing, corrupted, total, valid };
    }

    private async checkItemAssets(): Promise<{
        missing: string[];
        corrupted: string[];
        total: number;
        valid: number;
    }> {
        // Placeholder for item asset checking
        // TODO: Implement when item system is added
        return { missing: [], corrupted: [], total: 0, valid: 0 };
    }

    private async checkSpellAssets(): Promise<{
        missing: string[];
        corrupted: string[];
        total: number;
        valid: number;
    }> {
        // Placeholder for spell asset checking
        // TODO: Implement when spell system is added
        return { missing: [], corrupted: [], total: 0, valid: 0 };
    }

    private async checkRuneAssets(): Promise<{
        missing: string[];
        corrupted: string[];
        total: number;
        valid: number;
    }> {
        // Placeholder for rune asset checking
        // TODO: Implement when rune system is added
        return { missing: [], corrupted: [], total: 0, valid: 0 };
    }

    private async checkAsset(assetKey: string): Promise<'valid' | 'missing' | 'corrupted'> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            return 'missing';
        }

        try {
            // Check if asset exists in manifest
            const manifestEntry = this.manifest[assetKey];
            if (!manifestEntry) {
                return 'missing';
            }

            // Check if file exists on disk
            const fileExists = await window.electronAPI.checkFileExists(manifestEntry.path);
            if (!fileExists.success || !fileExists.exists) {
                return 'missing';
            }

            // Check file size
            const sizeResult = await window.electronAPI.getFileSize(manifestEntry.path);
            if (!sizeResult.success || sizeResult.size !== manifestEntry.size) {
                return 'corrupted';
            }

            // Check if file is too old (optional - could be configurable)
            const fileAge = Date.now() - manifestEntry.timestamp;
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
            if (fileAge > maxAge) {
                return 'corrupted'; // Consider old files as corrupted
            }

            return 'valid';

        } catch (error) {
            console.warn(`Error checking asset ${assetKey}:`, error);
            return 'missing';
        }
    }

    async addCustomAssets(assetPaths: string[]): Promise<{
        added: string[];
        failed: string[];
    }> {
        const added: string[] = [];
        const failed: string[] = [];

        for (const assetPath of assetPaths) {
            try {
                // Extract asset key from path
                const assetKey = this.extractAssetKeyFromPath(assetPath);
                if (!assetKey) {
                    failed.push(assetPath);
                    continue;
                }

                // Add to manifest
                if (typeof window !== 'undefined' && window.electronAPI) {
                    const sizeResult = await window.electronAPI.getFileSize(assetPath);
                    if (sizeResult.success && sizeResult.size !== undefined) {
                        const manifestEntry = {
                            path: assetPath,
                            url: '', // No URL for custom assets
                            size: sizeResult.size,
                            timestamp: Date.now(),
                            checksum: assetKey
                        };

                        // Update manifest
                        this.manifest[assetKey] = manifestEntry;
                        added.push(assetPath);
                    } else {
                        failed.push(assetPath);
                    }
                }
            } catch (error) {
                console.error(`Failed to add custom asset ${assetPath}:`, error);
                failed.push(assetPath);
            }
        }

        return { added, failed };
    }

    private extractAssetKeyFromPath(filePath: string): string | null {
        try {
            // Extract relative path from AppData\Roaming\League Stream Utils\assets\cache\
            const cacheIndex = filePath.indexOf('assets\\cache\\');
            if (cacheIndex === -1) {
                return null;
            }

            const relativePath = filePath.substring(cacheIndex + 'assets\\cache\\'.length);
            return relativePath.replace(/\\/g, '/');
        } catch (error) {
            console.error('Error extracting asset key from path:', error);
            return null;
        }
    }

    getManifest(): AssetManifest {
        return { ...this.manifest };
    }

    isCurrentlyChecking(): boolean {
        return this.isChecking;
    }
}

export const assetIntegrityChecker = new AssetIntegrityChecker(); 