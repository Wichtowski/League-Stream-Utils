import { Champion, ChampionSpell } from '../types/game';
import { DDRAGON_CDN } from '../constants';
import { BaseCacheService } from './base-cache';
import { DataDragonClient } from '../utils/datadragon-client';
import { AssetValidator } from '../utils/asset-validator';
import { AssetMigrator } from '../utils/asset-migrator';
import path from 'path';

interface DataDragonChampion {
    id: string;
    key: string;
    name: string;
    title: string;
    image: {
        full: string;
    };
    stats: {
        attackdamage: number;
        attackdamageperlevel: number;
        attackspeed: number;
        attackspeedperlevel: number;
        crit: number;
        critperlevel: number;
        hp: number;
        hpperlevel: number;
        hpregen: number;
        hpregenperlevel: number;
        movespeed: number;
        mp: number;
        mpperlevel: number;
        mpregen: number;
        mpregenperlevel: number;
        spellblock: number;
        spellblockperlevel: number;
    };
    spells: Array<{
        id: string;
        name: string;
        description: string;
        tooltip: string;
        image: {
            full: string;
        };
    }>;
    passive: {
        name: string;
        description: string;
        image: {
            full: string;
        };
    };
}

interface DataDragonResponse {
    data: { [key: string]: DataDragonChampion };
}

interface ChampionCacheData {
    id: number;
    alias: string;
    name: string;
    attackSpeed: number;
    splashCenteredImg: string;
    splashImg: string;
    loadingImg: string;
    squareImg: string;
    spells: ChampionSpell[];
}

// Using DownloadProgress from base-cache.ts

class ChampionCacheService extends BaseCacheService<Champion> {

    // Abstract method implementations
    async getAll(): Promise<Champion[]> {
        return this.getAllChampions();
    }

    async getById(key: string): Promise<Champion | null> {
        return this.getChampionByKey(key);
    }

    async downloadChampionData(championKey: string, version: string): Promise<ChampionCacheData> {
        await this.initialize();

        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }

        // Check if champion is already cached
        const dataKey = `champion-${version}-${championKey}-data`;

        // Check if file exists using asset manifest
        const manifestResult = await window.electronAPI.loadAssetManifest();
        if (manifestResult.success && manifestResult.data) {
            const manifest = manifestResult.data;
            if (manifest[dataKey]) {
                // Load cached data
                const loadResult = await window.electronAPI.loadAssetManifest();
                if (loadResult.success && loadResult.data) {
                    const cachedData = loadResult.data[dataKey];
                    if (cachedData) {
                        return JSON.parse(cachedData.path); // Assuming path contains the data
                    }
                }
            }
        }

        // Download champion data from DataDragon
        const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/champion/${championKey}.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch champion data for ${championKey}: ${response.status}`);
        }

        const championData: { data: { [key: string]: DataDragonChampion } } = await response.json();
        const champion = championData.data[championKey];

        // Create champion directory structure using the correct path format
        const championDir = `game/${version}/champions/${championKey}`;

        // Download champion images
        const images = await this.downloadChampionImages(championKey, version, championDir);

        // Download ability images
        const spells = await this.downloadAbilityImages(champion, version, championDir);

        // Create comprehensive champion data
        const cacheData: ChampionCacheData = {
            id: parseInt(champion.key),
            alias: champion.id,
            name: champion.name,
            attackSpeed: champion.stats.attackspeed,
            splashCenteredImg: images.splashCentered,
            splashImg: images.splash,
            loadingImg: images.loading,
            squareImg: images.square,
            spells
        };

        // Save champion data using asset system with correct path structure
        const dataContent = JSON.stringify(cacheData);
        const dataBuffer = Buffer.from(dataContent, 'utf8');

        await window.electronAPI.saveAssetManifest({
            [dataKey]: {
                path: dataContent,
                url: `${DDRAGON_CDN}/${version}/data/en_US/champion/${championKey}.json`,
                size: dataBuffer.length,
                timestamp: Date.now(),
                checksum: dataKey
            }
        });

        return cacheData;
    }

    private async downloadChampionImages(championKey: string, version: string, championDir: string): Promise<{
        splashCentered: string;
        splash: string;
        loading: string;
        square: string;
    }> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }

        // Define image URLs - using only the ones that work with current DataDragon
        const imageUrls = {
            square: `${DDRAGON_CDN}/${version}/img/champion/${championKey}.png`,
            splash: `${DDRAGON_CDN}/img/champion/splash/${championKey}_0.jpg`,
            splashCentered: `${DDRAGON_CDN}/img/champion/centered/${championKey}_0.jpg`,
            loading: `${DDRAGON_CDN}/img/champion/loading/${championKey}_0.jpg`
        };

        const downloadedImages: { [key: string]: string } = {};

        // Create array of download promises for parallel execution
        const downloadPromises = Object.entries(imageUrls).map(async ([key, url]) => {
            // Use standardized filenames instead of champion-specific names
            let fileName: string;
            if (key === 'square') {
                fileName = 'square.png';
            } else if (key === 'splash') {
                fileName = 'splash.jpg';
            } else if (key === 'splashCentered') {
                fileName = 'splashCentered.jpg';
            } else if (key === 'loading') {
                fileName = 'loading.jpg';
            } else {
                fileName = url.split('/').pop()!;
            }

            // Use the correct directory structure for asset keys
            const assetKey = `${championDir}/${fileName}`;

            try {
                if (typeof window !== 'undefined' && window.electronAPI) {
                    // Check if file already exists by checking the actual file path
                    const userDataPath = await window.electronAPI.getUserDataPath();
                    const fullPath = path.join(userDataPath, 'assets', assetKey);
                    const result = await window.electronAPI.checkFileExists(fullPath);

                    if (result.success && result.exists === true) {
                        // File already exists, use cached path
                        downloadedImages[key] = `cache/${assetKey}`;
                        return;
                    }

                    const downloadResult = await window.electronAPI.downloadAsset(url, 'cache', assetKey);
                    if (downloadResult.success) {
                        // Return the relative path that matches the desired structure
                        downloadedImages[key] = `cache/${assetKey}`;
                    } else {
                        // For splashCentered and loading, fallback to regular splash
                        if (key === 'splashCentered' || key === 'loading') {
                            const fallbackUrl = imageUrls.splash;
                            const fallbackResult = await window.electronAPI.downloadAsset(fallbackUrl, 'cache', assetKey);
                            if (fallbackResult.success) {
                                downloadedImages[key] = `cache/${assetKey}`;
                            } else {
                                console.warn(`Failed to download ${key} image for ${championKey} (including fallback):`, downloadResult.error);
                                downloadedImages[key] = fallbackUrl; // Use fallback URL
                            }
                        } else {
                            console.warn(`Failed to download ${key} image for ${championKey}:`, downloadResult.error);
                            downloadedImages[key] = url; // Fallback to original URL
                        }
                    }
                }
            } catch (_error) {
                console.warn(`Error downloading ${key} image for ${championKey}:`, _error);
                // For splashCentered and loading, fallback to regular splash
                if (key === 'splashCentered' || key === 'loading') {
                    downloadedImages[key] = imageUrls.splash;
                } else {
                    downloadedImages[key] = url; // Fallback to original URL
                }
            }
        });

        // Wait for all downloads to complete
        await Promise.all(downloadPromises);

        return downloadedImages as {
            splashCentered: string;
            splash: string;
            loading: string;
            square: string;
        };
    }

    private async downloadAbilityImages(champion: DataDragonChampion, version: string, championDir: string): Promise<ChampionSpell[]> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }

        const spells: ChampionSpell[] = [];
        const downloadPromises: Promise<void>[] = [];

        // Download regular spells with multiple states
        for (let i = 0; i < champion.spells.length; i++) {
            const spell = champion.spells[i];
            const abilityKey = this.getAbilityKey(i); // Q, W, E, R

            // Download base spell image
            const baseImageUrl = `${DDRAGON_CDN}/${version}/img/spell/${spell.image.full}`;
            const baseFileName = `${champion.id.toLowerCase()}_${abilityKey.toLowerCase()}.png`;
            const baseAssetKey = `${championDir}/abilities/${baseFileName}`;

            downloadPromises.push((async () => {
                if (typeof window !== 'undefined' && window.electronAPI) {
                    // Check if file already exists by checking the actual file path
                    const userDataPath = await window.electronAPI.getUserDataPath();
                    const fullPath = path.join(userDataPath, 'assets', baseAssetKey);
                    const result = await window.electronAPI.checkFileExists(fullPath);

                    if (result.success && result.exists === true) {
                        // File already exists, use cached path
                        spells.push({
                            spellName: spell.id,
                            iconAsset: `cache/${baseAssetKey}`,
                            iconName: baseFileName
                        });
                        return;
                    }

                    const baseDownloadResult = await window.electronAPI.downloadAsset(baseImageUrl, 'cache', baseAssetKey);
                    if (baseDownloadResult.success) {
                        spells.push({
                            spellName: spell.id,
                            iconAsset: `cache/${baseAssetKey}`,
                            iconName: baseFileName
                        });
                    } else {
                        console.warn(`Failed to download base spell image for ${spell.id}:`, baseDownloadResult.error);
                        spells.push({
                            spellName: spell.id,
                            iconAsset: baseImageUrl,
                            iconName: baseFileName
                        });
                    }
                }
            })());

            // Download additional spell states for champions with recast abilities
            const recastSpells = this.getRecastSpellVariants(champion.id, spell.id);
            for (const recastSpell of recastSpells) {
                const recastImageUrl = `${DDRAGON_CDN}/${version}/img/spell/${recastSpell.imageName}`;
                const recastFileName = `${champion.id.toLowerCase()}_${abilityKey.toLowerCase()}_${recastSpell.suffix.toLowerCase()}.png`;
                const recastAssetKey = `${championDir}/abilities/${recastFileName}`;

                downloadPromises.push((async () => {
                    if (typeof window !== 'undefined' && window.electronAPI) {
                        // Check if file already exists by checking the actual file path
                        const userDataPath = await window.electronAPI.getUserDataPath();
                        const fullPath = path.join(userDataPath, 'assets', recastAssetKey);
                        const result = await window.electronAPI.checkFileExists(fullPath);

                        if (result.success && result.exists === true) {
                            // File already exists, use cached path
                            spells.push({
                                spellName: `${spell.id}_${recastSpell.suffix}`,
                                iconAsset: `cache/${recastAssetKey}`,
                                iconName: recastFileName,
                                isRecast: true,
                                baseSpell: spell.id
                            });
                            return;
                        }

                        const recastDownloadResult = await window.electronAPI.downloadAsset(recastImageUrl, 'cache', recastAssetKey);
                        if (recastDownloadResult.success) {
                            spells.push({
                                spellName: `${spell.id}_${recastSpell.suffix}`,
                                iconAsset: `cache/${recastAssetKey}`,
                                iconName: recastFileName,
                                isRecast: true,
                                baseSpell: spell.id
                            });
                        } else {
                            console.warn(`Failed to download recast spell image for ${spell.id}_${recastSpell.suffix}:`, recastDownloadResult.error);
                            spells.push({
                                spellName: `${spell.id}_${recastSpell.suffix}`,
                                iconAsset: recastImageUrl,
                                iconName: recastFileName,
                                isRecast: true,
                                baseSpell: spell.id
                            });
                        }
                    }
                })());
            }
        }

        // Download passive ability
        const passiveImageUrl = `${DDRAGON_CDN}/${version}/img/passive/${champion.passive.image.full}`;
        const passiveFileName = `${champion.id.toLowerCase()}_passive.png`;
        const passiveAssetKey = `${championDir}/abilities/${passiveFileName}`;

        downloadPromises.push((async () => {
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Check if file already exists by checking the actual file path
                const userDataPath = await window.electronAPI.getUserDataPath();
                const fullPath = path.join(userDataPath, 'assets', passiveAssetKey);
                const result = await window.electronAPI.checkFileExists(fullPath);

                if (result.success && result.exists === true) {
                    // File already exists, use cached path
                    spells.push({
                        spellName: `${champion.id}Passive`,
                        iconAsset: `cache/${passiveAssetKey}`,
                        iconName: passiveFileName,
                        isPassive: true
                    });
                    return;
                }

                const passiveDownloadResult = await window.electronAPI.downloadAsset(passiveImageUrl, 'cache', passiveAssetKey);
                if (passiveDownloadResult.success) {
                    spells.push({
                        spellName: `${champion.id}Passive`,
                        iconAsset: `cache/${passiveAssetKey}`,
                        iconName: passiveFileName,
                        isPassive: true
                    });
                } else {
                    console.warn(`Failed to download passive image for ${champion.id}:`, passiveDownloadResult.error);
                    spells.push({
                        spellName: `${champion.id}Passive`,
                        iconAsset: passiveImageUrl,
                        iconName: passiveFileName,
                        isPassive: true
                    });
                }
            }
        })());

        // Wait for all downloads to complete
        await Promise.all(downloadPromises);

        return spells;
    }

    private getAbilityKey(index: number): string {
        const abilityKeys = ['Q', 'W', 'E', 'R'];
        return abilityKeys[index] || 'Q';
    }

    private getRecastSpellVariants(championId: string, spellId: string): Array<{ suffix: string; imageName: string }> {
        const recastVariants: { [championId: string]: { [spellId: string]: Array<{ suffix: string; imageName: string }> } } = {
            'Aatrox': {
                'TheDarkinBlade': [
                    { suffix: 'Q2', imageName: 'AatroxQ2.png' },
                    { suffix: 'Q3', imageName: 'AatroxQ3.png' }
                ]
            },
            'Riven': {
                'BladeoftheExile': [
                    { suffix: 'Q2', imageName: 'RivenQ2.png' },
                    { suffix: 'Q3', imageName: 'RivenQ3.png' }
                ]
            },
            'Yasuo': {
                'SteelTempest': [
                    { suffix: 'Q2', imageName: 'YasuoQ2.png' },
                    { suffix: 'Q3', imageName: 'YasuoQ3.png' }
                ]
            },
            'Yone': {
                'MortalSteel': [
                    { suffix: 'Q2', imageName: 'YoneQ2.png' },
                    { suffix: 'Q3', imageName: 'YoneQ3.png' }
                ]
            },
            'Katarina': {
                'BouncingBlade': [
                    { suffix: 'Q2', imageName: 'KatarinaQ2.png' }
                ]
            },
            'KhaZix': {
                'TasteTheirFear': [
                    { suffix: 'Q2', imageName: 'KhazixQ2.png' }
                ]
            },
            'Kassadin': {
                'NullSphere': [
                    { suffix: 'Q2', imageName: 'KassadinQ2.png' }
                ]
            }
        };

        return recastVariants[championId]?.[spellId] || [];
    }

    async getAllChampions(): Promise<Champion[]> {
        await this.initialize();

        const version = await this.getLatestVersion();
        this.version = version;

        // Get list of all champions from DataDragon
        const response = await fetch(`${DDRAGON_CDN}/${version}/data/en_US/champion.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch champions list: ${response.status}`);
        }

        const data: DataDragonResponse = await response.json();
        const championKeys = Object.keys(data.data);

        const champions: Champion[] = [];
        let currentIndex = 0;

        this.updateProgress({
            current: 0,
            total: championKeys.length,
            itemName: '',
            stage: 'champion-data'
        });

        for (const championKey of championKeys) {
            try {
                currentIndex++;
                this.updateProgress({
                    current: currentIndex,
                    total: championKeys.length,
                    itemName: data.data[championKey].name,
                    stage: 'champion-data'
                });

                const cacheData = await this.downloadChampionData(championKey, version);

                champions.push({
                    id: cacheData.id,
                    name: cacheData.name,
                    key: cacheData.alias,
                    image: cacheData.squareImg,
                    attackSpeed: cacheData.attackSpeed,
                    splashCenteredImg: cacheData.splashCenteredImg,
                    splashImg: cacheData.splashImg,
                    loadingImg: cacheData.loadingImg,
                    squareImg: cacheData.squareImg,
                    spells: cacheData.spells
                });
            } catch (error) {
                console.error(`Failed to process champion ${championKey}:`, error);
                // Add basic champion data as fallback
                const basicChamp = data.data[championKey];
                champions.push({
                    id: parseInt(basicChamp.key),
                    name: basicChamp.name,
                    key: basicChamp.id,
                    image: `${DDRAGON_CDN}/${version}/img/champion/${basicChamp.image.full}`
                });
            }
        }

        this.updateProgress({
            current: championKeys.length,
            total: championKeys.length,
            itemName: '',
            stage: 'complete'
        });

        return champions;
    }

    async getChampionByKey(key: string): Promise<Champion | null> {
        await this.initialize();

        const version = await this.getLatestVersion();

        try {
            const cacheData = await this.downloadChampionData(key, version);

            return {
                id: cacheData.id,
                name: cacheData.name,
                key: cacheData.alias,
                image: cacheData.squareImg,
                attackSpeed: cacheData.attackSpeed,
                splashCenteredImg: cacheData.splashCenteredImg,
                splashImg: cacheData.splashImg,
                loadingImg: cacheData.loadingImg,
                squareImg: cacheData.squareImg,
                spells: cacheData.spells
            };
        } catch (error) {
            console.error(`Failed to get champion ${key}:`, error);
            return null;
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
            console.log('Champion manifest cleared successfully. System will restart from scratch if files are deleted.');
        } catch (error) {
            console.error('Failed to cleanup manifest after successful download:', error);
        }
    }

    async clearCache(): Promise<void> {
        await this.initialize();
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }
        await window.electronAPI.clearAssetCache();
    }

    async getCacheStats(): Promise<{ totalItems: number; totalChampions: number; cacheSize: number; version: string }> {
        await this.initialize();
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }
        const statsResult = await window.electronAPI.getAssetCacheStats();
        const count = statsResult.stats?.fileCount || 0;
        return {
            totalItems: count,
            totalChampions: count,
            cacheSize: statsResult.stats?.totalSize || 0,
            version: this.version
        };
    }

    async checkCacheCompleteness(): Promise<{ isComplete: boolean; missingChampions: string[]; totalExpected: number }> {
        await this.initialize();

        if (typeof window === 'undefined' || !window.electronAPI) {
            return { isComplete: true, missingChampions: [], totalExpected: 0 };
        }

        try {
            const version = await DataDragonClient.getLatestVersion();
            this.version = version;

            // Get list of all champions using DataDragon client
            const championsResponse = await DataDragonClient.getChampions(version);
            const allChampionKeys = Object.keys(championsResponse.data);
            const totalExpected = allChampionKeys.length;

            // Check category progress, but migrate existing files if manifest is empty
            const categoryProgress = await this.getCategoryProgress('champions');
            let completedChampions = categoryProgress.completedItems;

            // If no champions in manifest but files exist, migrate them
            if (completedChampions.length === 0) {
                console.log('No champions found in category manifest, checking for existing files...');
                const migrationResult = await AssetMigrator.migrateChampions(allChampionKeys, {
                    targetVersion: version,
                    updateCategoryManifest: true
                });

                if (migrationResult.migratedItems.length > 0) {
                    console.log(`Migrated ${migrationResult.migratedItems.length} existing champions to category manifest`);
                    completedChampions = migrationResult.migratedItems;

                    // Update category manifest with migrated items
                    await AssetMigrator.updateCategoryManifest(
                        'champions',
                        migrationResult.migratedItems,
                        totalExpected,
                        version,
                        this.updateCategoryProgress.bind(this)
                    );
                }
            }

            // Use asset validator for file validation
            const missingChampions: string[] = [];

            for (const championKey of allChampionKeys) {
                // First check if it's in completed list (category manifest is source of truth)
                if (!completedChampions.includes(championKey)) {
                    missingChampions.push(championKey);
                    continue;
                }

                // For champions in completed list, only verify the key file actually exists on disk
                const squareImagePath = AssetValidator.generateCachedPath(
                    AssetValidator.generateAssetKey('champion', version, championKey, 'square.png')
                );
                const squareExists = await AssetValidator.checkFileExists(squareImagePath);

                if (!squareExists) {
                    console.log(`Champion ${championKey} in category manifest but files missing, will re-download`);
                    missingChampions.push(championKey);
                }
            }

            console.log(`Found ${completedChampions.length - missingChampions.length} verified champions out of ${allChampionKeys.length} total`);

            return {
                isComplete: missingChampions.length === 0,
                missingChampions,
                totalExpected
            };

        } catch (error) {
            console.error('Failed to check cache completeness:', error);
            return {
                isComplete: false,
                missingChampions: [],
                totalExpected: 0
            };
        }
    }

    // Migration function to scan existing champion files and add them to category manifest
    private async migrateExistingChampions(allChampionKeys: string[], version: string): Promise<string[]> {
        const existingChampions: string[] = [];

        try {
            console.log(`Migrating existing champions for version ${version}...`);

            // First, check if champions exist in the current version directory
            for (const championKey of allChampionKeys) {
                const squareImagePath = `cache/game/${version}/champions/${championKey}/square.png`;
                const fileExists = await this.checkFileExists(squareImagePath);

                if (fileExists) {
                    existingChampions.push(championKey);
                }
            }

            // If we found champions in the current version, we're done
            if (existingChampions.length > 0) {
                console.log(`Found ${existingChampions.length} champions in current version ${version}`);
            } else {
                // If no champions found in current version, check previous versions
                console.log(`No champions found in version ${version}, checking previous versions...`);

                // Get list of previous versions (hardcoded common versions for now)
                const versionsToCheck = [
                    '15.12.1', '15.11.1', '15.10.1', '15.9.1', '15.8.1',
                    '15.7.1', '15.6.1', '15.5.1', '15.4.1', '15.3.1',
                    '14.24.1', '14.23.1', '14.22.1', '14.21.1', '14.20.1'
                ];

                for (const checkVersion of versionsToCheck) {
                    if (checkVersion === version) continue; // Skip current version, already checked

                    let foundInThisVersion = 0;
                    for (const championKey of allChampionKeys) {
                        const squareImagePath = `cache/game/${checkVersion}/champions/${championKey}/square.png`;
                        const fileExists = await this.checkFileExists(squareImagePath);

                        if (fileExists && !existingChampions.includes(championKey)) {
                            existingChampions.push(championKey);
                            foundInThisVersion++;
                        }
                    }

                    if (foundInThisVersion > 0) {
                        console.log(`Found ${foundInThisVersion} champions in version ${checkVersion}`);

                        // If we found a significant number of champions in this version, 
                        // it's likely the main version the user has
                        if (foundInThisVersion > 50) {
                            console.log(`Version ${checkVersion} appears to be the main version with ${foundInThisVersion} champions`);
                            break; // Stop checking further versions
                        }
                    }
                }
            }

            // If we found existing champions, update the category manifest
            if (existingChampions.length > 0) {
                await this.updateCategoryProgress(
                    'champions',
                    version,
                    existingChampions[existingChampions.length - 1], // Last champion as "last downloaded"
                    allChampionKeys.length,
                    existingChampions.length,
                    existingChampions
                );
                console.log(`Successfully migrated ${existingChampions.length} existing champions to category manifest`);
            } else {
                console.log('No existing champions found in any version directory');
            }

            return existingChampions;
        } catch (error) {
            console.error('Error during champion migration:', error);
            return [];
        }
    }

    async downloadAllChampionsOnStartup(): Promise<{ success: boolean; totalChampions: number; errors: string[] }> {
        await this.initialize();

        if (typeof window === 'undefined' || !window.electronAPI) {
            return { success: false, totalChampions: 0, errors: ['Electron API not available'] };
        }

        try {
            const version = await this.getLatestVersion();
            this.version = version;

            console.log(`Starting automatic champion download for version ${version}...`);

            // Check which champions are missing using category progress
            const cacheCheck = await this.checkCacheCompleteness();
            const championKeys = cacheCheck.missingChampions;
            const totalChampions = championKeys.length;
            const totalExpected = cacheCheck.totalExpected;
            const errors: string[] = [];

            // Load existing progress from category manifest
            const categoryProgress = await this.getCategoryProgress('champions');
            const completedChampions = categoryProgress.completedItems;

            if (totalChampions === 0) {
                console.log('All champions are already cached!');

                // Report completion with the total expected count
                this.updateProgress({
                    current: totalExpected,
                    total: totalExpected,
                    itemName: '',
                    stage: 'complete',
                    assetType: 'champion',
                    currentAsset: 'Champions downloaded successfully'
                });

                return { success: true, totalChampions: totalExpected, errors: [] };
            }

            console.log(`Found ${totalChampions} missing champions to download`);

            // Download champions one by one for better progress tracking
            let downloadedCount = 0;
            const startingCount = completedChampions.length;

            for (const championKey of championKeys) {
                try {
                    // Update progress for current champion - unified stage
                    this.updateProgress({
                        current: downloadedCount + startingCount,
                        total: totalExpected,
                        itemName: championKey,
                        stage: 'downloading',
                        assetType: 'champion',
                        currentAsset: `${championKey}`
                    });

                    await this.downloadChampionData(championKey, version);
                    downloadedCount++;

                    // Add to completed items
                    completedChampions.push(championKey);

                    // Update category progress manifest
                    await this.updateCategoryProgress(
                        'champions',
                        version,
                        championKey,
                        totalExpected,
                        startingCount + downloadedCount,
                        completedChampions
                    );

                    // Update progress after successful download
                    this.updateProgress({
                        current: downloadedCount + startingCount,
                        total: totalExpected,
                        itemName: championKey,
                        stage: 'downloading',
                        assetType: 'champion',
                        currentAsset: `${championKey} complete`
                    });

                } catch (error) {
                    const errorMsg = `Failed to download ${championKey}: ${error}`;
                    console.error(errorMsg);
                    errors.push(errorMsg);

                    // Still update progress even if download failed
                    this.updateProgress({
                        current: downloadedCount + startingCount,
                        total: totalExpected,
                        itemName: championKey,
                        stage: 'downloading',
                        assetType: 'champion',
                        currentAsset: `${championKey} failed`
                    });
                }

                // Small delay between champions to be nice to the API
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Final progress update
            this.updateProgress({
                current: totalExpected,
                total: totalExpected,
                itemName: '',
                stage: 'complete',
                assetType: 'champion',
                currentAsset: 'Champions downloaded successfully'
            });

            // Clean up manifests after successful completion
            if (downloadedCount > 0) {
                console.log('All champions downloaded successfully. Cleaning up manifests for fresh restart capability.');
                await this.cleanupManifestAfterSuccess();
            }

            return {
                success: downloadedCount > 0,
                totalChampions: downloadedCount,
                errors
            };

        } catch (error) {
            console.error('Failed to download champions:', error);
            return {
                success: false,
                totalChampions: 0,
                errors: [`Failed to download champions: ${error}`]
            };
        }
    }
}

export const championCacheService = new ChampionCacheService(); 