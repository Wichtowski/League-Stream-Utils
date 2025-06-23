'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import Image from 'next/image';
import type { GameState } from '@lib/types';

export default function OBSView({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [, setConnected] = useState(false);

  // Throttling and connection management refs
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);

  const connectWebSocket = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (isConnectingRef.current) {
      return; // Already trying to connect
    }

    isConnectingRef.current = true;

    try {
      fetch('/api/v1/pickban/ws').then(() => {
        const websocket = new WebSocket('ws://localhost:8080');

        websocket.onopen = () => {
          isConnectingRef.current = false;
          setConnected(true);
          websocket.send(JSON.stringify({
            type: 'join',
            sessionId: resolvedParams.sessionId
          }));
        };

        websocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === 'gameState') {
            setGameState(message.payload);
          }
        };

        websocket.onclose = () => {
          isConnectingRef.current = false;
          setConnected(false);
          setWs(null);

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            if (document.visibilityState === 'visible') {
              connectWebSocket();
            }
          }, 3000);
        };

        websocket.onerror = () => {
          isConnectingRef.current = false;
          setConnected(false);
        };

        setWs(websocket);
      }).catch((error) => {
        isConnectingRef.current = false;
        console.error('Failed to initialize WebSocket server:', error);
        setTimeout(connectWebSocket, 5000);
      });
    } catch (error) {
      isConnectingRef.current = false;
      console.error('Failed to connect:', error);
      setTimeout(connectWebSocket, 5000);
    }
  }, [resolvedParams.sessionId, ws]);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws) {
        ws.close();
        setWs(null);
      }
      isConnectingRef.current = false;
    };
  }, [resolvedParams.sessionId]);

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (!gameState || !gameState.bothTeamsReady) {
    return (
      <div className="w-screen h-screen bg-transparent flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-6 animate-pulse bg-gradient-to-r from-blue-400 via-purple-500 to-red-400 bg-clip-text text-transparent">
            WAITING FOR TEAMS
          </div>
          <div className="flex justify-center space-x-6">
            <div className={`px-4 py-2 rounded-lg text-lg font-semibold transition-all duration-500 ${gameState?.teams.blue.isReady
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400'
              }`}>
              Blue Team {gameState?.teams.blue.isReady ? '✓' : '⏳'}
            </div>
            <div className={`px-4 py-2 rounded-lg text-lg font-semibold transition-all duration-500 ${gameState?.teams.red.isReady
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-400'
              }`}>
              Red Team {gameState?.teams.red.isReady ? '✓' : '⏳'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden relative">
      {/* Event Header */}
      {gameState.config && (gameState.config.tournamentName || gameState.config.tournamentLogo) && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-black/90 backdrop-blur-sm border border-purple-500/50 rounded-lg px-6 py-3 flex items-center gap-4">
            {gameState.config.tournamentLogo && (
              <Image
                width={32}
                height={32}
                src={gameState.config.tournamentLogo}
                alt="Event Logo"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            {gameState.config.tournamentName && (
              <div className="text-white text-lg font-bold">
                {gameState.config.tournamentName}
              </div>
            )}
            {gameState.config.patchName && (
              <div className="text-purple-300 text-sm">
                Patch {gameState.config.patchName}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reserve space at the top for broadcast overlays */}
      <div className="h-20"></div>

      {/* Main content area */}
      <div className="h-[calc(100vh-80px)] flex flex-col">

        {/* Top section - Phase and Timer */}
        <div className="h-24 flex items-center justify-center relative mb-4">
          {/* Phase indicator */}
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2">
            <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2">
              <div className="text-white font-bold text-lg">
                {gameState.phase === 'ban1' ? 'BAN PHASE 1' :
                  gameState.phase === 'pick1' ? 'PICK PHASE 1' :
                    gameState.phase === 'ban2' ? 'BAN PHASE 2' :
                      gameState.phase === 'pick2' ? 'PICK PHASE 2' :
                        gameState.phase.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Timer */}
          {gameState.timer.isActive && (
            <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl px-8 py-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${gameState.timer.remaining < 10000 ? 'text-red-400 animate-pulse' : 'text-white'
                  }`}>
                  {formatTime(gameState.timer.remaining)}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  {gameState.currentTurn?.team.toUpperCase()} {gameState.currentTurn?.type.toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Turn indicator */}
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
            <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2">
              <div className="text-white font-bold text-lg">
                TURN {gameState.turnNumber + 1}
              </div>
            </div>
          </div>
        </div>

        {/* Main draft area */}
        <div className="flex-1 px-8 pb-8">
          <div className="h-full flex">

            {/* Blue Team Side */}
            <div className="w-1/3 pr-4">
              {/* Blue Team Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-lg p-4 mb-2">
                <div className="flex items-center justify-center gap-3">
                  {gameState.teams.blue.logoUrl && (
                    <Image
                      width={32}
                      height={32}
                      src={gameState.teams.blue.logoUrl}
                      alt="Blue Team Logo"
                      className="h-8 w-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <h2 className="text-white text-2xl font-bold text-center">
                    {gameState.teams.blue.prefix && (
                      <span className="text-blue-300 mr-2">[{gameState.teams.blue.prefix}]</span>
                    )}
                    {gameState.teams.blue.name || 'BLUE SIDE'}
                  </h2>
                </div>
              </div>

              {/* Blue Team Bans */}
              <div className="bg-black/80 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-white text-lg font-semibold mb-3 text-center">BANS</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }, (_, i) => {
                    const ban = gameState.teams.blue.bans[i];
                    return (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-600">
                        {ban ? (
                          <>
                            <Image
                              width={64}
                              height={64}
                              src={ban.image}
                              alt={ban.name}
                              className="w-full h-full object-cover grayscale"
                            />
                            <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                              <div className="text-white text-xs font-bold rotate-45 bg-red-800 px-2 py-1 rounded">
                                BANNED
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center">
                            <span className="text-gray-500">-</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Blue Team Picks */}
              <div className="bg-black/80 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-white text-lg font-semibold mb-3 text-center">PICKS</h3>
                <div className="space-y-3">
                  {Array.from({ length: 5 }, (_, i) => {
                    const pick = gameState.teams.blue.picks[i];
                    return (
                      <div key={i} className="flex items-center bg-blue-900/40 rounded-lg p-2 min-h-[60px]">
                        <div className="w-12 h-12 rounded overflow-hidden border-2 border-blue-400 mr-3">
                          {pick ? (
                            <Image
                              width={64}
                              height={64}
                              src={pick.image}
                              alt={pick.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-700 border-2 border-dashed border-gray-500"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold">
                            {pick ? pick.name : `Player ${i + 1}`}
                          </div>
                          <div className="text-blue-300 text-sm">
                            {pick ? 'LOCKED IN' : 'SELECTING...'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Center Area - VS and Active Turn */}
            <div className="w-1/3 px-4 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <div className="text-8xl font-bold text-white mb-4 opacity-20">VS</div>
              </div>

              {/* Current Turn Indicator */}
              {gameState.currentTurn && (
                <div className={`bg-black/90 backdrop-blur-sm border-2 rounded-xl p-6 ${gameState.currentTurn.team === 'blue' ? 'border-blue-500' : 'border-red-500'
                  }`}>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${gameState.currentTurn.team === 'blue' ? 'text-blue-400' : 'text-red-400'
                      }`}>
                      {gameState.currentTurn.team.toUpperCase()} SIDE
                    </div>
                    <div className="text-white text-xl">
                      {gameState.currentTurn.type.toUpperCase()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Red Team Side */}
            <div className="w-1/3 pl-4">
              {/* Red Team Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-t-lg p-4 mb-2">
                <div className="flex items-center justify-center gap-3">
                  {gameState.teams.red.logoUrl && (
                    <Image
                      width={32}
                      height={32}
                      src={gameState.teams.red.logoUrl}
                      alt="Red Team Logo"
                      className="h-8 w-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <h2 className="text-white text-2xl font-bold text-center">
                    {gameState.teams.red.prefix && (
                      <span className="text-red-300 mr-2">[{gameState.teams.red.prefix}]</span>
                    )}
                    {gameState.teams.red.name || 'RED SIDE'}
                  </h2>
                </div>
              </div>

              {/* Red Team Bans */}
              <div className="bg-black/80 backdrop-blur-sm border border-red-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-white text-lg font-semibold mb-3 text-center">BANS</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }, (_, i) => {
                    const ban = gameState.teams.red.bans[i];
                    return (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-600">
                        {ban ? (
                          <>
                            <Image
                              width={64}
                              height={64}
                              src={ban.image}
                              alt={ban.name}
                              className="w-full h-full object-cover grayscale"
                            />
                            <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                              <div className="text-white text-xs font-bold rotate-45 bg-red-800 px-2 py-1 rounded">
                                BANNED
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center">
                            <span className="text-gray-500">-</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Red Team Picks */}
              <div className="bg-black/80 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
                <h3 className="text-white text-lg font-semibold mb-3 text-center">PICKS</h3>
                <div className="space-y-3">
                  {Array.from({ length: 5 }, (_, i) => {
                    const pick = gameState.teams.red.picks[i];
                    return (
                      <div key={i} className="flex items-center bg-red-900/40 rounded-lg p-2 min-h-[60px]">
                        <div className="w-12 h-12 rounded overflow-hidden border-2 border-red-400 mr-3">
                          {pick ? (
                            <Image
                              width={64}
                              height={64}
                              src={pick.image}
                              alt={pick.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-700 border-2 border-dashed border-gray-500"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold">
                            {pick ? pick.name : `Player ${i + 1}`}
                          </div>
                          <div className="text-red-300 text-sm">
                            {pick ? 'LOCKED IN' : 'SELECTING...'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Completion Overlay */}
      {gameState.phase === 'completed' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-8xl font-bold text-white mb-8 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
              DRAFT COMPLETE
            </div>
            <div className="text-3xl text-gray-300">
              Good luck on the Rift!
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .animate-slideIn {
          animation: slideIn 0.5s ease-out forwards;
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
} 