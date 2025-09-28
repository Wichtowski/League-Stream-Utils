import React, { useEffect } from "react";
import { SafeImage } from "@lib/components/common/SafeImage";
import { GameResult } from "@libTournament/types";
import { getTeamWins } from "@libLeagueClient/utils/teamWins";

// Generic team type that works with both PickbanTournamentTeam and MatchTeam
type TeamWithLogo = {
  name: string;
  logo?: string;
  _id?: string;
};

type MatchInfoProps = {
  blueTeam: TeamWithLogo;
  redTeam: TeamWithLogo;
  tournamentLogo: string;
  matchFormat: string;
  // Games array to calculate scores dynamically
  games?: GameResult[];
  // Current game side assignment
  currentGameSides?: {
    blueTeamId: string;
    redTeamId: string;
  };
  patchVersion?: string;
  onRegisterImages?: (urls: string[]) => void;
  animated?: boolean;
};

const MatchInfoComponent: React.FC<MatchInfoProps> = ({
  blueTeam,
  redTeam,
  tournamentLogo,
  matchFormat,
  games,
  currentGameSides,
  patchVersion = "25.13",
  onRegisterImages,
  animated = false
}) => {
  const showScores = matchFormat !== "BO1";

  // Determine number of rectangles based on format
  const getMaxWins = (): number => {
    if (matchFormat === "BO5") return 3; // Best of 5: first to 3 wins
    if (matchFormat === "BO3") return 2; // Best of 3: first to 2 wins
    return 1; // Single game
  };

  const maxWins = getMaxWins();

  // Calculate team wins using the same logic as match detail page
  const teamWins = getTeamWins(games || []);

  // Determine which team is currently on which side for this game
  const getCurrentGameTeamInfo = () => {
    if (!currentGameSides) {
      // Fallback to original blue/red assignment if no side switching data
      return {
        leftTeam: blueTeam,
        rightTeam: redTeam,
        leftScore: teamWins.team1Wins,
        rightScore: teamWins.team2Wins,
        leftSide: "blue",
        rightSide: "red"
      };
    }

    // Teams can switch sides, so determine current assignment
    const isBlueTeamOnLeft = currentGameSides.blueTeamId === blueTeam._id;

    if (isBlueTeamOnLeft) {
      return {
        leftTeam: blueTeam,
        rightTeam: redTeam,
        leftScore: teamWins.team1Wins,
        rightScore: teamWins.team2Wins,
        leftSide: "blue",
        rightSide: "red"
      };
    } else {
      // Teams have switched sides
      return {
        leftTeam: redTeam,
        rightTeam: blueTeam,
        leftScore: teamWins.team2Wins,
        rightScore: teamWins.team1Wins,
        leftSide: "red",
        rightSide: "blue"
      };
    }
  };

  const currentGameInfo = getCurrentGameTeamInfo();

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
    <div
      className={`h-full flex h-80 flex-col items-center justify-center transition-all duration-500 ${animated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"}`}
    >
      <div className="p-4 pd-0 h-80 flex flex-col items-center bg-black">
        {/* Team Logos and Score Rectangles */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex flex-col items-center">
            {/* Score Rectangles for Left Team */}
            {showScores && (
              <div className="flex gap-1 mb-4">
                {Array.from({ length: maxWins }, (_, index) => (
                  <div
                    key={index}
                    className={`score-rectangle ${
                      index < currentGameInfo.leftScore ? "score-rectangle-point" : "score-rectangle-empty"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Left Team Logo */}
            <div className="w-24 h-24 rounded-lg overflow-hidden">
              {currentGameInfo.leftTeam.logo && currentGameInfo.leftTeam.logo.trim() ? (
                <SafeImage
                  src={currentGameInfo.leftTeam.logo}
                  alt={currentGameInfo.leftTeam.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{currentGameInfo.leftTeam.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center">
            {/* Score Rectangles for Right Team */}
            {showScores && (
              <div className="flex gap-1 mb-4">
                {Array.from({ length: maxWins }, (_, index) => (
                  <div
                    key={index}
                    className={`score-rectangle ${
                      index < currentGameInfo.rightScore ? "score-rectangle-point" : "score-rectangle-empty"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Right Team Logo */}
            <div className="w-24 h-24 rounded-lg overflow-hidden">
              {currentGameInfo.rightTeam.logo && currentGameInfo.rightTeam.logo.trim() ? (
                <SafeImage
                  src={currentGameInfo.rightTeam.logo}
                  alt={currentGameInfo.rightTeam.name}
                  width={244}
                  height={24}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{currentGameInfo.rightTeam.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tournament Logo */}
        <div className="w-64 h-64 rounded-lg mb-3 h-[128px] w-[128px] flex items-center justify-center">
          {tournamentLogo && tournamentLogo.trim() ? (
            <SafeImage src={tournamentLogo} alt="Tournament" priority width={100} height={100} className="" />
          ) : (
            <div className="w-full h-full bg-gray-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Tournament</span>
            </div>
          )}
        </div>

        <div className="text-gray-300 text-sm">PATCH {patchVersion}</div>
      </div>
    </div>
  );
};

const MatchInfo = React.memo(MatchInfoComponent);

export { MatchInfo };
