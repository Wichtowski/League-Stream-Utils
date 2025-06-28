'use client';

import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { AuthGuard } from '@lib/components/AuthGuard';
import { getChampionById } from '@lib/champions';
import { LCUConnector, type ConnectionStatus } from '@lib/services/lcu-connector';
import type { ChampSelectSession } from '@lib/types';
import { useElectron } from '@lib/contexts/ElectronContext';
import Image from 'next/image';

export default function LeagueClientPickBanPage() {
  const { setActiveModule } = useNavigation();
  const { user: _user, isLoading: _authLoading } = useAuth();
  const { isElectron } = useElectron();
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [champSelectData, setChampSelectData] = useState<ChampSelectSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoReconnect, setAutoReconnect] = useState(true);
  
  const lcuConnectorRef = useRef<LCUConnector | null>(null);

  useEffect(() => {
    setActiveModule('pickban');
  }, [setActiveModule]);

  // Check if running in Electron
  useEffect(() => {
    if (!isElectron) {
      setError('League Client integration is only available in the desktop app. Please download and use the Electron version.');
    }
  }, [isElectron]);

  useEffect(() => {
    // Only initialize LCU connector in Electron
    if (!isElectron) return;

    // Initialize LCU connector
    const connector = new LCUConnector({
      autoReconnect,
      maxReconnectAttempts: 5,
      pollInterval: 1000
    });

    // Set up event handlers
    connector.setOnStatusChange(setConnectionStatus);
    connector.setOnChampSelectUpdate(setChampSelectData);
    connector.setOnError(setError);

    lcuConnectorRef.current = connector;

    // Cleanup on unmount
    return () => {
      connector.destroy();
      lcuConnectorRef.current = null;
    };
  }, [autoReconnect, isElectron]);

  const connectToLCU = async (): Promise<void> => {
    if (!isElectron) {
      setError('League Client integration requires the desktop app.');
      return;
    }
    
    setError(null);
    setSuccessMessage(null);
    lcuConnectorRef.current?.connect();
  };

  const disconnect = (): void => {
    lcuConnectorRef.current?.disconnect();
  };

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getChampionName = (championId: number) => {
    if (!championId) return 'None';
    const champion = getChampionById(championId);
    return champion?.name || `Champion ${championId}`;
  };

  const getChampionImage = (championId: number) => {
    if (!championId) return null;
    const champion = getChampionById(championId);
    return champion?.image || null;
  };

  // Show Electron requirement message if not in Electron
  if (!isElectron) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="max-w-md text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Desktop App Required</h1>
              <p className="text-gray-400">
                League Client integration is only available in the desktop app. 
                The web version uses static pick & ban instead.
              </p>
            </div>
            <div className="space-y-3">
              <a 
                href="/modules/pickban/static" 
                className="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Use Static Pick & Ban
              </a>
              <p className="text-sm text-gray-500">
                Or download the desktop app for full League Client integration
              </p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const renderConnectionStatus = () => {
    const statusColors = {
      disconnected: 'bg-red-600',
      connecting: 'bg-yellow-600',
      connected: 'bg-green-600',
      error: 'bg-red-600'
    };

    const statusTexts = {
      disconnected: 'Disconnected',
      connecting: 'Connecting...',
      connected: 'Connected',
      error: 'Connection Error'
    };

    return (
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${statusColors[connectionStatus]}`} />
            <span className="font-medium">League Client Status</span>
            <span className="text-gray-400">{statusTexts[connectionStatus]}</span>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-reconnect</span>
            </label>
            {connectionStatus === 'disconnected' || connectionStatus === 'error' ? (
              <button
                onClick={connectToLCU}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Connect to League
              </button>
            ) : (
              <button
                onClick={disconnect}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderChampSelectInterface = () => {
    if (!champSelectData) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            Waiting for champion select to begin...
          </div>
          <div className="text-sm text-gray-500">
            Start a game in League of Legends to see live pick & ban data
          </div>
        </div>
      );
    }

    const { phase, timer, myTeam, theirTeam, bans, actions } = champSelectData;
    const currentAction = actions?.flat().find(action => action.isInProgress);

    return (
      <div className="space-y-6">
        {/* Phase and Timer */}
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Champion Select</h3>
            <div className="text-right">
              <div className="text-xl font-mono text-white">
                {timer?.isInfinite ? '∞' : formatTime(timer?.adjustedTimeLeftInPhase || 0)}
              </div>
              <div className="text-sm text-gray-400 capitalize">
                {phase ? phase.replace(/([A-Z])/g, ' $1').trim() : 'Unknown Phase'}
              </div>
            </div>
          </div>
          
          {currentAction && (
            <div className="bg-yellow-600/20 border border-yellow-600 rounded p-2 text-yellow-400 text-sm">
              Player {currentAction.actorCellId + 1} is {currentAction.type === 'ban' ? 'banning' : 'picking'} a champion
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Your Team */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-blue-400 font-semibold mb-4">Your Team</h3>
            
            {/* Team Bans */}
            <div className="mb-4">
              <h4 className="text-sm text-gray-300 mb-2">Bans</h4>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 5 }, (_, i) => {
                  const championId = bans?.myTeamBans?.[i];
                  const image = getChampionImage(championId);
                  
                  return (
                    <div key={i} className="aspect-square bg-gray-800 rounded border-2 border-gray-600 overflow-hidden relative">
                      {image ? (
                        <>
                          <Image
                            src={image}
                            alt={getChampionName(championId)}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover grayscale"
                          />
                          <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">X</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          Ban {i + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Players */}
            <div className="space-y-2">
              {myTeam?.map((player) => {
                const image = getChampionImage(player.championId);
                
                return (
                  <div key={player.cellId} className={`flex items-center bg-blue-900/30 rounded p-2 ${
                    player.isActingNow ? 'ring-2 ring-yellow-400' : ''
                  }`}>
                    <div className="w-12 h-12 bg-gray-700 rounded border-2 border-blue-400 overflow-hidden mr-3">
                      {image ? (
                        <Image
                          src={image}
                          alt={getChampionName(player.championId)}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          {player.cellId + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {player.summonerName || `Player ${player.cellId + 1}`}
                      </div>
                      <div className="text-blue-300 text-sm">
                        {getChampionName(player.championId)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enemy Team */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-4">Enemy Team</h3>
            
            {/* Enemy Team Bans */}
            <div className="mb-4">
              <h4 className="text-sm text-gray-300 mb-2">Bans</h4>
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 5 }, (_, i) => {
                  const championId = bans?.theirTeamBans?.[i];
                  const image = getChampionImage(championId);
                  
                  return (
                    <div key={i} className="aspect-square bg-gray-800 rounded border-2 border-gray-600 overflow-hidden relative">
                      {image ? (
                        <>
                          <Image
                            src={image}
                            alt={getChampionName(championId)}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover grayscale"
                          />
                          <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">X</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          Ban {i + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enemy Team Players */}
            <div className="space-y-2">
              {theirTeam?.map((player) => {
                const image = getChampionImage(player.championId);
                
                return (
                  <div key={player.cellId} className={`flex items-center bg-red-900/30 rounded p-2 ${
                    player.isActingNow ? 'ring-2 ring-yellow-400' : ''
                  }`}>
                    <div className="w-12 h-12 bg-gray-700 rounded border-2 border-red-400 overflow-hidden mr-3">
                      {image ? (
                        <Image
                          src={image}
                          alt={getChampionName(player.championId)}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          {player.cellId + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {player.summonerName || `Player ${player.cellId + 1}`}
                      </div>
                      <div className="text-red-300 text-sm">
                        {getChampionName(player.championId)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">League Client Integration</h1>
            <p className="text-gray-400">
              Real-time champion select monitoring and integration with League of Legends client.
              This feature is only available in the desktop app.
            </p>
          </div>

          {error && (
            <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-600/20 border border-green-600 rounded-lg p-4 mb-6">
              <p className="text-green-400">{successMessage}</p>
            </div>
          )}

          {renderConnectionStatus()}
          {renderChampSelectInterface()}
        </div>
      </div>
    </AuthGuard>
  );
}