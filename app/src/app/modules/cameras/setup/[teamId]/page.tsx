'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from "next/navigation";
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useModal } from '@lib/contexts/ModalContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { useElectron } from '@lib/contexts/ElectronContext';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import type { CameraTeam } from '@lib/types';
import Image from 'next/image';

export default function TeamCameraSetupPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const { user, isLoading: authLoading } = useAuth();
  const { isElectron, useLocalData } = useElectron();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [team, setTeam] = useState<CameraTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setActiveModule('cameras');

    if (!authLoading) {
      // Only redirect to auth if not authenticated and not using Electron local data
      if (!user && !(isElectron && useLocalData)) {
        router.push('/auth');
        return;
      }

      const loadTeamSettings = async () => {
        try {
          setLoading(true);
          const response = await authenticatedFetch('/api/v1/cameras/settings');

          if (response.ok) {
            const data = await response.json();
            const teams = data.teams || [];
            const foundTeam = teams.find((t: CameraTeam) => t.teamId === teamId);
            
            if (foundTeam) {
              setTeam(foundTeam);
            } else {
              // Team not found, redirect back
              router.push('/modules/cameras/setup');
            }
          } else {
            router.push('/modules/cameras/setup');
          }
        } catch (error) {
          console.error('Error loading team settings:', error);
          router.push('/modules/cameras/setup');
        } finally {
          setLoading(false);
        }
      };

      loadTeamSettings();
    }
  }, [router, setActiveModule, teamId, user, authLoading, isElectron, useLocalData, authenticatedFetch]);



  const updatePlayerUrl = (playerId: string, url: string) => {
    if (!team) return;
    
    setTeam({
      ...team,
      players: team.players.map(player =>
        player.playerId === playerId
          ? { ...player, url, imagePath: url }
          : player
      )
    });
  };

  const updateTeamStreamUrl = (url: string) => {
    if (!team) return;
    setTeam({ ...team, teamStreamUrl: url });
  };

  const saveSettings = async () => {
    if (!team) return;

    try {
      setSaving(true);
      
      // Get all teams, update this one, and save
      const response = await authenticatedFetch('/api/v1/cameras/settings');

      if (response.ok) {
        const data = await response.json();
        const allTeams = data.teams || [];
        
        // Update the current team in the list
        const updatedTeams = allTeams.map((t: CameraTeam) => 
          t.teamId === teamId ? team : t
        );

        // Save updated settings
        const saveResponse = await authenticatedFetch('/api/v1/cameras/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ teams: updatedTeams })
        });

        if (saveResponse.ok) {
          await showAlert({ type: 'success', message: 'Camera settings saved successfully!' });
        } else {
          await showAlert({ type: 'error', message: 'Failed to save camera settings' });
        }
      }
    } catch (error) {
      console.error('Error saving camera settings:', error);
      await showAlert({ type: 'error', message: 'Failed to save camera settings' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Team Not Found</h2>
          <button
            onClick={() => router.push('/modules/cameras/setup')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Setup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            {team.teamLogo ? (
              <Image 
                src={team.teamLogo} 
                alt={team.teamName}
                width={64}
                height={64}
                className="w-16 h-16 rounded-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 text-2xl">
                👥
              </div>
            )}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{team.teamName}</h1>
              <p className="text-gray-400">Configure stream URLs for {team.players.length} players</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/modules/cameras/setup')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Teams
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">Stream Configuration Progress</span>
            <span className="text-blue-400">
              {team.players.filter(p => p.url && p.url.trim() !== '').length} / {team.players.length}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ 
                width: `${(team.players.filter(p => p.url && p.url.trim() !== '').length / team.players.length) * 100}%` 
              }}
            ></div>
          </div>
        </div>

        {/* Players Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Team Stream Configuration */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 col-span-1 lg:col-span-2 xl:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Team Stream</h3>
                <p className="text-sm text-gray-400">Single stream representing the whole team</p>
              </div>
              <div className={`w-3 h-3 rounded-full ${team.teamStreamUrl && team.teamStreamUrl.trim() !== '' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Team Stream URL</label>
                <input
                  type="url"
                  placeholder="https://twitch.tv/team or OBS Stream URL"
                  value={team.teamStreamUrl || ''}
                  onChange={(e) => updateTeamStreamUrl(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {team.players.map((player) => (
            <div key={player.playerId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{player.playerName}</h3>
                </div>
                <div className={`w-3 h-3 rounded-full ${player.url && player.url.trim() !== '' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Live Stream URL</label>
                  <input
                    type="url"
                    placeholder="https://twitch.tv/player or OBS Stream URL"
                    value={player.url || ''}
                    onChange={(e) => updatePlayerUrl(player.playerId || '', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/modules/cameras/stream/${teamId}`)}
              disabled={team.players.filter(p => p.url && p.url.trim() !== '').length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Test Team Stream
            </button>
            <button
              onClick={() => router.push('/modules/cameras/all')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              View All Cameras
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Stream URL Examples</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Twitch Streams:</h4>
                <code className="block bg-gray-700 p-2 rounded text-green-400 text-xs">
                  https://player.twitch.tv/?channel=CHANNEL_NAME&parent=localhost
                </code>
              </div>
              <div>
                <h4 className="font-medium text-gray-300 mb-2">YouTube Streams:</h4>
                <code className="block bg-gray-700 p-2 rounded text-green-400 text-xs">
                  https://www.youtube.com/embed/VIDEO_ID
                </code>
              </div>
              <div>
                <h4 className="font-medium text-gray-300 mb-2">OBS Studio:</h4>
                <code className="block bg-gray-700 p-2 rounded text-green-400 text-xs">
                  rtmp://your-server.com/live/stream_key
                </code>
              </div>
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Direct Video:</h4>
                <code className="block bg-gray-700 p-2 rounded text-green-400 text-xs">
                  https://example.com/stream.m3u8
                </code>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
                <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2">
                  🏆 Tournament Delay Setup
                </h4>
                <p className="text-sm text-gray-300 mb-3">
                  For competitive integrity, set up delayed streams when not using official spectator mode:
                </p>
                <div className="space-y-2 text-xs text-gray-400">
                  <div>
                    <strong className="text-gray-300">OBS Studio:</strong>
                    <br />• Use &quot;Stream Delay&quot; filter (3 minutes)
                    <br />• Create separate delayed stream keys
                  </div>
                  <div>
                    <strong className="text-gray-300">Twitch:</strong>
                    <br />• Enable stream delay in dashboard
                    <br />• Use different channel for delayed feed
                  </div>
                  <div>
                    <strong className="text-gray-300">Streaming Software:</strong>
                    <br />• Configure built-in delay features
                    <br />• Use server-side delay solutions
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                <h4 className="font-medium text-blue-400 mb-2">💡 Pro Tips</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li>• Test both live and delayed streams before tournaments</li>
                  <li>• Use keyboard shortcuts: T for tournament mode</li>
                  <li>• Monitor stream quality and delay accuracy</li>
                  <li>• Have backup delay mechanisms ready</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 