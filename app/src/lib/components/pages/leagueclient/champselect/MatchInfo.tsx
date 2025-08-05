import React from 'react';
import Image from 'next/image';
import type { PickbanTournamentTeam } from '@lib/types';
import { ProgressBar } from './ProgressBar';

type MatchInfoProps = {
  blueTeam: PickbanTournamentTeam;
  redTeam: PickbanTournamentTeam;
  timer: number;
  maxTimer: number;
  tournamentLogo: string;
  isBO3?: boolean;
  isBO5?: boolean;
  blueScore?: number;
  redScore?: number;
  gameVersion?: string;
};

const MatchInfoComponent: React.FC<MatchInfoProps> = ({ 
  blueTeam, 
  redTeam, 
  timer, 
  maxTimer, 
  tournamentLogo,
  isBO3 = false, 
  isBO5 = false, 
  blueScore = 0, 
  redScore = 0,
  gameVersion = '25.13'
}) => {
  const progress = (timer / maxTimer) * 100;
  const showScores = isBO3 || isBO5;
  
  return (
    <div className="flex flex-col items-center justify-end min-w-[200px] max-w-[300px]">
      <div className="bg-black/70 rounded-lg p-4 flex flex-col items-center">
        {/* Team Logos and Tournament Logo */}
                  <div className="flex items-center gap-2 mb-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden">
              <Image src={blueTeam.logo} alt={blueTeam.name} width={48} height={48} className="w-full h-full object-cover" />
            </div>
          
          <div className="flex flex-col items-center">
            <div className="text-white text-2xl font-bold mb-2">VS</div>
            {showScores && (
              <div className="flex items-center gap-2 text-white text-lg font-semibold">
                <span>{blueScore}</span>
                <span>-</span>
                <span>{redScore}</span>
              </div>
            )}
          </div>
          
          <div className="w-12 h-12 rounded-lg overflow-hidden">
            <Image src={redTeam.logo} alt={redTeam.name} width={48} height={48} className="w-full h-full object-cover" />
          </div>
        </div>
        
        {/* Tournament Logo */}
        <div className="w-16 h-16 rounded-lg overflow-hidden mb-3">
          <Image src={"/assets/" + tournamentLogo || "/VML-Nexus-Cup-logo.png"} alt="Tournament" width={64} height={64} className="w-full h-full object-cover" />
        </div>
        
        <ProgressBar progress={progress} />

        <div className="text-gray-300 text-sm">PATCH {gameVersion}</div>
      </div>
    </div>
  );
};

const MatchInfo = React.memo(MatchInfoComponent);

export { MatchInfo }; 