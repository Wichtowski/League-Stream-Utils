'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getChampionById } from '@lib/champions';
import { LCUConnector, type ConnectionStatus } from '@lib/services/lcu-connector';
import type { ChampSelectPlayer, ChampSelectSession } from '@lib/types';

export function ChampSelectOverlay() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [champSelectData, setChampSelectData] = useState<ChampSelectSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const lcuConnectorRef = useRef<LCUConnector | null>(null);

  useEffect(() => {
    // Initialize LCU connector
    const connector = new LCUConnector({
      autoReconnect: true,
      maxReconnectAttempts: 10,
      pollInterval: 500 // Faster polling for overlay
    });

    // Set up event handlers
    connector.setOnStatusChange(setConnectionStatus);
    connector.setOnChampSelectUpdate(setChampSelectData);
    connector.setOnError(setError);

    lcuConnectorRef.current = connector;

    // Auto-connect on mount
    connector.connect();

    // Cleanup on unmount
    return () => {
      connector.destroy();
      lcuConnectorRef.current = null;
    };
  }, []);

  const formatTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getChampionName = (championId: number): string => {
    if (!championId) return '';
    const champion = getChampionById(championId);
    return champion?.name || `Champion ${championId}`;
  };

  const getChampionImage = (championId: number): string | null => {
    if (!championId) return null;
    const champion = getChampionById(championId);
    return champion?.image || null;
  };

  const renderConnectionStatus = (): React.ReactNode => {
    if (connectionStatus === 'connected' && champSelectData) {
      return null; // Hide when connected and in champ select
    }

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="text-center p-8 bg-gray-900 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-white mb-4">Champion Select Overlay</div>
          <div className={`text-lg mb-4 ${
            connectionStatus === 'connected' ? 'text-green-400' :
            connectionStatus === 'connecting' ? 'text-yellow-400' :
            connectionStatus === 'error' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {connectionStatus === 'disconnected' && 'Connecting to League Client...'}
            {connectionStatus === 'connecting' && 'Establishing connection...'}
            {connectionStatus === 'connected' && 'Waiting for Champion Select...'}
            {connectionStatus === 'error' && 'Connection Error'}
          </div>
          {error && (
            <div className="text-red-400 text-sm max-w-md">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTeamBans = (bans: number[] = [], teamColor: 'blue' | 'red'): React.ReactNode => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => {
          const championId = bans[i];
          const image = getChampionImage(championId);
          const borderColor = teamColor === 'blue' ? 'border-blue-500' : 'border-red-500';
          
          return (
            <div key={i} className={`w-12 h-12 bg-gray-800 rounded border-2 ${borderColor} overflow-hidden relative flex-shrink-0`}>
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
                    <span className="text-white text-xs font-bold">✕</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                  {i + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTeamPicks = (team: ChampSelectPlayer[] = [], teamColor: 'blue' | 'red'): React.ReactNode => {
    const borderColor = teamColor === 'blue' ? 'border-blue-500' : 'border-red-500';
    const bgColor = teamColor === 'blue' ? 'bg-blue-900/30' : 'bg-red-900/30';
    
    return (
      <div className="space-y-2">
        {team.map((player, index) => {
          const image = getChampionImage(player.championId);
          const isCurrentPlayer = player.isActingNow;
          
          return (
            <div key={player.cellId || index} className={`flex items-center p-3 rounded-lg ${bgColor} ${
              isCurrentPlayer ? 'ring-2 ring-yellow-400 bg-yellow-400/20' : ''
            } transition-all duration-300`}>
              <div className={`w-16 h-16 bg-gray-700 rounded border-2 ${borderColor} overflow-hidden mr-4 flex-shrink-0`}>
                {image ? (
                  <Image
                    src={image}
                    alt={getChampionName(player.championId)}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                    {index + 1}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-lg truncate">
                  {player.summonerName || `Player ${index + 1}`}
                </div>
                <div className={`text-sm font-medium ${teamColor === 'blue' ? 'text-blue-300' : 'text-red-300'}`}>
                  {getChampionName(player.championId) || 'No Champion Selected'}
                </div>
              </div>
              {isCurrentPlayer && (
                <div className="flex-shrink-0 ml-4">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (!champSelectData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative">
        {renderConnectionStatus()}
      </div>
    );
  }

  const { phase, timer, myTeam, theirTeam, bans } = champSelectData;
  const currentAction = champSelectData.actions?.flat().find(action => action.isInProgress);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      {/* Header with Phase and Timer */}
      <div className="text-center mb-8">
        <div className="text-4xl font-bold text-white mb-2">
          {timer?.isInfinite ? '∞' : formatTime(timer?.adjustedTimeLeftInPhase || 0)}
        </div>
        <div className="text-xl text-gray-300 capitalize">
          {phase ? phase.replace(/([A-Z])/g, ' $1').trim() : 'Champion Select'}
        </div>
        {currentAction && (
          <div className="mt-3 inline-block bg-yellow-600/20 border border-yellow-600 rounded-lg px-4 py-2 text-yellow-400">
            Player {currentAction.actorCellId + 1} is {currentAction.type === 'ban' ? 'banning' : 'picking'} a champion
          </div>
        )}
      </div>

      {/* Teams Layout */}
      <div className="grid grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Blue Team */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-blue-500/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-blue-400">Blue Team</h2>
            <div className="text-sm text-gray-400">Bans</div>
          </div>
          
          {/* Blue Team Bans */}
          <div className="mb-6">
            {renderTeamBans(bans?.myTeamBans, 'blue')}
          </div>
          
          {/* Blue Team Picks */}
          {renderTeamPicks(myTeam, 'blue')}
        </div>

        {/* Red Team */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-red-500/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-red-400">Red Team</h2>
            <div className="text-sm text-gray-400">Bans</div>
          </div>
          
          {/* Red Team Bans */}
          <div className="mb-6">
            {renderTeamBans(bans?.theirTeamBans, 'red')}
          </div>
          
          {/* Red Team Picks */}
          {renderTeamPicks(theirTeam, 'red')}
        </div>
      </div>
    </div>
  );
} 