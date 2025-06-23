'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { AuthGuard } from '@lib/components/AuthGuard';
import { getChampionById } from '@lib/champions';
import Image from 'next/image';

interface LCUCredentials {
  port: string;
  password: string;
  protocol: string;
}

interface ChampSelectPlayer {
  cellId: number;
  championId: number;
  summonerId: number;
  summonerName: string;
  puuid: string;
  isBot: boolean;
  isActingNow: boolean;
  pickTurn: number;
  banTurn: number;
  team: number;
}

interface ChampSelectAction {
  id: number;
  actorCellId: number;
  championId: number;
  completed: boolean;
  type: 'pick' | 'ban';
  isInProgress: boolean;
}

interface ChampSelectTimer {
  adjustedTimeLeftInPhase: number;
  totalTimeInPhase: number;
  phase: string;
  isInfinite: boolean;
}

interface ChampSelectSession {
  phase: string;
  timer: ChampSelectTimer;
  chatDetails: {
    chatRoomName: string;
    chatRoomPassword: string;
  };
  myTeam: ChampSelectPlayer[];
  theirTeam: ChampSelectPlayer[];
  trades: unknown[];
  actions: ChampSelectAction[][];
  bans: {
    myTeamBans: number[];
    theirTeamBans: number[];
  };
  localPlayerCellId: number;
  isSpectating: boolean;
}

export default function LeagueClientPage() {
  const { setActiveModule } = useNavigation();
  const { user: _user, isLoading: _authLoading } = useAuth();
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lcuCredentials, setLcuCredentials] = useState<LCUCredentials | null>(null);
  const [champSelectData, setChampSelectData] = useState<ChampSelectSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoReconnect, setAutoReconnect] = useState(true);
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    setActiveModule('pickban');
  }, [setActiveModule]);

  const _findLCUCredentials = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/cameras/lcu-credentials');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get LCU credentials');
      }
      
      const data = await response.json();
      return {
        port: data.credentials.port,
        password: data.credentials.password,
        protocol: data.credentials.protocol
      };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Could not find League Client process. Make sure League of Legends is running.');
    }
  }, []);

  const _makeRequest = useCallback(async (endpoint: string, method: 'GET' | 'POST' | 'PATCH' = 'GET', body?: unknown) => {
    if (!lcuCredentials) {
      throw new Error('No LCU credentials available');
    }

    const url = `${lcuCredentials.protocol}://127.0.0.1:${lcuCredentials.port}${endpoint}`;
    const auth = btoa(`riot:${lcuCredentials.password}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined,
      // In a real browser, you'd need to disable SSL verification
      // This would typically be handled by a proxy server or electron app
    });

    if (!response.ok) {
      throw new Error(`LCU request failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }, [lcuCredentials]);

  const pollChampSelect = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/cameras/lcu-champselect');
      const result = await response.json();
      
      if (result.success) {
        if (result.data) {
          setChampSelectData(result.data);
        } else {
          // Champion select not active - clear data
          if (champSelectData) {
            setChampSelectData(null);
          }
        }
        setError(null);
      } else {
        console.error('Champion select polling failed:', result.message);
        // Don't show this as an error since it might just mean no champ select
        if (champSelectData) {
          setChampSelectData(null);
        }
      }
    } catch (error) {
      console.error('Error polling champ select:', error);
      // Champion select might not be active, this is normal
      if (champSelectData) {
        setChampSelectData(null);
      }
    }
  }, [champSelectData]);

  const connectToLCU = useCallback(async () => {
    setConnectionStatus('connecting');
    setError(null);
    setSuccessMessage(null);
    reconnectAttemptsRef.current = 0;

    try {
      // Use our working direct test endpoint to verify LCU connection
      const testResponse = await fetch('/api/v1/cameras/lcu-test-direct');
      const testResult = await testResponse.json();
      
      if (!testResult.success) {
        throw new Error(testResult.message || testResult.error || 'LCU test failed');
      }

      // Get credentials from our working endpoint
      const credentialsResponse = await fetch('/api/v1/cameras/lcu-credentials');
      const credentialsResult = await credentialsResponse.json();
      
      if (!credentialsResult.success) {
        throw new Error(credentialsResult.message || 'Failed to get LCU credentials');
      }

      // Connection successful, set the credentials
      setLcuCredentials(credentialsResult.credentials);
      setConnectionStatus('connected');
      
      // Start polling for champion select data
      pollingRef.current = setInterval(pollChampSelect, 1000);
      
    } catch (error) {
      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to connect to League Client');
      
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        
        retryTimeoutRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          connectToLCU();
        }, delay);
      }
    }
  }, [autoReconnect, pollChampSelect]);

  const disconnect = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setConnectionStatus('disconnected');
    setChampSelectData(null);
    setLcuCredentials(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

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

    // Log the actual data structure to understand what we're getting
    console.log('Champion Select Data:', champSelectData);
    
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
            
            {/* Team Bans */}
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

            {/* Team Players */}
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

        {/* Action History */}
        {actions && actions.length > 0 && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Draft Actions</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {actions.flat().map((action) => (
                <div key={action.id} className="flex justify-between items-center p-2 bg-gray-600 rounded text-sm">
                  <span>
                    Player {action.actorCellId + 1} - {action.type}
                  </span>
                  <div className="flex items-center gap-2">
                    {action.championId && (
                      <span className="text-gray-300">
                        {getChampionName(action.championId)}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      action.completed ? 'bg-green-600' : 
                      action.isInProgress ? 'bg-yellow-600' : 'bg-gray-500'
                    }`}>
                      {action.completed ? 'Complete' : action.isInProgress ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const connectionStatusColor = {
    disconnected: 'text-gray-400',
    connecting: 'text-yellow-400',
    connected: 'text-green-400',
    error: 'text-red-400'
  };

  const connectionStatusText = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    connected: 'Connected to League Client',
    error: 'Connection Error'
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">League Client Monitor</h1>
              <p className="text-gray-400">Connect to League of Legends client for live champion select data</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.history.back()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Back
              </button>
            </div>
          </div>

          {/* Connection Controls */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Connection Status</h2>
              <div className={`flex items-center gap-2 ${connectionStatusColor[connectionStatus]}`}>
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' :
                  connectionStatus === 'connecting' ? 'bg-yellow-400' :
                  connectionStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
                }`} />
                {connectionStatusText[connectionStatus]}
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoReconnect}
                  onChange={(e) => setAutoReconnect(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-300">Auto-reconnect</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={connectToLCU}
                disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Connect to League Client
              </button>
              <button
                onClick={disconnect}
                disabled={connectionStatus === 'disconnected'}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Disconnect
              </button>
              <button
                onClick={async () => {
                  try {
                    setError(null);
                    setSuccessMessage(null);
                    const response = await fetch('/api/v1/cameras/lcu-test-direct');
                    const result = await response.json();
                    
                    if (result.success) {
                      const summoner = result.summoner;
                      console.log('LCU Test Result:', summoner);
                      setSuccessMessage(`✅ Test successful! Connected to summoner: ${summoner?.gameName || 'Unknown'} (Level ${summoner?.summonerLevel || '?'}) via ${result.method}`);
                    } else {
                      setError(`❌ Test failed: ${result.message || result.error}`);
                    }
                  } catch (err) {
                    setError(`❌ Test error: ${err instanceof Error ? err.message : 'Unknown error'}`);
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Test Direct Connection
              </button>
              <button
                onClick={async () => {
                  try {
                    setError(null);
                    setSuccessMessage(null);
                    const response = await fetch('/api/v1/cameras/lcu-status');
                    const result = await response.json();
                    
                    const checks = result.checks;
                    let statusMsg = `📊 League Status:\n`;
                    statusMsg += `• Platform: ${checks.platform}\n`;
                    statusMsg += `• Installed: ${checks.leagueInstalled ? '✅' : '❌'}\n`;
                    statusMsg += `• Running: ${checks.leagueRunning ? '✅' : '❌'}\n`;
                    statusMsg += `• Lockfile: ${checks.lockfileExists ? '✅' : '❌'}\n`;
                    
                    if (checks.lockfileDetails) {
                      statusMsg += `• Port: ${checks.lockfileDetails.port}\n`;
                      statusMsg += `• Protocol: ${checks.lockfileDetails.protocol}`;
                    }
                    
                    if (checks.leagueInstalled && checks.leagueRunning && checks.lockfileExists) {
                      setSuccessMessage(statusMsg);
                    } else {
                      setError(statusMsg);
                    }
                  } catch (err) {
                    setError(`❌ Status check error: ${err instanceof Error ? err.message : 'Unknown error'}`);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Check Status
              </button>
            </div>

            {successMessage && (
              <div className="mt-4 p-3 bg-green-600/20 border border-green-600 rounded-lg text-green-400">
                <div className="font-medium mb-2">Success:</div>
                <div className="text-sm whitespace-pre-line">{successMessage}</div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-400">
                <div className="font-medium mb-2">
                  {error.includes('Status:') ? 'League Status:' : 'Connection Error:'}
                </div>
                <div className="text-sm mb-3 whitespace-pre-line">{error}</div>
                
                {error.includes('certificate') && (
                  <div className="text-xs bg-yellow-600/20 border border-yellow-600 rounded p-2 text-yellow-400">
                    <strong>SSL Certificate Issue:</strong> This is normal for LCU connections. The League client uses self-signed certificates.
                    <br />
                    <strong>Solutions:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Run this app in Electron (recommended)</li>
                      <li>Use a local proxy server</li>
                      <li>Configure browser to ignore localhost SSL errors</li>
                    </ul>
                  </div>
                )}
                
                {error.includes('not running') && (
                  <div className="text-xs bg-blue-600/20 border border-blue-600 rounded p-2 text-blue-400">
                    <strong>League Client Not Found:</strong>
                    <ul className="list-disc list-inside mt-1">
                      <li>Make sure League of Legends is running</li>
                      <li>Log into your account (not on login screen)</li>
                      <li>Try restarting the League client</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Champion Select Display */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Live Champion Select</h2>
            {connectionStatus === 'connected' ? (
              renderChampSelectInterface()
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {connectionStatus === 'disconnected' && 'Connect to League Client to see live champion select data'}
                  {connectionStatus === 'connecting' && 'Establishing connection with League Client...'}
                  {connectionStatus === 'error' && 'Connection failed. Make sure League of Legends is running.'}
                </div>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-300 mb-2">1. Start League of Legends</h4>
                <p className="text-gray-400">Make sure the League of Legends client is running on your computer.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-300 mb-2">2. Connect</h4>
                <p className="text-gray-400">Click &ldquo;Connect to League Client&rdquo; to establish connection with the LCU API.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-300 mb-2">3. Enter Champion Select</h4>
                <p className="text-gray-400">Start a game (ranked, normal, custom) to see live pick & ban data.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-300 mb-2">4. Monitor Draft</h4>
                <p className="text-gray-400">View real-time champion select information including picks, bans, and timers.</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-600/20 border border-yellow-600 rounded-lg">
              <p className="text-yellow-400 text-sm">
                <strong>Note:</strong> This tool reads data from the League Client Update (LCU) API. 
                Due to browser security restrictions, you may need to run this in an Electron app or 
                use a local proxy server to bypass CORS limitations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}