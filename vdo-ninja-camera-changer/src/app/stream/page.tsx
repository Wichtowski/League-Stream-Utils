'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

type Player = {
  name: string;
  url: string;
  imagePath: string;
};

export default function Stream() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<number>(0);
  const [previousPlayers, setPreviousPlayers] = useState<number[]>([]);
  const [cyclesSinceShown, setCyclesSinceShown] = useState<number[]>([]);
  const [streamFailed, setStreamFailed] = useState(false);
  const [autoSwitch, setAutoSwitch] = useState(true);
  const switchInterval = 5; // seconds
  const FORCE_SHOW_THRESHOLD = 6; // Force show after 6 cycles

  useEffect(() => {
    if (view) {
      const teamIndex = view === 'team1' ? 0 : 1;
      fetch('/teams.json')
        .then(res => res.json())
        .then(teams => {
          if (teams[teamIndex]) {
            setPlayers(teams[teamIndex].players);
            setCyclesSinceShown(new Array(teams[teamIndex].players.length).fill(0));
          }
        })
        .catch(error => {
          console.error('Error loading teams:', error);
        });
    }
  }, [view]);

  const getRandomPlayer = () => {
    if (players.length <= 1) return 0;
    
    // Check if any player needs to be forced
    const playersNeedingForce = cyclesSinceShown
      .map((cycles, index) => ({ cycles, index }))
      .filter(({ cycles }) => cycles >= FORCE_SHOW_THRESHOLD);

    if (playersNeedingForce.length > 0) {
      // Randomly select from players that need to be forced
      const randomForced = playersNeedingForce[Math.floor(Math.random() * playersNeedingForce.length)];
      return randomForced.index;
    }

    // Get all players except the last two shown
    let availableIndices = Array.from({ length: players.length }, (_, i) => i)
      .filter(i => !previousPlayers.includes(i));

    // If we have no available players (all were recent), allow all except current
    if (availableIndices.length === 0) {
      availableIndices = Array.from({ length: players.length }, (_, i) => i)
        .filter(i => i !== currentPlayer);
    }

    // Ensure we always have at least one option
    if (availableIndices.length === 0 && players.length > 1) {
      availableIndices = Array.from({ length: players.length }, (_, i) => i)
        .filter(i => i !== currentPlayer);
    }

    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoSwitch && players.length > 0) {
      interval = setInterval(() => {
        const nextPlayer = getRandomPlayer();
        
        // Update previous players
        setPreviousPlayers(prev => {
          const updated = [...prev];
          if (!updated.includes(nextPlayer)) {
            updated.unshift(nextPlayer);
            if (updated.length > 2) updated.pop();
          }
          return updated;
        });

        // Update cycles since shown
        setCyclesSinceShown(prev => 
          prev.map((count, index) => 
            index === nextPlayer ? 0 : count + 1
          )
        );

        setCurrentPlayer(nextPlayer);
        setStreamFailed(false);
      }, switchInterval * 1000);
    }
    return () => clearInterval(interval);
  }, [autoSwitch, players.length, currentPlayer, previousPlayers, cyclesSinceShown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt + 1-5
      if (e.altKey && e.key >= '1' && e.key <= '5') {
        const playerIndex = parseInt(e.key) - 1;
        if (playerIndex >= 0 && playerIndex < players.length) {
          setCurrentPlayer(playerIndex);
          setPreviousPlayers(prev => [playerIndex, ...prev].slice(0, 2));
          // Reset cycles for manually selected player
          setCyclesSinceShown(prev => 
            prev.map((count, index) => 
              index === playerIndex ? 0 : count
            )
          );
          setStreamFailed(false);
          setAutoSwitch(false);
        }
      }
      // Space to toggle auto-switch
      if (e.code === 'Space') {
        e.preventDefault();
        setAutoSwitch(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [players.length]);

  const handleStreamError = () => {
    setStreamFailed(true);
  };

  if (!view) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <h1 className="text-white text-2xl">No view specified</h1>
      </div>
    );
  }

  const currentPlayerData = players[currentPlayer];

  return (
    <div className="min-h-screen bg-black">
      <div className="relative w-full aspect-video">
        {currentPlayerData?.url && !streamFailed ? (
          <iframe
            src={currentPlayerData.url}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            onError={handleStreamError}
          />
        ) : currentPlayerData?.imagePath ? (
          <Image
            src={currentPlayerData.imagePath}
            alt={currentPlayerData.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <p className="text-gray-400">No stream or fallback available</p>
          </div>
        )}
        
        <div className="absolute top-0 left-0 right-0">
          <div className="bg-gradient-to-b from-black/90 via-black/50 to-transparent h-32 w-full">
            <div className="flex justify-center pt-8">
              <h2 className="text-6xl font-bold text-white">
                {currentPlayerData?.name || `Player ${currentPlayer + 1}`}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 