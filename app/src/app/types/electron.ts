export interface ElectronAPI {
    // Platform info
    isElectron: boolean;
    platform: string;

    // File operations
    saveTournamentFile: (data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    saveChampionsCache: (data: any) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    loadChampionsCache: () => Promise<{ success: boolean; data?: any; error?: string }>;
    copyAssetFile: (sourcePath: string, fileName: string) => Promise<{ success: boolean; localPath?: string; error?: string }>;
    saveCameraUpload: (fileBuffer: Buffer, fileName: string) => Promise<{ success: boolean; localPath?: string; publicPath?: string; error?: string }>;
    getUserDataPath: () => Promise<string>;
    saveCameraUpload: (fileBuffer: Buffer, fileName: string) => Promise<{ success: boolean; localPath?: string; publicPath?: string; error?: string }>;
    getUserDataPath: () => Promise<string>;

    // Menu event listeners
    onCreateTournament: (callback: () => void) => void;
    onLoadTournament: (callback: (data: any) => void) => void;
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