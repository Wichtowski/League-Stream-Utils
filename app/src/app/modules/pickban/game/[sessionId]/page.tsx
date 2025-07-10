'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Champion, GameState } from '@lib/types';
import { useGameStateHoverAnimation } from '@lib/hooks/useChampSelectData';

export default function GamePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [champions, setChampions] = useState<Champion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  
  const searchParams = useSearchParams();
  const teamSide = searchParams.get('team') as 'blue' | 'red' | null;
  
  // Throttling refs
  const lastActionTime = useRef<number>(0);
  const lastStateUpdate = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Hover animation hooks
  const hoverAnimation = useGameStateHoverAnimation(gameState);
  
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return; // Already connected
    }
    
    try {
      fetch('/api/v1/pickban/ws').then(() => {
        const websocket = new WebSocket('ws://localhost:8080');
        
        websocket.onopen = () => {
          setConnected(true);
          setError(null);
          
          websocket.send(JSON.stringify({
            type: 'join',
            sessionId: resolvedParams.sessionId,
            teamSide: teamSide
          }));
        };
        
        websocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          
          if (message.type === 'gameState') {
            // Throttle state updates to max once per 500ms
            const now = Date.now();
            if (now - lastStateUpdate.current >= 500) {
              setGameState(message.payload);
              lastStateUpdate.current = now;
            }
          } else if (message.type === 'error') {
            setError(message.payload.message);
          }
        };
        
        websocket.onclose = () => {
          setConnected(false);
          setWs(null);
          // Clear existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          // Reconnect after 3 seconds, but only if component is still mounted
          reconnectTimeoutRef.current = setTimeout(() => {
            if (document.visibilityState === 'visible') {
              // Use a ref to avoid circular dependency
              reconnectTimeoutRef.current = setTimeout(() => {
                if (document.visibilityState === 'visible') {
                  connectWebSocket();
                }
              }, 3000);
            }
          }, 3000);
        };
        
        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Connection error');
          setConnected(false);
        };
        
        setWs(websocket);
        wsRef.current = websocket;
      }).catch((error) => {
        console.error('Failed to initialize WebSocket server:', error);
        setError('Failed to connect to game server');
        setTimeout(() => connectWebSocket(), 5000);
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      setError('Failed to connect to game server');
      setTimeout(() => connectWebSocket(), 5000);
    }
  }, [resolvedParams.sessionId, teamSide]);
  
  // Separate effect for fetching champions (only once)
  useEffect(() => {
    fetch('/api/champions')
      .then(res => res.json())
      .then(setChampions)
      .catch(console.error);
  }, []);
  
  // Separate effect for WebSocket connection
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
    };
  }, [resolvedParams.sessionId, teamSide, connectWebSocket]);
  
  const handleChampionAction = (championId: number, action: 'pick' | 'ban') => {
    if (!ws || !gameState || !teamSide) return;
    
    const canAct = gameState.currentTurn?.team === teamSide && gameState.currentTurn?.type === action;
    if (!canAct) return;
    
    // Throttle actions to prevent spam >.<
    const now = Date.now();
    if (now - lastActionTime.current < 500) {
      return;
    }
    lastActionTime.current = now;
    
    ws.send(JSON.stringify({
      type: action,
      sessionId: resolvedParams.sessionId,
      teamSide: teamSide,
      payload: { championId }
    }));
  };
  
  const handleChampionHover = (championId: number | null, action: 'pick' | 'ban') => {
    if (!ws || !teamSide) return;
    
    if (championId) {
      ws.send(JSON.stringify({
        type: 'hover',
        sessionId: resolvedParams.sessionId,
        teamSide: teamSide,
        payload: { championId, actionType: action }
      }));
    }
  };
  
  const handleReadyToggle = () => {
    if (!ws || !teamSide || gameState?.phase !== 'lobby') return;
    
    const newReadyState = !gameState.teams[teamSide].isReady;
    
    ws.send(JSON.stringify({
      type: 'ready',
      sessionId: resolvedParams.sessionId,
      teamSide: teamSide,
      payload: { ready: newReadyState }
    }));
  };
  
  const filteredChampions = champions.filter(champion =>
    champion.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const isChampionDisabled = (championId: number) => {
    if (!gameState) return false;
    
    const allBans = [...gameState.teams.blue.bans, ...gameState.teams.red.bans];
    const allPicks = [...gameState.teams.blue.picks, ...gameState.teams.red.picks];
    
    return allBans.some(c => c.id === championId) || allPicks.some(c => c.id === championId);
  };
  
  const getChampionStatus = (championId: number) => {
    if (!gameState) return null;
    
    const blueBan = gameState.teams.blue.bans.find(c => c.id === championId);
    const redBan = gameState.teams.red.bans.find(c => c.id === championId);
    const bluePick = gameState.teams.blue.picks.find(c => c.id === championId);
    const redPick = gameState.teams.red.picks.find(c => c.id === championId);
    
    if (blueBan) return 'blue-ban';
    if (redBan) return 'red-ban';
    if (bluePick) return 'blue-pick';
    if (redPick) return 'red-pick';
    return null;
  };
  
  const canTakeAction = () => {
    if (!gameState || !teamSide) return false;
    return gameState.currentTurn?.team === teamSide;
  };
  
  const getCurrentAction = () => {
    return gameState?.currentTurn?.type || null;
  };
  
  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-white text-2xl font-semibold">
            {connected ? 'Loading game...' : 'Connecting...'}
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'config') {
    window.location.href = `/modules/pickban/config/${resolvedParams.sessionId}`;
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-2xl font-semibold">
            Redirecting to configuration...
          </div>
        </div>
      </div>
    );
  }

  if (gameState.phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-red-400 bg-clip-text text-transparent">
              DRAFT LOBBY
            </h1>
            <p className="text-xl text-gray-300">
              Teams must ready up to begin the draft phase
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Blue Team */}
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-600/20 backdrop-blur-lg rounded-3xl p-8 border border-blue-500/30 shadow-2xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-blue-400 mb-6">BLUE TEAM</h2>
                
                {teamSide === 'blue' && (
                  <button
                    onClick={handleReadyToggle}
                    className={`px-8 py-4 rounded-xl text-xl font-bold transition-all duration-300 ${
                      gameState.teams.blue.isReady
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {gameState.teams.blue.isReady ? '✓ READY' : 'READY UP'}
                  </button>
                )}
                
                <div className={`mt-4 text-lg ${
                  gameState.teams.blue.isReady ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {gameState.teams.blue.isReady ? 'Ready!' : 'Not Ready'}
                </div>
              </div>
            </div>
            
            {/* Red Team */}
            <div className="bg-gradient-to-br from-red-900/40 to-red-600/20 backdrop-blur-lg rounded-3xl p-8 border border-red-500/30 shadow-2xl">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-red-400 mb-6">RED TEAM</h2>
                
                {teamSide === 'red' && (
                  <button
                    onClick={handleReadyToggle}
                    className={`px-8 py-4 rounded-xl text-xl font-bold transition-all duration-300 ${
                      gameState.teams.red.isReady
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    {gameState.teams.red.isReady ? '✓ READY' : 'READY UP'}
                  </button>
                )}
                
                <div className={`mt-4 text-lg ${
                  gameState.teams.red.isReady ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {gameState.teams.red.isReady ? 'Ready!' : 'Not Ready'}
                </div>
              </div>
            </div>
          </div>
          
          {/* OBS Link */}
          <div className="text-center mt-12">
            <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-white/20 inline-block">
              <h3 className="text-lg font-semibold mb-2">OBS Overlay URL:</h3>
              <code className="text-blue-400 break-all">
                {window.location.origin}/obs/{resolvedParams.sessionId}
              </code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      {/* Enhanced Header */}
      <div className="bg-black/40 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              DRAFT PHASE
            </h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              connected ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {connected ? '● LIVE' : '● DISCONNECTED'}
            </div>
          </div>
          
          {/* Timer */}
          {gameState.timer.isActive && (
            <div className="bg-black/60 backdrop-blur-lg rounded-2xl px-6 py-3 border border-white/20">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 ${
                  gameState.timer.remaining < 10000 ? 'text-red-400 animate-pulse' : 'text-white'
                }`}>
                  {formatTime(gameState.timer.remaining)}
                </div>
                <div className="text-xs text-gray-400">
                  {gameState.currentTurn?.team.toUpperCase()} {gameState.currentTurn?.type.toUpperCase()}
                </div>
              </div>
            </div>
          )}
          
          <div className="text-right">
            <div className="text-lg font-semibold mb-1">
              {gameState.phase === 'ban1' ? 'BAN PHASE 1' :
               gameState.phase === 'pick1' ? 'PICK PHASE 1' :
               gameState.phase === 'ban2' ? 'BAN PHASE 2' :
               gameState.phase === 'pick2' ? 'PICK PHASE 2' :
               gameState.phase.toUpperCase()}
            </div>
            <div className="text-sm text-gray-400">
              Turn {gameState.turnNumber + 1} of {gameState.totalTurns}
            </div>
            {teamSide && (
              <div className={`px-3 py-1 rounded mt-2 inline-block ${
                teamSide === 'blue' ? 'bg-blue-600' : 'bg-red-600'
              }`}>
                {teamSide === 'blue' ? 'BLUE TEAM' : 'RED TEAM'}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-600 text-white p-4 text-center font-semibold">
          {error}
        </div>
      )}
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Game Status */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Blue Team */}
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-600/10 backdrop-blur-lg rounded-3xl p-6 border border-blue-500/30 shadow-2xl">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-blue-400 mb-2">BLUE TEAM</h3>
                <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-blue-300 mx-auto rounded-full"></div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
                  BANS ({gameState.teams.blue.bans.length}/5)
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 5 }, (_, i) => {
                    const ban = gameState.teams.blue.bans[i];
                    return (
                      <div key={i} className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        ban ? 'border-red-500 shadow-lg shadow-red-500/25' : 'border-gray-600 border-dashed opacity-50'
                      }`}>
                        {ban ? (
                          <>
                            <Image 
                              width={64}
                              height={64}
                              src={ban.image} 
                              alt={ban.name}
                              className="w-full h-full object-cover grayscale"
                            />
                            <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">BAN</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-500 text-lg">-</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="w-4 h-4 bg-blue-500 rounded-full mr-2"></span>
                  PICKS ({gameState.teams.blue.picks.length}/5)
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 5 }, (_, i) => {
                    const pick = gameState.teams.blue.picks[i];
                    return (
                      <div key={i} className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        pick ? 'border-blue-400 shadow-lg shadow-blue-500/25' : 'border-gray-600 border-dashed opacity-50'
                      }`}>
                        {pick ? (
                          <Image 
                            width={64}
                            height={64}
                            src={pick.image} 
                            alt={pick.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-500 text-lg">-</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Red Team */}
            <div className="bg-gradient-to-br from-red-900/30 to-red-600/10 backdrop-blur-lg rounded-3xl p-6 border border-red-500/30 shadow-2xl">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-red-400 mb-2">RED TEAM</h3>
                <div className="w-20 h-1 bg-gradient-to-r from-red-500 to-red-300 mx-auto rounded-full"></div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
                  BANS ({gameState.teams.red.bans.length}/5)
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 5 }, (_, i) => {
                    const ban = gameState.teams.red.bans[i];
                    return (
                      <div key={i} className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        ban ? 'border-red-500 shadow-lg shadow-red-500/25' : 'border-gray-600 border-dashed opacity-50'
                      }`}>
                        {ban ? (
                          <>
                            <Image 
                              width={64}
                              height={64}
                              src={ban.image} 
                              alt={ban.name}
                              className="w-full h-full object-cover grayscale"
                            />
                            <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center">
                              <span className="text-xs font-bold text-white">BAN</span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-500 text-lg">-</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
                  PICKS ({gameState.teams.red.picks.length}/5)
                </h4>
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 5 }, (_, i) => {
                    const pick = gameState.teams.red.picks[i];
                    return (
                      <div key={i} className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                        pick ? 'border-red-400 shadow-lg shadow-red-500/25' : 'border-gray-600 border-dashed opacity-50'
                      }`}>
                        {pick ? (
                          <Image 
                            width={64}
                            height={64}
                            src={pick.image} 
                            alt={pick.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-500 text-lg">-</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Current Turn Indicator */}
          {gameState.currentTurn && (
            <div className="mt-8 text-center">
              <div className={`inline-block px-8 py-4 rounded-2xl font-bold text-xl shadow-2xl ${
                gameState.currentTurn.team === 'blue' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 text-white'
              } ${canTakeAction() ? 'animate-pulse' : ''}`}>
                {gameState.currentTurn.team === 'blue' ? 'BLUE TEAM' : 'RED TEAM'} - 
                {gameState.currentTurn.type === 'ban' ? ' BAN PHASE' : ' PICK PHASE'}
              </div>
              
              {canTakeAction() && (
                <div className="mt-3 text-green-400 font-bold text-lg animate-bounce">
                  YOUR TURN TO {getCurrentAction()?.toUpperCase()}!
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Enhanced Champion Selection */}
        <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search champions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 bg-gray-800/80 backdrop-blur-lg rounded-2xl text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-lg"
            />
          </div>
          
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-14 gap-3">
            {filteredChampions.map((champion) => {
              const status = getChampionStatus(champion.id);
              const disabled = isChampionDisabled(champion.id);
              const canAct = canTakeAction();
              const currentAction = getCurrentAction();
              const hoverClasses = hoverAnimation.getAnimationClasses(champion.id);
              
              return (
                <button
                  key={champion.id}
                  onClick={() => canAct && currentAction && handleChampionAction(champion.id, currentAction)}
                  onMouseEnter={() => currentAction && handleChampionHover(champion.id, currentAction as 'pick' | 'ban')}
                  onMouseLeave={() => currentAction && handleChampionHover(null, currentAction as 'pick' | 'ban')}
                  disabled={disabled}
                  className={`relative w-18 h-18 rounded-xl transition-all duration-300 transform ${
                    disabled 
                      ? 'opacity-30 cursor-not-allowed scale-95' 
                      : canAct 
                        ? 'hover:scale-110 cursor-pointer hover:z-10 hover:shadow-2xl' 
                        : 'cursor-default hover:scale-105'
                  } ${
                    status === 'blue-ban' || status === 'red-ban'
                      ? 'ring-4 ring-red-500 shadow-lg shadow-red-500/50'
                      : status === 'blue-pick'
                        ? 'ring-4 ring-blue-500 shadow-lg shadow-blue-500/50'
                        : status === 'red-pick'
                          ? 'ring-4 ring-red-500 shadow-lg shadow-red-500/50'
                          : hoverClasses
                            ? hoverClasses
                            : canAct
                              ? 'hover:ring-4 hover:ring-white/50 hover:shadow-xl'
                              : ''
                  }`}
                  title={champion.name}
                >
                  <Image
                    width={64}
                    height={64}
                    src={champion.image}
                    alt={champion.name}
                    className={`w-full h-full object-cover rounded-xl ${
                      status?.includes('ban') ? 'grayscale' : ''
                    }`}
                  />
                  
                  {status?.includes('ban') && (
                    <div className="absolute inset-0 bg-red-600/80 rounded-xl flex items-center justify-center">
                      <span className="text-xs font-bold text-white">BAN</span>
                    </div>
                  )}
                  
                  {status?.includes('pick') && (
                    <div className={`absolute inset-0 ${
                      status === 'blue-pick' ? 'bg-blue-600/30' : 'bg-red-600/30'
                    } rounded-xl flex items-center justify-center`}>
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    </div>
                  )}
                  
                  {/* Champion name on hover */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {champion.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 