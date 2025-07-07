'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { EnhancedChampSelectPlayer } from '@lib/types';
import { getChampionName, getChampionCenteredSplashImage } from './common';

const rolePrefix = `data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20308%20560'%3e%3cdefs%3e%3cstyle%3e.cls-1{fill:`

const roleIcons: Record<string, string> = {
  TOP: `${rolePrefix}%23666;}.cls-2{fill:%23fff;}%3c/style%3e%3c/defs%3e%3ctitle%3etop_splash_placeholder%3c/title%3e%3cg%20id='Top'%3e%3crect%20class='cls-1'%20x='145'%20y='187'%20width='24'%20height='24'/%3e%3cpolygon%20class='cls-1'%20points='186%20175.81%20186%20228%20133.3%20228%20121.18%20240%20198%20240%20198%20163.93%20186%20175.81'/%3e%3cpolygon%20class='cls-2'%20points='130%20219%20130%20172%20177%20172%20192%20157%20115%20157%20115%20234%20130%20219'/%3e%3c/g%3e%3c/svg%3e`,
  JUNGLE: `${rolePrefix}%23fff;}%3c/style%3e%3c/defs%3e%3ctitle%3ejung_splash_placeholder%3c/title%3e%3cg%20id='Top'%3e%3cpath%20class='cls-1'%20d='M127,217l25.5,24,6-7.5s6-37.5-27-76.5c7.5,21,12,42,12,51-6-13.5-21-25.5-27-27C127,193,127,217,127,217Z'/%3e%3cpath%20class='cls-1'%20d='M155.5,188.5s7.5-21,21-31.5C172,169,165,187.5,162,210A90.81,90.81,0,0,0,155.5,188.5Z'/%3e%3cpath%20class='cls-1'%20d='M163,230l13-14s4-23.5,14.5-34C178.5,188,163,206,163,230Z'/%3e%3c/g%3e%3c/svg%3e`,
  MID: `${rolePrefix}%23fff;}.cls-2{fill:%23666;}%3c/style%3e%3c/defs%3e%3ctitle%3emid_splash_placeholder%3c/title%3e%3cg%20id='Top'%3e%3cpolygon%20class='cls-1'%20points='180%20157%20115%20222%20115%20240%20133%20240%20198%20175%20198%20157%20180%20157'/%3e%3cpolygon%20class='cls-2'%20points='127%20200.89%20127%20169%20158.89%20169%20170.89%20157%20115%20157%20115%20212.89%20127%20200.89'/%3e%3cpolygon%20class='cls-2'%20points='186%20196.11%20186%20228%20154.11%20228%20142.11%20240%20198%20240%20198%20184.11%20186%20196.11'/%3e%3c/g%3e%3c/svg%3e`,
  ADC: `${rolePrefix}%23666;}.cls-2{fill:%23fff;}%3c/style%3e%3c/defs%3e%3ctitle%3ebot_splash_placeholder%3c/title%3e%3cg%20id='Ebene_2'%20data-name='Ebene%202'%3e%3crect%20class='cls-1'%20x='144'%20y='186'%20width='24'%20height='24'%20transform='translate(312%20396)%20rotate(180)'/%3e%3cpolygon%20class='cls-1'%20points='127%20221.19%20127%20169%20179.7%20169%20191.82%20157%20115%20157%20115%20233.07%20127%20221.19'/%3e%3c/g%3e%3cg%20id='Top'%3e%3cpolygon%20class='cls-2'%20points='183%20178%20183%20225%20136%20225%20121%20240%20198%20240%20198%20163%20183%20178'/%3e%3c/g%3e%3c/svg%3e`,
  SUPPORT: `${rolePrefix}%23fff;}%3c/style%3e%3c/defs%3e%3ctitle%3esup_splash_placeholder%3c/title%3e%3cg%20id='Top'%3e%3cpath%20class='cls-1'%20d='M166.28,182.11,172.91,202l18.21-3.31-11.59-13.25s14.91-1.65,31.47-13.25H174.56Z'/%3e%3cpath%20class='cls-1'%20d='M149.72,182.11,143.09,202l-18.22-3.31,11.6-13.25s-14.91-1.65-31.47-13.25h36.44Z'/%3e%3cpolygon%20class='cls-1'%20points='161.31%20185.42%20158%20187.08%20154.69%20185.42%20143.09%20233.45%20158%20243.39%20172.91%20233.45%20161.31%20185.42'/%3e%3cpolygon%20class='cls-1'%20points='141.44%20160.58%20158%20182.11%20174.56%20160.58%20169.59%20155.61%20146.41%20155.61%20141.44%20160.58'/%3e%3c/g%3e%3c/svg%3e`
};

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
  teamColor: 'blue' | 'red';
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
            unoptimized 
            priority
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-transparent flex items-center justify-center text-gray-500 text-sm z-0">
            {!isPlaceholder && player.role && roleIcons[player.role] ? (
            <Image
                src={roleIcons[player.role]}
                alt={player.role}
              width={24}
              height={24}
              className="w-full h-full object-contain"
              unoptimized
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
              {isPlaceholder ? 'Empty Slot' : (player.playerInfo?.name || player.summonerName || `Player ${index + 1}`)}
            </div>
            {!isPlaceholder && player.role && roleIcons[player.role] && (
              <div 
                className="w-6 h-6 flex-shrink-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${roleIcons[player.role]})` }}
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