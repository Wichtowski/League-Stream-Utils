import React, { useEffect } from "react";
import { SafeImage } from "@lib/components/common/SafeImage";
import { ProgressBar } from "./ProgressBar";

// Generic team type that works with both PickbanTournamentTeam and MatchTeam
type TeamWithLogo = {
  name: string;
  logo?: string;
};

type MatchInfoProps = {
  blueTeam: TeamWithLogo;
  redTeam: TeamWithLogo;
  timer: number;
  maxTimer: number;
  tournamentLogo: string;
  isBO3?: boolean;
  isBO5?: boolean;
  blueScore?: number;
  redScore?: number;
  gameVersion?: string;
  onRegisterImages?: (urls: string[]) => void;
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
  gameVersion = "25.13",
  onRegisterImages
}) => {
  const progress = (timer / maxTimer) * 100;
  const showScores = isBO3 || isBO5;

  // Register images with parent component
  useEffect(() => {
    if (onRegisterImages) {
      const urls: string[] = [];
      
      // Add team logos
      if (blueTeam.logo && blueTeam.logo.trim()) urls.push(blueTeam.logo);
      if (redTeam.logo && redTeam.logo.trim()) urls.push(redTeam.logo);
      if (tournamentLogo && tournamentLogo.trim()) urls.push(tournamentLogo);
      
      onRegisterImages(urls);
    }
  }, [blueTeam.logo, redTeam.logo, tournamentLogo, onRegisterImages]);

  return (
    <div className="flex flex-col items-center justify-end min-w-[200px] max-w-[300px]">
      <div className="bg-black/70 rounded-lg p-4 flex flex-col items-center">
        {/* Team Logos and Tournament Logo */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden">
            {blueTeam.logo && blueTeam.logo.trim() ? (
              <SafeImage
                src={blueTeam.logo}
                alt={blueTeam.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{blueTeam.name}</span>
              </div>
            )}
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
            {redTeam.logo && redTeam.logo.trim() ? (
              <SafeImage
                src={redTeam.logo}
                alt={redTeam.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{redTeam.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tournament Logo */}
        <div className="w-full h-full rounded-lg overflow-hidden mb-3">
          {tournamentLogo && tournamentLogo.trim() ? (
            <SafeImage
              src={tournamentLogo}
              alt="Tournament"
              width={100}
              height={100}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Tournament</span>
            </div>
          )}
        </div>

        <ProgressBar progress={progress} />

        <div className="text-gray-300 text-sm">PATCH {gameVersion}</div>
      </div>
    </div>
  );
};

const MatchInfo = React.memo(MatchInfoComponent);

export { MatchInfo };
