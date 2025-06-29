'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { startupService } from '../services/startup-service';

interface DownloadState {
  isDownloading: boolean;
  progress: {
    stage: 'checking' | 'downloading' | 'complete' | 'error';
    message: string;
    progress?: number;
    total?: number;
    currentAsset?: string;
    assetType?: 'champion-data' | 'champion-images' | 'ability-images' | 'item-data' | 'item-images' | 'spell-data' | 'spell-images' | 'rune-data' | 'rune-images';
  } | null;
}

interface DownloadContextType {
  downloadState: DownloadState;
  checkDownloadStatus: () => Promise<void>;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const useDownload = (): DownloadContextType => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
};

interface DownloadProviderProps {
  children: React.ReactNode;
}

export const DownloadProvider: React.FC<DownloadProviderProps> = ({ children }) => {
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    progress: null
  });

  const checkDownloadStatus = async (): Promise<void> => {
    // Only check in Electron environment
    if (typeof window === 'undefined' || !window.electronAPI?.isElectron) {
      return;
    }

    try {
      // Check if startup service is currently downloading
      const isDownloading = startupService.isDownloadInProgress();
      
      if (isDownloading && !downloadState.isDownloading) {
        setDownloadState({
          isDownloading: true,
          progress: {
            stage: 'checking',
            message: 'Checking champion cache status...'
          }
        });

        // Start monitoring the download progress
        const result = await startupService.initializeChampionCacheWithProgress((progress) => {
          setDownloadState({
            isDownloading: progress.stage !== 'complete' && progress.stage !== 'error',
            progress: {
              stage: progress.stage,
              message: progress.message,
              progress: progress.progress,
              total: progress.total,
              currentAsset: progress.message,
              assetType: 'champion-data'
            }
          });
        });

        // Ensure we set downloading to false after completion
        setDownloadState({
          isDownloading: false,
          progress: {
            stage: 'complete' as const,
            message: result.message,
            assetType: 'champion-data'
          }
        });
      } else if (!isDownloading && downloadState.isDownloading) {
        setDownloadState({
          isDownloading: false,
          progress: null
        });
      } else if (!isDownloading && !downloadState.isDownloading && !startupService.getInitializedStatus()) {
        // Auto-start download if not initialized and not downloading
        console.log('Auto-starting champion cache initialization...');
        
        setDownloadState({
          isDownloading: true,
          progress: {
            stage: 'checking',
            message: 'Checking champion cache status...',
            assetType: 'champion-data'
          }
        });

        try {
          const result = await startupService.initializeChampionCacheWithProgress((progress) => {
            setDownloadState({
              isDownloading: progress.stage !== 'complete' && progress.stage !== 'error',
              progress: {
                stage: progress.stage,
                message: progress.message,
                progress: progress.progress,
                total: progress.total,
                currentAsset: progress.message,
                assetType: 'champion-data'
              }
            });
          });

          // Ensure we set downloading to false after completion
          setDownloadState({
            isDownloading: false,
            progress: {
              stage: 'complete' as const,
              message: result.message,
              assetType: 'champion-data'
            }
          });
        } catch (initError) {
          console.error('Failed to auto-initialize champion cache:', initError);
          setDownloadState({
            isDownloading: false,
            progress: {
              stage: 'error',
              message: `Failed to initialize champion cache: ${initError}`,
              assetType: 'champion-data'
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to check download status:', error);
      setDownloadState({
        isDownloading: false,
        progress: {
          stage: 'error',
          message: `Failed to check download status: ${error}`,
          assetType: 'champion-data'
        }
      });
    }
  };

  useEffect(() => {
    // Check download status on mount
    checkDownloadStatus();

    // Set up periodic checks for download status (more frequent to catch quick downloads)
    const interval = setInterval(checkDownloadStatus, 500);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: DownloadContextType = {
    downloadState,
    checkDownloadStatus
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
}; 