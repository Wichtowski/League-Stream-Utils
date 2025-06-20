'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useUser } from '@lib/contexts/AuthContext';
import { CameraPlayer } from '@lib/types';

// Import proper types from database schemas
type TeamCamera = {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  players: CameraPlayer[];
};

export default function CamerasPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const user = useUser();
  const [teams, setTeams] = useState<TeamCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);

  useEffect(() => {
    setActiveModule('cameras');

    // Check authentication first
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/auth');
      return;
    }

    setAuthChecked(true);
    loadTeams();
  }, [router, setActiveModule]);

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/v1/cameras/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.teams && data.teams.length > 0) {
          setTeams(data.teams);
        } else {
          await autoSetupFromTeams();
        }
      } else {
        await autoSetupFromTeams();
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      await autoSetupFromTeams();
    } finally {
      setLoading(false);
    }
  };

  const autoSetupFromTeams = async () => {
    try {
      const teamsResponse = await fetch('/api/v1/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        const existingTeams = teamsData.teams || [];

        if (existingTeams.length > 0) {
          // Convert teams to camera settings format
          const cameraTeams = existingTeams.map((team: any) => ({
            teamId: team.id,
            teamName: team.name,
            teamLogo: team.logo?.data || '',
            players: team.players.main.map((player: any) => ({
              playerId: player.id,
              playerName: player.inGameName,
              role: player.role,
              url: '',
              imagePath: ''
            }))
          }));

          // Save camera settings
          const saveResponse = await fetch('/api/v1/cameras/settings', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ teams: cameraTeams })
          });

          if (saveResponse.ok) {
            setTeams(cameraTeams);
          }
        }
      }
    } catch (error) {
      console.error('Error auto-setting up camera teams:', error);
    }
  };

  if (!authChecked || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  const totalPlayers = teams.reduce((sum, team) => sum + team.players.length, 0);

  return (
    <div className="min-h-screen bg-gray-900 p-6">
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
                  className={`px-3 py-1 rounded text-sm transition-colors ${showAdminView
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Team Streams */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-3">📺 Team Streams</h2>
            <p className="text-gray-400 mb-4">
              Team-based camera switching with keyboard controls
            </p>
            <div className="space-y-3">
              {teams.map((team) => (
                <button
                  key={team.teamId}
                  onClick={() => router.push(`/modules/cameras/stream/${team.teamId}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  {team.teamName} ({team.players.length} players)
                </button>
              ))}
              {teams.length === 0 && (
                <p className="text-gray-500 text-sm">No teams configured</p>
              )}
            </div>
          </div>

          {/* Multi View */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-3">📱 Multi View</h2>
            <p className="text-gray-400 mb-4">
              Grid layout showing all cameras simultaneously
            </p>
            <button
              onClick={() => router.push('/modules/cameras/all')}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
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