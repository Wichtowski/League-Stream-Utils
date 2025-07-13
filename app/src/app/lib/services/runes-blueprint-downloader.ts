import { BaseBlueprintDownloader, BlueprintDownloaderConfig } from './base-blueprint-downloader';

interface CommunityDragonRune {
    id: number;
    name: string;
    iconPath: string;
    shortDesc: string;
    longDesc: string;
    slot: number;
    key: string;
}

interface CommunityDragonRuneResponse {
    [key: string]: CommunityDragonRune;
}

export class RunesBlueprintDownloader extends BaseBlueprintDownloader<CommunityDragonRuneResponse> {
    private readonly COMMUNITY_DRAGON_BASE = 'https://raw.communitydragon.org';
    private readonly DDRAGON_CDN = 'https://ddragon.leagueoflegends.com/cdn';

    protected config: BlueprintDownloaderConfig = {
        endpoint: 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json',
        blueprintFileName: 'runes-blueprint.json',
        assetType: 'rune',
        basePath: 'cache/game'
    };

    async downloadBlueprint(version: string): Promise<void> {
        console.log('RunesBlueprintDownloader.downloadBlueprint called with version:', version);
        await this.initialize();

        try {
            // Update progress - fetching data
            this.updateProgress({
                current: 0,
                total: 1,
                itemName: 'runes',
                stage: 'downloading',
                currentAsset: 'Fetching runes data...',
                assetType: 'rune-data'
            });

            console.log('Fetching runes data from:', this.config.endpoint);
            // Download data from CommunityDragon
            const response = await fetch(this.config.endpoint);
            if (!response.ok) {
                throw new Error(`Failed to fetch runes blueprint: ${response.status}`);
            }

            const data: CommunityDragonRuneResponse = await response.json();
            const allRunes = Object.values(data);

            // Filter out template runes from total count
            const validRunes = allRunes.filter(rune =>
                rune.iconPath && rune.iconPath !== '/lol-game-data/assets/v1/perk-images/Template/7000.png'
            );
            const totalRunes = validRunes.length;

            console.log('Runes data fetched successfully, got', totalRunes, 'valid runes (filtered out template runes)');

            // Check category progress instead of individual file checks
            const categoryProgress = await this.getCategoryProgress('runes');
            let completedRunes = categoryProgress.completedItems;

            // If no runes in manifest but files might exist, migrate them
            if (completedRunes.length === 0) {
                console.log('No runes found in category manifest, checking for existing files...');
                const existingRunes = await this.migrateExistingRunes(validRunes, version);
                if (existingRunes.length > 0) {
                    console.log(`Migrated ${existingRunes.length} existing runes to category manifest`);
                    completedRunes = existingRunes;
                }
            }

            const alreadyDownloaded = completedRunes.length;

            console.log(`Found ${alreadyDownloaded} runes already downloaded out of ${totalRunes} total`);

            // Update progress - downloading icons
            this.updateProgress({
                current: alreadyDownloaded,
                total: totalRunes,
                itemName: 'runes',
                stage: 'downloading',
                currentAsset: alreadyDownloaded > 0 ? `Found ${alreadyDownloaded} runes already downloaded` : 'Starting rune download...',
                assetType: 'rune-images'
            });

            // Download rune icons using the filtered valid runes
            const downloadedCount = await this.downloadRuneIcons(validRunes, version, completedRunes);

            // Create the blueprint directory structure
            const basePath = this.config.basePath || 'game';
            const blueprintDir = `${basePath}/${version}`;
            const blueprintPath = `${blueprintDir}/${this.config.blueprintFileName}`;

            // Save the blueprint using asset manifest system
            const dataContent = JSON.stringify(data, null, 2);
            const dataBuffer = Buffer.from(dataContent, 'utf8');

            await this.saveAssetManifest({
                [blueprintPath]: {
                    path: dataContent,
                    url: this.config.endpoint,
                    size: dataBuffer.length,
                    timestamp: Date.now(),
                    checksum: blueprintPath
                }
            });

            // Update progress - complete with actual count
            this.updateProgress({
                current: downloadedCount,
                total: totalRunes,
                itemName: 'runes',
                stage: 'complete',
                currentAsset: 'Runes downloaded successfully',
                assetType: 'rune-data'
            });

            console.log(`${this.config.assetType} blueprint saved to ${blueprintPath}`);
        } catch (error) {
            console.error(`Error downloading ${this.config.assetType} blueprint:`, error);

            // Update progress - error
            this.updateProgress({
                current: 0,
                total: 1,
                itemName: 'runes',
                stage: 'error',
                currentAsset: 'Failed to download runes',
                assetType: 'rune-data'
            });

            throw error;
        }
    }

    private async downloadRuneIcons(validRunes: CommunityDragonRune[], version: string, completedRunes: string[]): Promise<number> {
        if (typeof window === 'undefined' || !window.electronAPI) {
            throw new Error('Electron API not available');
        }

        const runeDir = `game/${version}/runes`;
        const totalRunes = validRunes.length;

        // Filter out runes that have already been downloaded
        const runesToDownload = validRunes.filter(rune =>
            !completedRunes.includes(rune.id.toString())
        );

        const alreadyDownloaded = completedRunes.length;
        let downloadedCount = alreadyDownloaded;
        const currentCompletedRunes = [...completedRunes];

        console.log(`Found ${alreadyDownloaded} runes already downloaded, ${runesToDownload.length} runes to download`);

        // If all runes are already downloaded, skip the download process
        if (runesToDownload.length === 0) {
            console.log('All rune icons already downloaded');
            return totalRunes;
        }

        console.log(`Downloading ${runesToDownload.length} new rune icons...`);

        for (const rune of runesToDownload) {
            try {
                // Convert icon path to DataDragon CDN URL
                const iconPath = rune.iconPath.replace('/lol-game-data/assets/v1/perk-images/', '');
                const iconUrl = `${this.DDRAGON_CDN}/img/perk-images/${iconPath}`;

                // Determine style (color) from rune.key (e.g., Domination, Precision, etc.)
                // If rune.key is undefined, try to extract from icon path or use a default
                let style = rune.key;
                if (!style) {
                    // Try to extract style from icon path
                    const pathParts = iconPath.split('/');
                    if (pathParts.length > 0) {
                        style = pathParts[0]; // Use first part of path as style
                    } else {
                        style = 'Unknown'; // Fallback
                    }
                }

                // Use the last part of the iconPath as the file name
                const iconFileName = iconPath.split('/').pop() || `${rune.name}.png`;
                const iconKey = `${runeDir}/${style}/${iconFileName}`;

                // Update progress for current rune
                this.updateProgress({
                    current: downloadedCount,
                    total: totalRunes,
                    itemName: 'runes',
                    stage: 'downloading',
                    currentAsset: `Downloading ${rune.name}...`,
                    assetType: 'rune-images'
                });

                await this.downloadRuneIcon(iconUrl, iconKey);
                downloadedCount++;
                currentCompletedRunes.push(rune.id.toString());

                // Update category progress
                await this.updateCategoryProgress(
                    'runes',
                    version,
                    rune.id.toString(),
                    totalRunes,
                    downloadedCount,
                    currentCompletedRunes
                );

                // Update progress after successful download
                this.updateProgress({
                    current: downloadedCount,
                    total: totalRunes,
                    itemName: 'runes',
                    stage: 'downloading',
                    currentAsset: `Downloaded ${rune.name}`,
                    assetType: 'rune-images'
                });

                if ((downloadedCount - alreadyDownloaded) % 10 === 0) {
                    console.log(`Downloaded ${downloadedCount - alreadyDownloaded}/${runesToDownload.length} new rune icons... (${downloadedCount}/${totalRunes} total)`);
                }
            } catch (error) {
                console.error(`Failed to download rune icon for ${rune.name}:`, error);

                // Update progress even on error to show which rune failed
                this.updateProgress({
                    current: downloadedCount,
                    total: totalRunes,
                    itemName: 'runes',
                    stage: 'downloading',
                    currentAsset: `Failed to download ${rune.name}`,
                    assetType: 'rune-images'
                });
            }
        }

        console.log(`Successfully downloaded ${downloadedCount - alreadyDownloaded} new rune icons (${downloadedCount}/${totalRunes} total)`);
        return downloadedCount;
    }

    private async downloadRuneIcon(url: string, assetKey: string): Promise<void> {
        try {
            const result = await this.downloadAsset(url, 'cache', assetKey);
            if (!result) {
                throw new Error(`Failed to download rune icon from ${url}`);
            }
        } catch (error) {
            console.error(`Error downloading rune icon from ${url}:`, error);
            throw error;
        }
    }
}

export const runesBlueprintDownloader = new RunesBlueprintDownloader(); 