'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { ChampSelectTimer, EnhancedChampSelectSession } from '@lib/types';

const formatTime = (ms: number): string => {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
};

interface TournamentHeaderProps {
  tournamentData: EnhancedChampSelectSession['tournamentData'];
  timer: ChampSelectTimer | undefined;
}

const TournamentHeader: React.FC<TournamentHeaderProps> = ({ tournamentData, timer }) => {
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

export default TournamentHeader; 