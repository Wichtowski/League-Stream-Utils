"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { downloadAllAssets, BootstrapProgress } from '@lib/services/asset-bootstrapper';
import { useElectron } from '@lib/contexts/ElectronContext';

interface CategoryProgress {
  category: string;
  stage: string;
  current: number;
  total: number;
  percentage: number;
  currentAsset: string;
  isActive: boolean;
}

interface OverallProgress {
  current: number;
  total: number;
  percentage: number;
}

const categories = ['champion', 'item', 'game-ui', 'spell', 'rune'];

export default function DownloadAssetsPage() {
  const router = useRouter();
  const [categoryProgress, setCategoryProgress] = useState<Map<string, CategoryProgress>>(new Map());
  const [overallProgress, setOverallProgress] = useState<OverallProgress>({ current: 0, total: 0, percentage: 0 });
  const startedRef = useRef(false);
  const { isElectron, isElectronLoading } = useElectron();
  
  useEffect(() => {
    const initialProgress = new Map();
    categories.forEach(category => {
      initialProgress.set(category, {
        category,
        stage: 'waiting',
        current: 0,
        total: 0,
        percentage: 0,
        currentAsset: 'Waiting...',
        isActive: false
      });
    });
    setCategoryProgress(initialProgress);
  }, []);

  useEffect(() => {
    // Wait until Electron detection is finished
    if (isElectronLoading) return;

    if (startedRef.current) return;
    startedRef.current = true;

    const run = async (): Promise<void> => {
      // Only useful in Electron
      if (!isElectron) {
        router.replace('/modules');
        return;
      }

      await downloadAllAssets((p: BootstrapProgress) => {
        const pct = p.percentage ?? Math.round((p.current / (p.total || 1)) * 100);
        
        // Update category progress
        setCategoryProgress(prev => {
          const newMap = new Map(prev);
          const category = p.category || 'unknown';
          const currentAsset = p.currentAsset || p.itemName || category;
          
          newMap.set(category, {
            category,
            stage: p.stage,
            current: p.current,
            total: p.total,
            percentage: pct,
            currentAsset,
            isActive: p.stage !== 'complete' && p.stage !== 'error'
          });
          
          // Calculate overall progress from all categories
          let totalCurrent = 0;
          let totalTotal = 0;
          
          newMap.forEach(catProgress => {
            if (catProgress.stage === 'complete') {
              totalCurrent += catProgress.total;
              totalTotal += catProgress.total;
            } else if (catProgress.stage === 'downloading' || catProgress.stage === 'checking') {
              totalCurrent += catProgress.current;
              totalTotal += catProgress.total;
            }
          });
          
          const overallPct = totalTotal > 0 ? Math.round((totalCurrent / totalTotal) * 100) : 0;
          
          // Update overall progress
          setOverallProgress({
            current: totalCurrent,
            total: totalTotal,
            percentage: overallPct
          });
          
          // Check if all downloads are complete by checking all categories
          const allCategoriesComplete = categories.every(cat => {
            const catProgress = newMap.get(cat);
            return catProgress && catProgress.stage === 'complete';
          });

          // Additional strict completion check - ensure all categories have non-zero totals and are truly complete
          const hasAllValidTotals = categories.every(cat => {
            const catProgress = newMap.get(cat);
            return catProgress && catProgress.total > 0;
          });

          // Only redirect when ALL conditions are met AND we have substantial progress
          const shouldRedirect = allCategoriesComplete && hasAllValidTotals && (overallPct >= 100 && totalTotal > 100);

          if (shouldRedirect) {
            console.log('Downloads complete, redirecting to modules...', {
              allCategoriesComplete,
              hasAllValidTotals,
              overallPct,
              totalCurrent,
              totalTotal,
              categories: Array.from(newMap.entries())
            });
            setTimeout(() => {
              router.replace('/modules');
            }, 2000);
          }
          
          return newMap;
        });
      });
    };

    void run();
  }, [isElectronLoading, isElectron, router, categoryProgress, overallProgress]);

  // Additional failsafe: periodically check for completion
  useEffect(() => {
    // More strict failsafe - only redirect if we have substantial progress AND it's been complete for a while
    if (overallProgress.percentage >= 100 && overallProgress.total > 100) {
      const timeoutId = setTimeout(() => {
        console.log('Failsafe redirect triggered after 10 seconds of 100% completion with substantial downloads', {
          percentage: overallProgress.percentage,
          total: overallProgress.total,
          current: overallProgress.current
        });
        router.replace('/modules');
      }, 10000); // Increased timeout to 10 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [overallProgress.percentage, overallProgress.total, router]);

  const getStageColor = (stage: string): string => {
    switch (stage) {
      case 'complete': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'downloading': return 'text-blue-400';
      case 'checking': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getProgressColor = (stage: string): string => {
    switch (stage) {
      case 'complete': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'downloading': return 'bg-blue-500';
      case 'checking': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryDisplayName = (category: string): string => {
    switch (category) {
      case 'game-ui': return 'Game UI Assets';
      case 'champion': return 'Champions';
      case 'item': return 'Items';
      case 'spell': return 'Spells';
      case 'rune': return 'Runes';
      default: return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white space-y-8 p-6">
      <h1 className="text-3xl font-bold">Downloading Game Assets</h1>
      
      {/* Overall Progress */}
      <div className="w-full max-w-2xl space-y-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Overall Progress</h2>
            <span className="text-lg font-mono">{overallProgress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-500 h-3 transition-all duration-300"
              style={{ width: `${overallProgress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>{overallProgress.current} / {overallProgress.total}</span>
            <span>
              {overallProgress.percentage >= 100 && overallProgress.total > 0 
                ? 'Complete!' 
                : overallProgress.percentage === 0 
                  ? 'Initializing...' 
                  : 'Downloading...'
              }
            </span>
          </div>
        </div>

        {/* Individual Category Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(category => {
            const progress = categoryProgress.get(category);
            if (!progress) return null;

            return (
              <div key={category} className="bg-gray-800 rounded-lg p-4 min-h-[120px]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">{getCategoryDisplayName(category)}</h3>
                  <span className={`text-sm ${getStageColor(progress.stage)}`}>
                    {progress.stage}
                  </span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`h-2 transition-all duration-300 ${getProgressColor(progress.stage)}`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                
                <div className="text-xs text-gray-400 mb-2">
                  {progress.current} / {progress.total}
                </div>
                
                <div className="text-xs text-gray-300 truncate" title={progress.currentAsset}>
                  {progress.currentAsset}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 