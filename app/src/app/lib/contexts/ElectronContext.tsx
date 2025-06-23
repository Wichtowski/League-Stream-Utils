'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

interface ElectronContextType {
    isElectron: boolean;
    isElectronLoading: boolean;
    useLocalData: boolean;
    setUseLocalData: (value: boolean) => void;
    electronAPI: typeof window.electronAPI | undefined;
}

const ElectronContext = createContext<ElectronContextType | undefined>(undefined);

export function ElectronProvider({ children }: { children: ReactNode }) {
    const [isElectron, setIsElectron] = useState(false);
    const [isElectronLoading, setIsElectronLoading] = useState(true);
    const [useLocalData, setUseLocalData] = useState(false);
    const [electronAPI, setElectronAPI] = useState<typeof window.electronAPI | undefined>(undefined);

    useEffect(() => {
        // Check if running in Electron environment
        const checkElectron = () => {
            if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
                setIsElectron(true);
                setElectronAPI(window.electronAPI);
                
                // Load saved preference for local data mode
                const savedLocalDataMode = localStorage.getItem('electron-use-local-data');
                if (savedLocalDataMode !== null) {
                    setUseLocalData(savedLocalDataMode === 'true');
                } else {
                    // First time user - default to local mode for better UX
                    setUseLocalData(true);
                    localStorage.setItem('electron-use-local-data', 'true');
                }
            }
            setIsElectronLoading(false);
        };

        checkElectron();
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

    return (
        <ElectronContext.Provider value={value}>
            {children}
        </ElectronContext.Provider>
    );
}

export function useElectron() {
    const context = useContext(ElectronContext);
    if (context === undefined) {
        throw new Error('useElectron must be used within an ElectronProvider');
    }
    return context;
} 