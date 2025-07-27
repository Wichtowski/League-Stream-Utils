'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { assetDownloader, DownloadProgress } from '@lib/services/cache/asset-downloader';

interface DownloadState {
  isDownloading: boolean;
  progress: DownloadProgress | null;
}

interface DownloadContextType {
  downloadState: DownloadState;
  startDownload: () => Promise<void>;
  cancelDownload: () => void;
  checkDownloadStatus: () => Promise<void>;
  resetDownloadState: () => void;
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

  const startDownload = async (): Promise<void> => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      console.log('Not in Electron environment, skipping download');
      return;
    }
    if (assetDownloader.isCurrentlyDownloading()) {
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
          errors: [],
          activeConnections: 0,
          queueLength: 0
        }
      });
      assetDownloader.onProgress((progress) => {
        setDownloadState({
          isDownloading: progress.stage !== 'complete' && progress.stage !== 'error',
          progress
        });
      });
      const result = await assetDownloader.downloadAllAssets();
      setDownloadState({
        isDownloading: false,
        progress: {
          stage: result.success ? 'complete' : 'error',
          current: result.stats.downloadedFiles,
          total: result.stats.totalFiles,
          message: result.success
            ? `Successfully downloaded ${result.stats.downloadedFiles} files`
            : `Download completed with ${result.stats.failedFiles} errors`,
          errors: result.errors,
          activeConnections: 0,
          queueLength: 0
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
          errors: [error as string],
          activeConnections: 0,
          queueLength: 0
        }
      });
    }
  };

  const cancelDownload = (): void => {
    assetDownloader.cancelDownload();
    setDownloadState({
      isDownloading: false,
      progress: {
        stage: 'error',
        current: 0,
        total: 0,
        message: 'Download cancelled by user',
        errors: ['Download was cancelled'],
        activeConnections: 0,
        queueLength: 0
      }
    });
  };

  const checkDownloadStatus = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined' || !window.electronAPI) {
      return;
    }
    try {
      const isDownloading = assetDownloader.isCurrentlyDownloading();
      if (isDownloading && !downloadState.isDownloading) {
        setDownloadState({
          isDownloading: true,
          progress: {
            stage: 'checking',
            current: 0,
            total: 0,
            message: 'Checking download status...',
            errors: [],
            activeConnections: 0,
            queueLength: 0
          }
        });
      } else if (!isDownloading && downloadState.isDownloading) {
        setDownloadState({
          isDownloading: false,
          progress: {
            stage: 'complete',
            current: 0,
            total: 0,
            message: 'Download completed',
            errors: [],
            activeConnections: 0,
            queueLength: 0
          }
        });
      }
    } catch (error) {
      console.error('Failed to check download status:', error);
    }
  }, [downloadState.isDownloading]);

  const resetDownloadState = (): void => {
    setDownloadState({
      isDownloading: false,
      progress: {
        stage: 'complete',
        current: 0,
        total: 0,
        message: 'All assets downloaded',
        errors: [],
        activeConnections: 0,
        queueLength: 0
      }
    });
  };

  useEffect(() => {
    // Only start the interval if we're currently downloading or if we need to check status
    if (downloadState.isDownloading) {
      checkDownloadStatus();
      const interval = setInterval(checkDownloadStatus, 5000);
      return () => clearInterval(interval);
    } else {
      // Do a single check when not downloading to catch any state changes
      checkDownloadStatus();
    }
  }, [downloadState.isDownloading, checkDownloadStatus]);

  const value: DownloadContextType = {
    downloadState,
    startDownload,
    cancelDownload,
    checkDownloadStatus,
    resetDownloadState,
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
}; 