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