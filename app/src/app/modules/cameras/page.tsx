'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { useCameras } from '@lib/contexts/CamerasContext';
import { useTeams } from '@lib/contexts/TeamsContext';
import { CameraPlayer } from '@lib/types';
import { LoadingSpinner } from '@components/common';

// Import proper types from database schemas
type TeamCamera = {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  players: CameraPlayer[];
};

// Dynamic imports for camera components
const CameraSetupPage = dynamic(
  () => import('./setup/page'),
  { 
    loading: () => <LoadingSpinner text="Loading camera setup..." />,
    ssr: false 
  }
);

const CameraAllPage = dynamic(
  () => import('./all/page'),
  { 
    loading: () => <LoadingSpinner text="Loading camera grid..." />,
    ssr: false 
  }
);

export default function CamerasPage() {
  const { setActiveModule } = useNavigation();
  const { user, isLoading: authLoading } = useAuth();
  const { teams: cameraTeams, loading: camerasLoading, updateCameraSettings } = useCameras();
  const { teams: userTeams } = useTeams();
  const [teams, setTeams] = useState<TeamCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdminView, setShowAdminView] = useState(false);
  const [activeView, setActiveView] = useState<'main' | 'setup' | 'all'>('main');

  const autoSetupFromTeams = useCallback(async () => {
    try {
      if (userTeams.length > 0) {
        const result = await updateCameraSettings({ teams: cameraTeams });
        if (result.success) {
          setTeams(cameraTeams as unknown as TeamCamera[]);
        }
      }
    } catch (error) {
      console.error('Error auto-setting up camera teams:', error);
    }
  }, [userTeams, updateCameraSettings, cameraTeams]);

  const loadTeams = useCallback(async () => {
    try {
      if (cameraTeams.length > 0) {
        setTeams(cameraTeams as unknown as TeamCamera[]);
      } else {
        await autoSetupFromTeams();
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      await autoSetupFromTeams();
    } finally {
      setLoading(false);
    }
  }, [cameraTeams, autoSetupFromTeams]);

  useEffect(() => {
    setActiveModule('cameras');

    if (!authLoading && !camerasLoading) {
      loadTeams();
    }
  }, [setActiveModule, loadTeams, authLoading, camerasLoading]);

  if (authLoading || loading) {
    return (
      <LoadingSpinner fullscreen text="Loading cameras..." className="" />
    );
  }

  const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);

  // Render dynamic components based on active view
  if (activeView === 'setup') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setActiveView('main')}
              className="mr-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-white">Camera Setup</h1>
          </div>
          <Suspense fallback={<LoadingSpinner text="Loading camera setup..." />}>
            <CameraSetupPage />
          </Suspense>
        </div>
      </div>
    );
  }

  if (activeView === 'all') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setActiveView('main')}
              className="mr-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-white">All Cameras</h1>
          </div>
          <Suspense fallback={<LoadingSpinner text="Loading camera grid..." />}>
            <CameraAllPage />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Camera Control</h1>
              <p className="text-gray-400">
                {totalPlayers} cameras across {teams.length} teams
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {user?.isAdmin && (
                <button
                  onClick={() => setShowAdminView(!showAdminView)}
                  className={`cursor-pointer px-3 py-1 rounded text-sm transition-colors ${showAdminView
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                >
                  {showAdminView ? '👤 User View' : '🔧 Admin View'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className={`grid grid-cols-1 gap-6 mb-8 md:grid-cols-2`}>         
          {/* Team Stream Configuration */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-3">📺 Team Streams</h2>
            <p className="text-gray-400 mb-4">
              Team-based camera switching with keyboard controls
            </p>
            <button
              onClick={() => setActiveView('setup')}
              className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              Team Stream Configuration
            </button>
          </div>

          {/* Multi View */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-3">📱 Multi View</h2>
            <p className="text-gray-400 mb-4">
              Grid layout showing all cameras simultaneously
            </p>
            <button
              onClick={() => setActiveView('all')}
              className="cursor-pointer w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              All Cameras Grid
            </button>
          </div>
        </div>

        {/* Team Overview */}
        {teams.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Teams Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team.teamId} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white">{team.teamName}</h3>
                    <span className="text-sm text-gray-400">
                      {team.players.length} players
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">
                    {team.players.map(p => p.playerName).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls Help */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-2">Keyboard Controls</h3>
          <div className="text-sm text-gray-300 space-y-1 flex flex-row gap-2">
            <p><kbd className="bg-gray-600 px-2 py-1 rounded">Space</kbd> - Random player</p>
            <p><kbd className="bg-gray-600 px-2 py-1 rounded">R</kbd> - Toggle auto-random mode</p>
            <p><kbd className="bg-gray-600 px-2 py-1 rounded">1-9</kbd> - Select specific player</p>
          </div>
        </div>
      </div>
    </div>
  );
} 