'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { assetDownloaderManager } from '@lib/services/cache/asset-downloader-manager';

interface ElectronContextType {
    isElectron: boolean;
    isElectronLoading: boolean;
    useLocalData: boolean;
    setUseLocalData: (value: boolean) => void;
    electronAPI: typeof window.electronAPI | undefined;
}

const ElectronContext = createContext<ElectronContextType | undefined>(undefined);

// Cache for Electron detection to prevent repeated checks
const ELECTRON_CACHE_KEY = 'electron-detection-cache';
const ELECTRON_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface ElectronCache {
    isElectron: boolean;
    timestamp: number;
}

const getElectronCache = (): ElectronCache | null => {
    if (typeof window === 'undefined') return null;
    try {
        const cached = localStorage.getItem(ELECTRON_CACHE_KEY);
        if (!cached) return null;

        const parsed: ElectronCache = JSON.parse(cached);
        const now = Date.now();

        if (now - parsed.timestamp > ELECTRON_CACHE_DURATION) {
            localStorage.removeItem(ELECTRON_CACHE_KEY);
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
};

const setElectronCache = (isElectron: boolean): void => {
    if (typeof window === 'undefined') return;
    try {
        const cache: ElectronCache = {
            isElectron,
            timestamp: Date.now()
        };
        localStorage.setItem(ELECTRON_CACHE_KEY, JSON.stringify(cache));
    } catch {
        // Ignore cache errors
    }
};

export function ElectronProvider({ children }: { children: ReactNode }) {
    const [isElectron, setIsElectron] = useState(false);
    const [isElectronLoading, setIsElectronLoading] = useState(true);
    const [useLocalData, setUseLocalData] = useState(false);
    const [electronAPI, setElectronAPI] = useState<typeof window.electronAPI | undefined>(undefined);

    useEffect(() => {
        // Check cache first for faster initial load
        const cached = getElectronCache();
        if (cached) {
            setIsElectron(cached.isElectron);
            if (cached.isElectron) {
                setElectronAPI(window.electronAPI);

                // Resume background processes after startup
                assetDownloaderManager.resumeAllProcesses().catch((error) => {
                    console.warn('Failed to resume background processes:', error);
                });

                // Disable mode switching state after startup
                if (window.electronAPI?.setModeSwitching) {
                    window.electronAPI.setModeSwitching(false).catch((error) => {
                        console.warn('Failed to disable mode switching state:', error);
                    });
                }

                // Load saved preference for local data mode
                const savedLocalDataMode = localStorage.getItem('electron-use-local-data');
                if (savedLocalDataMode !== null) {
                    setUseLocalData(savedLocalDataMode === 'true');
                } else {
                    setUseLocalData(true);
                    localStorage.setItem('electron-use-local-data', 'true');
                }
            }
            setIsElectronLoading(false);
            return;
        }

        // Check if running in Electron environment
        const checkElectron = () => {
            console.log('Checking Electron environment...');

            if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
                console.log('Electron detected! Setting up Electron context...');
                setIsElectron(true);
                setElectronAPI(window.electronAPI);
                setElectronCache(true);

                // Resume background processes after startup
                assetDownloaderManager.resumeAllProcesses().catch((error) => {
                    console.warn('Failed to resume background processes:', error);
                });

                // Disable mode switching state after startup
                if (window.electronAPI?.setModeSwitching) {
                    window.electronAPI.setModeSwitching(false).catch((error) => {
                        console.warn('Failed to disable mode switching state:', error);
                    });
                }

                // Load saved preference for local data mode
                const savedLocalDataMode = localStorage.getItem('electron-use-local-data');
                console.log('Saved local data mode:', savedLocalDataMode);

                if (savedLocalDataMode !== null) {
                    setUseLocalData(savedLocalDataMode === 'true');
                } else {
                    // First time user - default to local mode for better UX
                    console.log('First time user, defaulting to local data mode');
                    setUseLocalData(true);
                    localStorage.setItem('electron-use-local-data', 'true');
                }
            } else {
                console.log('Not running in Electron environment');
                setElectronCache(false);
            }
            setIsElectronLoading(false);
        };

        // Use requestIdleCallback for better performance if available
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            (window as unknown as Window).requestIdleCallback(checkElectron, {
                timeout: 100
            });
        } else {
            // Fallback to setTimeout for immediate execution
            setTimeout(checkElectron, 0);
        }
    }, []);

    const handleSetUseLocalData = (value: boolean) => {
        setUseLocalData(value);
        if (isElectron) {
            localStorage.setItem('electron-use-local-data', value.toString());
        }
    };

    const value = {
        isElectron,
        isElectronLoading,
        useLocalData,
        setUseLocalData: handleSetUseLocalData,
        electronAPI
    };

    return <ElectronContext.Provider value={value}>{children}</ElectronContext.Provider>;
}

export function useElectron() {
    const context = useContext(ElectronContext);
    if (context === undefined) {
        throw new Error('useElectron must be used within an ElectronProvider');
    }
    return context;
}
