'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { useElectron } from '@lib/contexts/ElectronContext';
import { AuthGuard } from '@lib/components/AuthGuard';

interface LeagueClientData {
  phase?: string;
  timer?: {
    adjustedTimeLeftInPhase: number;
    totalTimeInPhase: number;
    phase: string;
  };
  actions?: Array<{
    id: number;
    actorCellId: number;
    championId: number;
    completed: boolean;
    type: string;
  }>;
  bans?: {
    blueTeamBans: number[];
    redTeamBans: number[];
  };
  picks?: {
    blueTeamPicks: Array<{ championId: number; cellId: number }>;
    redTeamPicks: Array<{ championId: number; cellId: number }>;
  };
  blueTeam?: Array<{
    cellId: number;
    championId: number;
    summonerName: string;
    position: string;
  }>;
  redTeam?: Array<{
    cellId: number;
    championId: number;
    summonerName: string;
    position: string;
  }>;
}

export default function LeagueClientPage() {
  const { setActiveModule } = useNavigation();
  const { user: _user, isLoading: _authLoading } = useAuth();
  const { isElectron: _isElectron, useLocalData: _useLocalData } = useElectron();
  
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [clientData, setClientData] = useState<LeagueClientData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState('ws://localhost:8999');
  const [autoReconnect, setAutoReconnect] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    setActiveModule('pickban');
  }, [setActiveModule]);

  const connectToLeagueClient = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to League Client');
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setClientData(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('Disconnected from League Client', event.code, event.reason);
        setConnectionStatus('disconnected');
        
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            connectToLeagueClient();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        setError('Failed to connect to League Client. Make sure the backend is running on the specified URL.');
      };

    } catch (err) {
      setConnectionStatus('error');
      setError('Invalid WebSocket URL');
      console.error('WebSocket connection error:', err);
    }
  }, [wsUrl, autoReconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
    setClientData(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const renderPhaseDisplay = () => {
    if (!clientData) return <div className="text-gray-400">No data received</div>;

    return (
      <div className="space-y-6">
        {/* Phase and Timer */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Current Phase</h3>
          <div className="flex justify-between items-center">
            <span className="text-xl capitalize">{clientData.phase || 'Unknown'}</span>
            {clientData.timer && (
              <div className="text-right">
                <div className="text-2xl font-mono">
                  {Math.ceil(clientData.timer.adjustedTimeLeftInPhase / 1000)}s
                </div>
                <div className="text-sm text-gray-400">
                  / {Math.ceil(clientData.timer.totalTimeInPhase / 1000)}s
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bans */}
        {clientData.bans && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Bans</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-blue-400 font-medium mb-2">Blue Team</h4>
                <div className="flex gap-1">
                  {clientData.bans.blueTeamBans.map((championId: number, index: number) => (
                    <div key={index} className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-xs">
                      {championId || '?'}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-red-400 font-medium mb-2">Red Team</h4>
                <div className="flex gap-1">
                  {clientData.bans.redTeamBans.map((championId: number, index: number) => (
                    <div key={index} className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-xs">
                      {championId || '?'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teams */}
        <div className="grid grid-cols-2 gap-4">
          {clientData.blueTeam && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-3">Blue Team</h3>
              <div className="space-y-2">
                {clientData.blueTeam.map((player: any) => (
                  <div key={player.cellId} className="flex justify-between items-center">
                    <span className="text-sm">{player.summonerName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{player.position}</span>
                      {player.championId && (
                        <div className="w-6 h-6 bg-blue-600 rounded text-xs flex items-center justify-center">
                          {player.championId}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clientData.redTeam && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-3">Red Team</h3>
              <div className="space-y-2">
                {clientData.redTeam.map((player: any) => (
                  <div key={player.cellId} className="flex justify-between items-center">
                    <span className="text-sm">{player.summonerName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{player.position}</span>
                      {player.championId && (
                        <div className="w-6 h-6 bg-red-600 rounded text-xs flex items-center justify-center">
                          {player.championId}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {clientData.actions && clientData.actions.length > 0 && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Current Actions</h3>
            <div className="space-y-2">
              {clientData.actions.map((action) => (
                <div key={action.id} className="flex justify-between items-center p-2 bg-gray-600 rounded">
                  <span className="text-sm">
                    {action.type} - Cell {action.actorCellId}
                  </span>
                  <div className="flex items-center gap-2">
                    {action.championId && (
                      <span className="text-xs bg-gray-500 px-2 py-1 rounded">
                        Champion: {action.championId}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      action.completed ? 'bg-green-600' : 'bg-yellow-600'
                    }`}>
                      {action.completed ? 'Complete' : 'Pending'}
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
    connected: 'Connected',
    error: 'Connection Error'
  };

  return (
    <AuthGuard>
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">League Client Connection</h1>
              <p className="text-gray-400">Connect to League of Legends client for live pick & ban data</p>
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
              <h2 className="text-xl font-semibold">Connection Settings</h2>
              <div className={`flex items-center gap-2 ${connectionStatusColor[connectionStatus]}`}>
                <div className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' :
                  connectionStatus === 'connecting' ? 'bg-yellow-400' :
                  connectionStatus === 'error' ? 'bg-red-400' : 'bg-gray-400'
                }`} />
                {connectionStatusText[connectionStatus]}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  WebSocket URL
                </label>
                <input
                  type="text"
                  value={wsUrl}
                  onChange={(e) => setWsUrl(e.target.value)}
                  disabled={connectionStatus === 'connected'}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="ws://localhost:8999"
                />
              </div>
              <div className="flex items-end gap-2">
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
            </div>

            <div className="flex gap-3">
              <button
                onClick={connectToLeagueClient}
                disabled={connectionStatus === 'connecting' || connectionStatus === 'connected'}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Connect
              </button>
              <button
                onClick={disconnect}
                disabled={connectionStatus === 'disconnected'}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Pick & Ban Display */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Pick & Ban Interface</h2>
            {connectionStatus === 'connected' ? (
              renderPhaseDisplay()
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {connectionStatus === 'disconnected' && 'Connect to League Client to see pick & ban data'}
                  {connectionStatus === 'connecting' && 'Establishing connection...'}
                  {connectionStatus === 'error' && 'Connection failed. Check your settings and try again.'}
                </div>
                <div className="text-sm text-gray-500">
                  Make sure the League Client backend is running and accessible at the specified URL.
                </div>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Setup Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-300 mb-2">1. Download League Client Backend</h4>
                <p className="text-gray-400 mb-2">
                  Get the backend from: <a href="https://github.com/Wichtowski/lol-pick-ban-ui" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                    lol-pick-ban-ui repository
                  </a>
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-300 mb-2">2. Start the Backend</h4>
                <p className="text-gray-400">Run <code className="bg-gray-700 px-1 rounded">npm start</code> in the backend folder. It should start on port 8999.</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-300 mb-2">3. Start League Client</h4>
                <p className="text-gray-400">Launch League of Legends and enter a pick & ban phase (custom game, ranked, etc.).</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-300 mb-2">4. Connect</h4>
                <p className="text-gray-400">Click the Connect button above to establish connection and view live pick & ban data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 