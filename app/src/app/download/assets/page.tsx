"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { downloadAllAssets, BootstrapProgress } from '@lib/services/asset-bootstrapper';

interface LocalProgress {
  text: string;
  percentage: number;
}

const DownloadAssetsPage: React.FC = (): React.JSX.Element => {
  const router = useRouter();
  const [progress, setProgress] = useState<LocalProgress | null>(null);
  const startedRef = useRef(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const run = async (): Promise<void> => {
      // Only useful in Electron
      if (typeof window === 'undefined' || !window.electronAPI?.isElectron) {
        router.replace('/modules');
        return;
      }

      await downloadAllAssets((p: BootstrapProgress) => {
        const pct = p.percentage ?? Math.round((p.current / (p.total || 1)) * 100);
        const text = `${p.stage === 'downloading' ? 'Downloading' : p.stage === 'checking' ? 'Checking' : p.stage === 'complete' ? 'Finishing' : ''}: ${p.currentAsset || p.itemName || p.category} ${pct}%`;
        setProgress({ text, percentage: pct });
        
        if (pct >= 100 && !redirectedRef.current) {
          redirectedRef.current = true;
          router.replace('/modules');
        }
      });
    };
    void run();
  }, [router]);

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center  text-white">
        Preparing downloads…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center  text-white space-y-6 p-6">
      <h1 className="text-3xl font-bold">Downloading Game Assets</h1>
      <p className="text-sm text-gray-300">{progress.text}</p>
      <div className="w-full max-w-md bg-gray-700 rounded-full h-4 overflow-hidden">
        <div
          className="bg-blue-500 h-4 transition-all"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <p>{progress.percentage}%</p>
    </div>
  );
};

export default DownloadAssetsPage; 