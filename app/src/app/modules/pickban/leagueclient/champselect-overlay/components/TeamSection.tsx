'use client';

import React from 'react';
import type { EnhancedChampSelectPlayer } from '@lib/types';
import PlayerSlot from './PlayerSlot';
import TeamBans from './TeamBans';

interface TeamSectionProps {
  team: EnhancedChampSelectPlayer[];
  teamColor: 'blue' | 'red';
  bans: {
    blueTeamBans: number[];
    redTeamBans: number[];
  };
  currentPhase?: string;
  timer?: {
    adjustedTimeLeftInPhase: number;
    totalTimeInPhase: number;
    phase: string;
  };
  hoverState?: {
    isHovering: boolean;
    isSelecting: boolean;
    hoveredChampionId: number | null;
    currentTeam: 'blue' | 'red' | null;
    currentActionType: 'pick' | 'ban' | null;
    currentTurn?: number;
  };
}

const TeamSection: React.FC<TeamSectionProps> = ({ team, bans, teamColor, currentPhase, timer, hoverState }) => {
  // Create a full team array with placeholder players if needed
  const fullTeam = [...team];
  while (fullTeam.length < 5) {
    fullTeam.push({
      cellId: -fullTeam.length, // Negative to avoid conflicts with real cellIds
      championId: 0,
      summonerId: 0,
      summonerName: `Player ${fullTeam.length + 1}`,
      puuid: '',
      isBot: false,
      isActingNow: false,
      pickTurn: 0,
      banTurn: 0,
      team: teamColor === 'blue' ? 100 : 200
    } as EnhancedChampSelectPlayer);
  }

  return (
    <div className="w-full">
      <div className={`flex items-center gap-4 mb-6 ${teamColor === 'red' ? 'justify-end' : 'justify-start'}`}>
        <TeamBans bans={teamColor === 'blue' ? bans.blueTeamBans : bans.redTeamBans} teamColor={teamColor} hoverState={hoverState} />
      </div>
      
      {/* Timer - full width between bans and players */}
      {timer && (
        <div className="w-full mb-4">
          <div className={`w-full h-2 rounded-full overflow-hidden ${teamColor === 'blue' ? 'bg-blue-900/50' : 'bg-red-900/50'}`}>
            <div 
              className={`h-full transition-all duration-1000 ${teamColor === 'blue' ? 'bg-blue-500' : 'bg-red-500'}`}
              style={{ 
                width: `${Math.max(0, (timer.adjustedTimeLeftInPhase / timer.totalTimeInPhase) * 100)}%` 
              }}
            />
          </div>
          <div className="text-center mt-2">
            <div className={`text-lg font-bold ${teamColor === 'blue' ? 'text-blue-300' : 'text-red-300'}`}>
              {timer.adjustedTimeLeftInPhase}s
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-row items-end w-full max-h-screen">
        {fullTeam.map((player, index) => (
          <PlayerSlot key={player.cellId} player={player} index={index} teamColor={teamColor} _currentPhase={currentPhase} hoverState={hoverState} />
        ))}
      </div>
    </div>
  );
};

export default TeamSection; 