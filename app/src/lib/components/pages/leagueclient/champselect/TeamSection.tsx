'use client';

import React from 'react';
import type { EnhancedChampSelectPlayer } from '@lib/types';
import { PlayerSlot } from './PlayerSlot';
import { TeamColors } from '@lib/types/tournament';

interface TeamSectionProps {
    team: EnhancedChampSelectPlayer[];
    teamColor: 'blue' | 'red' | string;
    bans: {
        blueTeamBans: number[];
        redTeamBans: number[];
    };
    currentPhase?: string;
    hoverState?: {
        isHovering: boolean;
        isSelecting: boolean;
        hoveredChampionId: number | null;
        currentTeam: 'blue' | 'red' | null;
        currentActionType: 'pick' | 'ban' | null;
        currentTurn?: number;
    };
    tournamentData?: {
        blueTeam?: { colors?: TeamColors };
        redTeam?: { colors?: TeamColors };
    };
}

const TeamSection: React.FC<TeamSectionProps> = ({ team, teamColor, currentPhase, hoverState, tournamentData }) => {
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
            <div className="flex flex-row items-end w-full max-h-screen">
                {fullTeam.map((player, index) => (
                    <PlayerSlot
                        key={player.cellId}
                        player={player}
                        index={index}
                        teamColor={tournamentData?.blueTeam?.colors?.primary || teamColor}
                        _currentPhase={currentPhase}
                        hoverState={hoverState}
                    />
                ))}
            </div>
        </div>
    );
};

export { TeamSection };
