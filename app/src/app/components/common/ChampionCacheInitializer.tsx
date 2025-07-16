"use client";

import React, { useState, useEffect } from 'react';
import { startupService } from '@lib/services/startup-service';

interface StartupProgress {
  stage: 'checking' | 'downloading' | 'complete' | 'error';
  message: string;
  progress?: number;
  total?: number;
}

export const ChampionCacheInitializer = () => {
  const [showInitializer, setShowInitializer] = useState(false);
  const [progress, setProgress] = useState<StartupProgress | null>(null);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if we're in Electron environment
    const electron = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
    setIsElectron(electron);

    if (electron) {
      // Check if cache initialization is needed
      checkAndInitializeCache();
    }
  }, []);

  const checkAndInitializeCache = async () => {
    try {
      // Check if cache is complete first
      const completeness = await startupService.initializeChampionCache();
      
      if (completeness.success && completeness.message.includes('already complete')) {
        // Cache is complete, no need to show initializer
        return;
      }

      // Cache needs initialization, show the initializer
      setShowInitializer(true);
      
      // Start the download with progress
      await startupService.initializeChampionCacheWithProgress((progressUpdate) => {
        setProgress(progressUpdate);
      });

      // Hide the initializer after completion
      setTimeout(() => {
        setShowInitializer(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to initialize champion cache:', error);
      setProgress({
        stage: 'error',
        message: `Failed to initialize champion cache: ${error}`
      });
    }
  };

  const handleSkip = () => {
    setShowInitializer(false);
  };

  const handleRetry = () => {
    setProgress(null);
    checkAndInitializeCache();
  };

  if (!isElectron || !showInitializer) {
    return null;
  }

  const getProgressPercentage = () => {
    if (!progress?.progress || !progress?.total) return 0;
    return Math.round((progress.progress / progress.total) * 100);
  };

  const getStageIcon = () => {
    switch (progress?.stage) {
      case 'checking':
        return (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        );
      case 'downloading':
        return (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
        );
      case 'complete':
        return (
          <div className="text-green-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="text-red-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Champion Cache Initialization</h3>
          {progress?.stage === 'complete' && (
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3 mb-4">
          {getStageIcon()}
          <div className="flex-1">
            <p className="text-white text-sm">{progress?.message || 'Initializing...'}</p>
            {progress?.stage === 'downloading' && progress?.progress && progress?.total && (
              <p className="text-gray-400 text-xs mt-1">
                {progress.progress} of {progress.total} champions
              </p>
            )}
          </div>
        </div>

        {progress?.stage === 'downloading' && progress?.progress && progress?.total && (
          <div className="mb-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <p className="text-center text-gray-400 text-xs mt-1">
              {getProgressPercentage()}% Complete
            </p>
          </div>
        )}

        {progress?.stage === 'error' && (
          <div className="mb-4">
            <button
              onClick={handleRetry}
              className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Retry Download
            </button>
          </div>
        )}

        {progress?.stage === 'complete' && (
          <div className="text-center">
            <p className="text-green-400 text-sm mb-2">Champion cache initialized successfully!</p>
            <p className="text-gray-400 text-xs">
              All champion data is now available offline.
            </p>
          </div>
        )}

        {!progress && (
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Preparing to download champion data...
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 