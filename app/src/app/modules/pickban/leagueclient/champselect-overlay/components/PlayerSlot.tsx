'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { EnhancedChampSelectPlayer } from '@lib/types';
import { getChampionName, getChampionCenteredSplashImage } from './common';
import { PLAYER_CARD_ROLE_ICONS } from '@lib/constants';


// Pick and ban phase configuration - 20 turns total
const PICK_BAN_ORDER: Array<{
    phase: string;
    team: 'blue' | 'red';
    type: 'pick' | 'ban';
}> = [
    // Ban phase 1 (6 bans)
    { phase: 'BAN_1', team: 'blue', type: 'ban' },
    { phase: 'BAN_1', team: 'red', type: 'ban' },
    { phase: 'BAN_1', team: 'blue', type: 'ban' },
    { phase: 'BAN_1', team: 'red', type: 'ban' },
    { phase: 'BAN_1', team: 'blue', type: 'ban' },
    { phase: 'BAN_1', team: 'red', type: 'ban' },

    // Pick phase 1 (6 picks)
    { phase: 'PICK_1', team: 'blue', type: 'pick' },
    { phase: 'PICK_1', team: 'red', type: 'pick' },
    { phase: 'PICK_1', team: 'red', type: 'pick' },
    { phase: 'PICK_1', team: 'blue', type: 'pick' },
    { phase: 'PICK_1', team: 'blue', type: 'pick' },
    { phase: 'PICK_1', team: 'red', type: 'pick' },

    // Ban phase 2 (4 bans)
    { phase: 'BAN_2', team: 'red', type: 'ban' },
    { phase: 'BAN_2', team: 'blue', type: 'ban' },
    { phase: 'BAN_2', team: 'red', type: 'ban' },
    { phase: 'BAN_2', team: 'blue', type: 'ban' },

    // Pick phase 2 (4 picks)
    { phase: 'PICK_2', team: 'red', type: 'pick' },
    { phase: 'PICK_2', team: 'blue', type: 'pick' },
    { phase: 'PICK_2', team: 'blue', type: 'pick' },
    { phase: 'PICK_2', team: 'red', type: 'pick' }
];

interface PlayerSlotProps {
  player: EnhancedChampSelectPlayer;
  index: number;
  teamColor: 'blue' | 'red' | string;
  _currentPhase?: string;
  hoverState?: {
    isHovering: boolean;
    isSelecting: boolean;
    hoveredChampionId: number | null;
    currentTeam: 'blue' | 'red' | null;
    currentActionType: 'pick' | 'ban' | null;
    currentTurn?: number;
  };
}

const PlayerSlot: React.FC<PlayerSlotProps> = ({ player, index, teamColor, _currentPhase, hoverState }) => {
  const image = getChampionCenteredSplashImage(player.championId);
  const isPlaceholder = player.cellId < 0;
  
  const getCurrentPickingPlayerIndex = (): number => {
    if (!hoverState?.currentTurn || hoverState?.currentActionType !== 'pick') {
      return -1;
    }

    const currentTurn = hoverState.currentTurn;
    const currentAction = PICK_BAN_ORDER[currentTurn];
    
    if (!currentAction || currentAction.type !== 'pick' || currentAction.team !== teamColor) {
      return -1;
    }

    // Separate mappings for blue and red teams
    const bluePlayerMapping: Record<number, number> = {
      6: 0,   // Blue first pick
      9: 1,   // Blue second pick
      10: 2,  // Blue third pick
      17: 3,  // Blue fourth pick
      18: 4,  // Blue fifth pick
    };

    const redPlayerMapping: Record<number, number> = {
      7: 0,   // Red first pick
      8: 1,   // Red second pick
      11: 2,  // Red third pick
      16: 3,  // Red fourth pick
      19: 4,  // Red fifth pick
    };

    const mapping = teamColor === 'blue' ? bluePlayerMapping : redPlayerMapping;
    return mapping[currentTurn] ?? -1;
  };

  // Check if this specific player slot should show hover effect
  const isCurrentPickingPlayer = getCurrentPickingPlayerIndex() === index;
  const isCurrentlyPicking = hoverState?.currentActionType === 'pick' && isCurrentPickingPlayer;
  
  // Debug logging
  // console.log('PlayerSlot Debug:', {
  //   teamColor,
  //   index,
  //   currentTurn: hoverState?.currentTurn,
  //   currentActionType: hoverState?.currentActionType,
  //   currentTeam: hoverState?.currentTeam,
  //   isCurrentPickingPlayer,
  //   isCurrentlyPicking,
  //   animationClass: isCurrentlyPicking ? (teamColor === 'blue' ? 'is-picking-blue' : 'is-picking-red') : ''
  // });
  
  return (
    <motion.div 
      key={player.cellId} 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: index * 0.1, duration: 0.6 }} 
      className="relative w-full"
    >
      <div 
        className={`flex-1 h-96 max-h-screen ${teamColor === 'blue' ? 'bg-blue-900/30 border-l border-r border-blue-500/50' : 'bg-red-900/30 border-l border-r border-red-500/50'} ${isPlaceholder ? 'bg-gray-800/50 border-gray-600/50' : ''} overflow-hidden relative flex flex-col justify-end transition-all duration-3000 ${isCurrentlyPicking ? (teamColor === 'blue' ? 'is-picking-blue' : 'is-picking-red') : ''}`}
      >
        {!isPlaceholder && image && image.trim() !== '' ? (
          <Image 
            src={image} 
            alt={getChampionName(player.championId) || player.summonerName || `Player ${index + 1}`} 
            fill
            className="object-cover object-center absolute inset-0 z-0" 
            priority
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-transparent flex items-center justify-center text-gray-500 text-sm z-0">
            {!isPlaceholder && player.role && PLAYER_CARD_ROLE_ICONS[player.role] ? (
            <Image
                src={PLAYER_CARD_ROLE_ICONS[player.role]}
                alt={player.role}
              width={24}
              height={24}
              className="w-full h-full object-contain"
            />
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-2">{isPlaceholder ? '⚪' : '👤'}</div>
                <div className="text-sm">{isPlaceholder ? 'Empty Slot' : 'No Role'}</div>
              </div>
            )}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent z-10" />
        <div className="relative z-20 p-3 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-white truncate">
              {isPlaceholder
                ? 'Empty Slot'
                : (player.summonerName || player.playerInfo?.name || `Player ${index + 1}`)}
            </div>
            {!isPlaceholder && player.role && PLAYER_CARD_ROLE_ICONS[player.role] && (
              <div 
                className="w-6 h-6 flex-shrink-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${PLAYER_CARD_ROLE_ICONS[player.role]})` }}
              />
            )}
          </div>
          <div className={`text-xs ${teamColor === 'blue' ? 'text-blue-300' : 'text-red-300'}`}>
            {isPlaceholder ? 'No Champion' : (getChampionName(player.championId) || 'No Champion Selected')}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerSlot; 