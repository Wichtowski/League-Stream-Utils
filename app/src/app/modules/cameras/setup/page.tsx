'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { useElectron } from '@lib/contexts/ElectronContext';
import { useCameras } from '@lib/contexts/CamerasContext';
import { useTeams } from '@lib/contexts/TeamsContext';
import Image from 'next/image';
import type { CameraTeam } from '@lib/types';

// Temporary patch if type is out of sync:
type CameraPlayerWithDelay = CameraTeam['players'][number] & { delayedUrl?: string };

export default function CameraSetupListPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { user, isLoading: authLoading } = useAuth();
  const { isElectron, useLocalData } = useElectron();
  const { teams: cameraTeams, loading: camerasLoading, updateCameraSettings } = useCameras();
  const { teams: userTeams } = useTeams();

  const [teams, setTeams] = useState<CameraTeam[]>([]);
  const [loading, setLoading] = useState(true);

  const autoSetupFromTeams = useCallback(async () => {
    try {
      if (userTeams.length > 0) {
        const result = await updateCameraSettings({ teams: cameraTeams });
        if (result.success) {
          setTeams(cameraTeams as unknown as CameraTeam[]);
        }
      }
    } catch (error) {
      console.error('Error auto-setting up camera teams:', error);
    }
  }, [userTeams, cameraTeams, updateCameraSettings]);

  useEffect(() => {
    setActiveModule('cameras');

    if (!authLoading && !camerasLoading) {
      if (cameraTeams.length > 0) {
        setTeams(cameraTeams as unknown as CameraTeam[]);
        setLoading(false);
      } else {
        // Only redirect to auth if not authenticated and not using Electron local data
        if (!user && !(isElectron && useLocalData)) {
          router.push('/auth');
          setLoading(false);
          return;
        }
        const loadCameraSettings = async () => {
          try {
            setLoading(true);
            if (cameraTeams.length > 0) {
              setTeams(cameraTeams as unknown as CameraTeam[]);
            } else {
              await autoSetupFromTeams();
            }
          } catch (error) {
            console.error('Error loading camera settings:', error);
            await autoSetupFromTeams();
          } finally {
            setLoading(false);
          }
        };
        loadCameraSettings();
      }
    }
  }, [router, setActiveModule, user, authLoading, isElectron, useLocalData, cameraTeams, camerasLoading, autoSetupFromTeams]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Camera Stream Setup</h1>
            <p className="text-gray-400">Select a team to configure stream URLs</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/modules/cameras')}
              className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Hub
            </button>
          </div>
        </div>

        {/* Teams List */}
        {teams.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl text-gray-400 mb-4">No teams found</h3>
            <p className="text-gray-500 mb-6">Create teams first to configure camera streams</p>
            <button
              onClick={() => router.push('/modules/teams')}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Manage Teams
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team, idx) => (
              <div
                key={team.teamId || idx}
                onClick={() => router.push(`/modules/cameras/setup/${team.teamId}`)}
                className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500 rounded-lg p-6 cursor-pointer transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center gap-4 mb-4">
                  {team.teamLogo ? (
                    <Image 
                      src={team.teamLogo} 
                      alt={team.teamName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center text-gray-400">
                      👥
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{team.teamName}</h2>
                    <p className="text-gray-400">{team.players.length} players</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Streams configured:</span>
                    <span className="text-blue-400">
                      {((team.players as CameraPlayerWithDelay[]).filter(
                        p => (p.url && p.url.trim() !== '') || (p.delayedUrl && p.delayedUrl.trim() !== '')
                      ).length)} / {team.players.length} 
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${((team.players as CameraPlayerWithDelay[]).filter(
                          p => (p.url && p.url.trim() !== '') || (p.delayedUrl && p.delayedUrl.trim() !== '')
                        ).length / team.players.length) * 100}%` 
                      }}
                    ></div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      Players: {team.players.map(p => p.playerName).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Click to configure</span>
                    <div className="text-blue-400">
                      →
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">How to Configure Streams</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Step 1: Select Team</h4>
              <p className="text-gray-400">Click on a team card above to configure stream URLs for that team&apos;s players.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Step 2: Add URLs</h4>
              <p className="text-gray-400">Enter stream URLs for each player (Twitch, YouTube, OBS, etc.).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 