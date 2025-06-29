'use client';

import React from 'react';
import { useChampSelectData } from '@lib/hooks/useChampSelectData';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { EnhancedChampSelectPlayer, PickbanTournamentTeam } from '@lib/types';

const roleIcons: Record<string, string> = {
  TOP: '⚔️',
  JUNGLE: '🌲',
  MID: '✨',
  ADC: '🏹',
  SUPPORT: '🛡️'
};

const formatTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
};

const getChampionName = (championId: number): string => {
  // TODO: Replace with actual champion lookup if available
  return championId ? `Champion ${championId}` : '';
};

const getChampionImage = (championId: number): string | null => {
  // TODO: Replace with actual champion image lookup if available
  return championId ? `/assets/champions/${championId}.png` : null;
};

const renderBanPhases = (bans: { myTeamBans: number[]; theirTeamBans: number[] }) => {
  const allBans = [...(bans?.myTeamBans || []), ...(bans?.theirTeamBans || [])];
  const banRows = [];
  for (let i = 0; i < Math.ceil(allBans.length / 5); i++) {
    banRows.push(allBans.slice(i * 5, (i + 1) * 5));
  }
  return (
    <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="w-full mb-8">
      <div className="space-y-2">
        {banRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {Array.from({ length: 5 }, (_, i) => {
              const championId = row[i];
              const image = getChampionImage(championId);
              return (
                <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: (rowIndex * 5 + i) * 0.05, duration: 0.4 }} className="w-16 h-16 bg-gray-900/80 rounded-lg border-2 border-gray-600 overflow-hidden relative backdrop-blur-sm">
                  {image ? (
                    <>
                      <Image src={image} alt={getChampionName(championId)} width={64} height={64} className="w-full h-full object-cover grayscale" />
                      <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                        <span className="text-white text-lg font-bold">✕</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Ban</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const renderTournamentHeader = (tournamentData: any, timer: any) => {
  if (!tournamentData?.tournament) return null;
  const { tournament } = tournamentData;
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} className="text-center mb-6">
      <div className="flex items-center justify-center gap-4 mb-4">
        {tournament.logoUrl && <Image src={tournament.logoUrl} alt={tournament.name} width={80} height={80} className="rounded-lg" />}
        <div>
          <h1 className="text-4xl font-bold text-white">{tournament.name}</h1>
          {tournament.matchInfo && <p className="text-xl text-gray-300">{tournament.matchInfo.roundName} - Match {tournament.matchInfo.matchNumber} (BO{tournament.matchInfo.bestOf})</p>}
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-white mb-2">PATCH 15.4</div>
        {timer && <div className="text-3xl font-mono text-yellow-400">{timer.isInfinite ? '∞' : formatTime(timer.adjustedTimeLeftInPhase || 0)}</div>}
      </div>
    </motion.div>
  );
};

const renderPlayerSlot = (player: EnhancedChampSelectPlayer, index: number, teamColor: 'blue' | 'red') => {
  const image = getChampionImage(player.championId);
  return (
    <motion.div key={player.cellId} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.1, duration: 0.6 }} className="relative">
      <div className={`flex items-center p-4 rounded-lg backdrop-blur-sm border-2 ${teamColor === 'blue' ? 'bg-blue-900/30 border-blue-500/50' : 'bg-red-900/30 border-red-500/50'}`}>
        <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-gray-600">
          {player.profileImage ? (
            <Image src={player.profileImage} alt={player.playerInfo?.name || player.summonerName} width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs">{player.playerInfo?.name?.charAt(0) || player.summonerName?.charAt(0) || (index + 1).toString()}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-semibold text-white truncate">{player.playerInfo?.name || player.summonerName || `Player ${index + 1}`}</span>
            {player.role && <span className="text-sm opacity-70">{roleIcons[player.role] || ''} {player.role}</span>}
          </div>
          <div className={`text-sm ${teamColor === 'blue' ? 'text-blue-300' : 'text-red-300'}`}>{getChampionName(player.championId) || 'No Champion Selected'}</div>
        </div>
        <div className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${teamColor === 'blue' ? 'border-blue-400' : 'border-red-400'} flex-shrink-0`}>
          {image ? (
            <Image src={image} alt={getChampionName(player.championId)} width={80} height={80} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-500 text-sm">{index + 1}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const renderTeamSection = (team: EnhancedChampSelectPlayer[], teamData: PickbanTournamentTeam, teamColor: 'blue' | 'red') => {
  const slideDirection = teamColor === 'blue' ? -100 : 100;
  return (
    <motion.div initial={{ x: slideDirection, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className={`w-full max-w-md space-y-3`}>
      <div className="flex items-center gap-4 mb-6">
        <Image src={teamData.logo} alt={teamData.name} width={60} height={60} className="rounded-lg" />
        <div>
          <h2 className={`text-2xl font-bold ${teamColor === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>{teamData.name}</h2>
          <p className="text-gray-300 text-sm">{teamData.tag}</p>
        </div>
      </div>
      <div className="space-y-3">
        {team.map((player, index) => renderPlayerSlot(player, index, teamColor))}
      </div>
      {teamData.coach && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className={`mt-6 p-3 rounded-lg backdrop-blur-sm border ${teamColor === 'blue' ? 'bg-blue-900/20 border-blue-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-1">COACHES</div>
            <div className="font-semibold text-white">{teamData.coach.name}</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

const ChampSelectOverlayPage: React.FC = () => {
  const { data, loading, error } = useChampSelectData();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading champion select data...</div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-red-400">{error}</div>;
  }
  if (!data) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Waiting for Champion Select...</div>;
  }

  const { myTeam, theirTeam, tournamentData, bans, timer } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 p-8">
        {renderBanPhases(bans)}
        {renderTournamentHeader(tournamentData, timer)}
        <div className="flex justify-between items-start gap-8 max-w-7xl mx-auto">
          <div className="flex-1 flex justify-start">{tournamentData && renderTeamSection(myTeam, tournamentData.blueTeam, 'blue')}</div>
          <div className="flex-1 flex justify-end">{tournamentData && renderTeamSection(theirTeam, tournamentData.redTeam, 'red')}</div>
        </div>
      </div>
    </div>
  );
};

export default ChampSelectOverlayPage;