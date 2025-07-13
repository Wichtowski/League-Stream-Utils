'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DownloadProgress } from '../services/high-performance-asset-downloader';
import { ultraFastAssetDownloader } from '../services/ultra-fast-asset-downloader';

interface HighPerformanceDownloadState {
  isDownloading: boolean;
  progress: DownloadProgress | null;
}

interface HighPerformanceDownloadContextType {
  downloadState: HighPerformanceDownloadState;
  startDownload: () => Promise<void>;
  cancelDownload: () => void;
  checkDownloadStatus: () => Promise<void>;
}

const HighPerformanceDownloadContext = createContext<HighPerformanceDownloadContextType | undefined>(undefined);

export const useHighPerformanceDownload = (): HighPerformanceDownloadContextType => {
  const context = useContext(HighPerformanceDownloadContext);
  if (!context) {
    throw new Error('useHighPerformanceDownload must be used within a HighPerformanceDownloadProvider');
  }
  return context;
};

interface HighPerformanceDownloadProviderProps {
  children: React.ReactNode;
}

export const HighPerformanceDownloadProvider: React.FC<HighPerformanceDownloadProviderProps> = ({ children }) => {
  const [downloadState, setDownloadState] = useState<HighPerformanceDownloadState>({
    isDownloading: false,
    progress: null
  });

  const startDownload = async (): Promise<void> => {
    // Only run in Electron environment
    if (typeof window === 'undefined' || !window.electronAPI) {
      console.log('Not in Electron environment, skipping download');
      return;
    }

          if (ultraFastAssetDownloader.isCurrentlyDownloading()) {
        console.log('Download already in progress');
        return;
      }

    try {
      setDownloadState({
        isDownloading: true,
        progress: {
          stage: 'checking',
          current: 0,
          total: 0,
          message: 'Analyzing required assets...',
          errors: []
        }
      });

      // Set up progress tracking
      ultraFastAssetDownloader.onProgress((progress) => {
        setDownloadState({
          isDownloading: progress.stage !== 'complete' && progress.stage !== 'error',
          progress
        });
      });

      // Start the ultra-fast download
      const result = await ultraFastAssetDownloader.downloadAllAssets();

      // Final state update
      setDownloadState({
        isDownloading: false,
        progress: {
          stage: result.success ? 'complete' : 'error',
          current: result.stats.downloadedFiles,
          total: result.stats.totalFiles,
          message: result.success 
            ? `Successfully downloaded ${result.stats.downloadedFiles} files`
            : `Download completed with ${result.stats.failedFiles} errors`,
          errors: result.errors
        }
      });

    } catch (error) {
      console.error('Failed to start download:', error);
      setDownloadState({
        isDownloading: false,
        progress: {
          stage: 'error',
          current: 0,
          total: 0,
          message: `Failed to start download: ${error}`,
          errors: [error as string]
        }
      });
    }
  };

  const cancelDownload = (): void => {
    ultraFastAssetDownloader.cancelDownload();
    setDownloadState({
      isDownloading: false,
      progress: {
        stage: 'error',
        current: 0,
        total: 0,
        message: 'Download cancelled by user',
        errors: ['Download was cancelled']
      }
    });
  };

  const checkDownloadStatus = async (): Promise<void> => {
    // Only check in Electron environment
    if (typeof window === 'undefined' || !window.electronAPI) {
      return;
    }

    try {
      const isDownloading = ultraFastAssetDownloader.isCurrentlyDownloading();
      
      if (isDownloading && !downloadState.isDownloading) {
        // Download is running but we don't have progress yet
        setDownloadState({
          isDownloading: true,
          progress: {
            stage: 'checking',
            current: 0,
            total: 0,
            message: 'Checking download status...',
            errors: []
          }
        });
      } else if (!isDownloading && downloadState.isDownloading) {
        // Download finished but we don't have final state
        setDownloadState({
          isDownloading: false,
          progress: {
            stage: 'complete',
            current: 0,
            total: 0,
            message: 'Download completed',
            errors: []
          }
        });
      }
    } catch (error) {
      console.error('Failed to check download status:', error);
    }
  };

  useEffect(() => {
    // Check download status on mount
    checkDownloadStatus();

    // Set up periodic checks for download status
    const interval = setInterval(checkDownloadStatus, 1000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: HighPerformanceDownloadContextType = {
    downloadState,
    startDownload,
    cancelDownload,
    checkDownloadStatus
  };

  return (
    <HighPerformanceDownloadContext.Provider value={value}>
      {children}
    </HighPerformanceDownloadContext.Provider>
  );
}; 