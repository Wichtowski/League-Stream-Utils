import React from 'react';
import Image from 'next/image';
import { getChampionById } from '@lib/champions';
import { getChampionSquareImage } from './common';
import type { Champion } from '@lib/types';

type TeamBansProps = {
  bans: number[];
  teamColor: 'blue' | 'red';
  isFearlessDraft?: boolean;
  usedChampions?: Champion[];
  hoverState?: {
    isHovering: boolean;
    isSelecting: boolean;
    hoveredChampionId: number | null;
    currentTeam: 'blue' | 'red' | null;
    currentActionType: 'pick' | 'ban' | null;
    currentTurn?: number;
  };
};

const TeamBans: React.FC<TeamBansProps> = ({ bans, teamColor, isFearlessDraft = false, usedChampions = [], hoverState }) => {
  const maxBans = 5; // Maximum number of bans per team
  const banPlaceholder = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2060%2060'%3e%3cdefs%3e%3cstyle%3e.cls-1{fill:%23666;}%3c/style%3e%3c/defs%3e%3ctitle%3eban_placeholder%3c/title%3e%3cg%20id='BG'%3e%3crect%20width='60'%20height='60'%20fill='%23111'/%3e%3c/g%3e%3cg%20id='Top'%3e%3cpath%20class='cls-1'%20d='M30,13A17,17,0,1,0,47,30,17,17,0,0,0,30,13ZM17.64,30A12.37,12.37,0,0,1,37,19.77L19.77,37A12.36,12.36,0,0,1,17.64,30ZM30,42.36a12.36,12.36,0,0,1-6.95-2.13L40.23,23.05A12.37,12.37,0,0,1,30,42.36Z'/%3e%3c/g%3e%3c/svg%3e";
  
  // Check if this team should show hover effect for bans
  const isBanHovering = hoverState?.isHovering && 
    hoverState?.currentTeam === teamColor && 
    hoverState?.currentActionType === 'ban';
  
  // Calculate which ban slot should be animated based on current turn
  const getCurrentBanSlot = (): number => {
    if (!hoverState?.currentTurn || !isBanHovering) return -1;
    
    const currentTurn = hoverState.currentTurn;
    
    // Ban phase 1: turns 0-5 (6 bans total)
    if (currentTurn <= 5) {
      // For blue team: turns 0, 2, 4 (ban slots 0, 1, 2)
      // For red team: turns 1, 3, 5 (ban slots 0, 1, 2)
      if (teamColor === 'blue') {
        return Math.floor(currentTurn / 2); // 0, 1, 2
      } else {
        return Math.floor((currentTurn - 1) / 2); // 0, 1, 2
      }
    }
    
    // Ban phase 2: turns 12-15 (4 bans total)
    if (currentTurn >= 12 && currentTurn <= 15) {
      // For red team: turns 12, 14 (ban slots 3, 4)
      // For blue team: turns 13, 15 (ban slots 3, 4)
      if (teamColor === 'red') {
        return 3 + Math.floor((currentTurn - 12) / 2); // 3, 4
      } else {
        return 3 + Math.floor((currentTurn - 13) / 2); // 3, 4
      }
    }
    
    return -1;
  };
  
  const currentBanSlot = getCurrentBanSlot();
  
  // Get all banned champions (current game + series bans in Fearless Draft)
  const allBannedChampions = [...bans];
  if (isFearlessDraft && usedChampions.length > 0) {
    // Add usedChampions that aren't already in current bans
    usedChampions.forEach(champ => {
      if (!allBannedChampions.includes(champ.id)) {
        allBannedChampions.push(champ.id);
      }
    });
  }
  
  return (
    <div className={`flex ${teamColor === 'blue' ? 'flex-row justify-start' : 'flex-row-reverse justify-end'}`}>
      {Array.from({ length: maxBans }, (_, index) => {
        const championId = bans[index];
        const champ = championId ? getChampionById(championId) : null;
        const isSeriesBan = isFearlessDraft && usedChampions.some(c => c.id === championId);
        
        return (
          <div 
            key={index}
            className={`relative w-16 h-16 overflow-hidden flex items-center justify-center transition-all duration-500 `}
          >
            {champ ? (
              <>
                <Image 
                  src={getChampionSquareImage(championId) || champ.image} 
                  alt={champ.name} 
                  width={64} 
                  height={64} 
                  className={`w-full h-full object-cover ${isSeriesBan ? 'opacity-30' : 'opacity-50'}`}
                />
                {/* Ban placeholder overlay to indicate banned champion */}
                <div className={`absolute inset-0 flex items-center justify-center ${isSeriesBan ? 'bg-gray-900/50' : 'bg-red-900/30'}`}>
                  <Image 
                    src={banPlaceholder} 
                    alt="Ban Placeholder" 
                    width={64} 
                    height={64} 
                    className={`w-full h-full object-cover ${isSeriesBan ? 'opacity-40' : 'opacity-60'}`}
                  />
                </div>
                {/* Series ban indicator */}
                {isSeriesBan && (
                  <div className="absolute top-0 right-0 bg-gray-600 text-white text-xs px-1 rounded-bl">
                    S
                  </div>
                )}
              </>
            ) : (
              <Image 
                src={banPlaceholder} 
                alt="Ban Placeholder" 
                width={64} 
                height={64} 
                className="w-full h-full object-cover opacity-40" 
              />
            )}
            
            {/* Ban placeholder overlay when this slot is being animated */}
            {isBanHovering && currentBanSlot === index && !champ && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Image 
                  src={banPlaceholder} 
                  alt="Ban Placeholder" 
                  width={64} 
                  height={64} 
                  className="w-full h-full object-cover opacity-60" 
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TeamBans; 