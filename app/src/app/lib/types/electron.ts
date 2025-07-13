import { Tournament } from '@lib/types/tournament';
import { Champion } from '@lib/types/game';

export interface TournamentData {
    tournament: Tournament;
    teams: string[];
    settings: Record<string, string | number | boolean>;
}

export interface ChampionsData {
    champions: Champion[];
    version: string;
    lastUpdated: string;
}

export interface CachedAsset {
    path: string;
    url: string;
    size: number;
    timestamp: number;
    checksum: string;
}

export interface LCUChampSelectSession {
    timer: {
        phase: string;
        adjustedTimeLeftInPhase: number;
    };
    bans: {
        myTeamBans: number[];
        theirTeamBans: number[];
    };
    picks: {
        myTeam: Array<{
            championId: number;
            spell1Id: number;
            spell2Id: number;
        }>;
        theirTeam: Array<{
            championId: number;
            spell1Id: number;
            spell2Id: number;
        }>;
    };
}

export interface LCUData {
    isConnected: boolean;
    isConnecting: boolean;
    champSelectSession: LCUChampSelectSession | null;
    connectionError: string | null;
    useMockData: boolean;
}

export interface ElectronAPI {
    // Platform info
    isElectron: boolean;
    platform: string;

    // File operations
    saveTournamentFile: (data: TournamentData) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    saveChampionsCache: (data: ChampionsData) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    loadChampionsCache: () => Promise<{ success: boolean; data?: ChampionsData; error?: string }>;
    copyAssetFile: (sourcePath: string, fileName: string) => Promise<{ success: boolean; localPath?: string; error?: string }>;
    saveCameraUpload: (fileBuffer: Buffer, fileName: string) => Promise<{ success: boolean; localPath?: string; publicPath?: string; error?: string }>;
    getUserDataPath: () => Promise<string>;
    checkFileExists: (filePath: string) => Promise<{ success: boolean; exists?: boolean; error?: string }>;

    // Asset caching system
    downloadAsset: (url: string, category: string, assetKey: string) => Promise<{ success: boolean; localPath?: string; error?: string }>;
    loadAssetManifest: () => Promise<{ success: boolean; data?: Record<string, CachedAsset>; error?: string }>;
    saveAssetManifest: (manifestData: Record<string, CachedAsset>) => Promise<{ success: boolean; error?: string }>;
    loadCategoryManifest: (category: string) => Promise<{ success: boolean; data?: Record<string, CachedAsset>; error?: string }>;
    saveCategoryManifest: (category: string, manifestData: Record<string, CachedAsset>) => Promise<{ success: boolean; error?: string }>;
    scanAndUpdateManifest: () => Promise<{ success: boolean; updatedCount?: number; error?: string }>;
    getFileSize: (filePath: string) => Promise<{ success: boolean; size?: number; error?: string }>;
    removeAsset: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    clearAssetCache: () => Promise<{ success: boolean; error?: string }>;
    getAssetCacheStats: () => Promise<{ success: boolean; stats?: { totalSize: number; fileCount: number; formattedSize: string }; error?: string }>;
    checkAssetIntegrity: () => Promise<{
        success: boolean;
        integrity?: {
            isValid: boolean;
            missingFiles: string[];
            corruptedFiles: string[];
            totalFiles: number;
            validFiles: number;
            message: string;
        };
        error?: string
    }>;

    // LCU Data communication for overlay
    getLCUData: () => Promise<LCUData>;
    updateLCUData: (data: Partial<LCUData>) => Promise<{ success: boolean }>;
    setMockData: (enabled: boolean) => Promise<{ success: boolean }>;
    onLCUDataUpdate: (callback: (data: LCUData) => void) => void;
    onLCUConnectionChange: (callback: (data: Pick<LCUData, 'isConnected' | 'isConnecting' | 'connectionError'>) => void) => void;
    onMockDataToggle: (callback: (enabled: boolean) => void) => void;

    // Storage operations (AppData persistent storage)
    storage?: {
        set: (key: string, value: unknown) => Promise<void>;
        get: (key: string) => Promise<unknown | null>;
        remove: (key: string) => Promise<void>;
        clear: (prefix?: string) => Promise<void>;
    };

    // System info
    getVersions?: () => Promise<{
        node: string;
        electron: string;
        chrome: string;
    }>;

    // Menu event listeners
    onCreateTournament: (callback: () => void) => void;
    onLoadTournament: (callback: (data: TournamentData) => void) => void;
    onSaveTournament: (callback: () => void) => void;
    onImportLogos: (callback: (filePaths: string[]) => void) => void;
    onExportTournament: (callback: (filePath: string) => void) => void;
    onUpdateChampions: (callback: () => void) => void;
    onChampionsCacheCleared: (callback: () => void) => void;
    onOpenOBSControl: (callback: () => void) => void;
    onOpenSettings: (callback: () => void) => void;

    // Cleanup
    removeAllListeners: (channel: string) => void;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
} 