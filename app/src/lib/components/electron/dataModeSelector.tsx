'use client';

import { useElectron } from '@lib/contexts/ElectronContext';
import { assetDownloaderManager } from '@lib/services/cache/asset-downloader-manager';

export const ElectronDataModeSelector = () => {
    const { isElectron, useLocalData, setUseLocalData } = useElectron();

    if (!isElectron) {
        return null;
    }

    const handleModeChange = async (localMode: boolean) => {
        // If switching modes, pause background processes first
        if (localMode !== useLocalData) {
            try {
                // Enable mode switching state to prevent cache clearing
                if (window.electronAPI?.setModeSwitching) {
                    await window.electronAPI.setModeSwitching(true);
                }
                
                // Pause all background processes to prevent file access conflicts
                await assetDownloaderManager.pauseAllProcesses();
                
                // Clear auth data without redirecting
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } catch (error) {
                console.warn('Failed to pause background processes:', error);
            }
        }
        
        setUseLocalData(localMode);
        
        // Force a reload to ensure the auth context picks up the new mode
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    return (
        <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4">Data Storage Mode</h3>
            <p className="text-gray-400 mb-6">
                Choose how you want to store your tournament data in the desktop application.
            </p>

            <div className="space-y-4">
                <div 
                    className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${useLocalData 
                            ? 'border-green-500 bg-green-500/10' 
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }
                    `}
                    onClick={() => handleModeChange(true)}
                >
                    <div className="flex items-start space-x-3">
                        <div className={`
                            w-5 h-5 rounded-full border-2 mt-0.5 
                            ${useLocalData 
                                ? 'border-green-500 bg-green-500' 
                                : 'border-gray-400'
                            }
                        `}>
                            {useLocalData && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold text-white">Local Data Mode</h4>
                            <p className="text-gray-400 text-sm mt-1">
                                Store all data locally on your computer (%appdata%). No internet connection required.
                                You&apos;ll be automatically logged in as admin with full access to all features.
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs">
                                <span className="text-green-400">✓ No registration needed</span>
                                <span className="text-green-400">✓ Works offline</span>
                                <span className="text-green-400">✓ Fast performance</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div 
                    className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${!useLocalData 
                            ? 'border-blue-500 bg-blue-500/10' 
                            : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                        }
                    `}
                    onClick={() => handleModeChange(false)}
                >
                    <div className="flex items-start space-x-3">
                        <div className={`
                            w-5 h-5 rounded-full border-2 mt-0.5 
                            ${!useLocalData 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-400'
                            }
                        `}>
                            {!useLocalData && (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold text-white">Online Mode</h4>
                            <p className="text-gray-400 text-sm mt-1">
                                Use the web-based system with Cloud storage. Requires user registration and internet connection.
                                Data is stored in the cloud and accessible from anywhere.
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs">
                                <span className="text-blue-400">✓ Cloud storage</span>
                                <span className="text-blue-400">✓ Multi-device access</span>
                                <span className="text-yellow-400">⚠ Requires registration</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {useLocalData && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm">
                        <strong>Local Mode Active:</strong> All data will be saved to your computer&apos;s AppData folder. 
                        You&apos;re automatically logged in as a local administrator.
                    </p>
                </div>
            )}
        </div>
    );
};
