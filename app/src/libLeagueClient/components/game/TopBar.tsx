import React from "react";
import Image from "next/image";
import { TeamScoreDisplay } from "@libLeagueClient/components/game/TeamScoreDisplay";
import { Team } from "@libTeam/types";
import { Match } from "@libTournament/types";
import { getTeamWins } from "@libLeagueClient/utils/teamWins";

interface TopBarProps {
  orderTeam: Team | null;
  chaosTeam: Team | null;
  orderLogo: string;
  chaosLogo: string;
  blueTeamStats: {
    kills: number;
    towers: number;
    gold: number;
  };
  redTeamStats: {
    kills: number;
    towers: number;
    gold: number;
  };
  orderGoldDiff: number;
  chaosGoldDiff: number;
  towerIcon: string;
  goldIcon: string;
  match: Match;
  tournamentLogo: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  orderTeam,
  chaosTeam,
  orderLogo,
  chaosLogo,
  blueTeamStats,
  redTeamStats,
  orderGoldDiff,
  chaosGoldDiff,
  towerIcon,
  goldIcon,
  match,
  tournamentLogo,
}) => {
  const teamWins = getTeamWins(match?.games || [], match!);
  const showSeriesScore = match?.format !== "BO1";
  
  const getMaxWins = (): number => {
    if (match?.format === "BO5") return 3;
    if (match?.format === "BO3") return 2;
    return 1;
  };
  
  const maxWins = getMaxWins();

  return (
    <div className="flex justify-between items-center h-full px-8">
        {/* Blue Team (Left) */}
        <div className="flex flex-col items-center">
          <TeamScoreDisplay
            logo={orderLogo}
            tag={orderTeam?.tag || "ORDER"}
            kills={blueTeamStats.kills}
            towers={blueTeamStats.towers}
            towerIcon={towerIcon}
            goldDiff={orderGoldDiff}
            goldIcon={goldIcon}
            teamGold={blueTeamStats.gold}
            reverse={true}
            showSeriesScore={showSeriesScore}
            teamWins={teamWins.team1Wins}
            maxWins={maxWins}
          />
        </div>

        {/* Center - Tournament Logo */}
        <div className="flex items-center justify-center w-20 h-full mx-2">
          <Image src={tournamentLogo} alt="Tournament logo" width={64} height={64} className="object-contain" />
        </div>

        {/* Red Team (Right) */}
        <div className="flex flex-col items-center">
          <TeamScoreDisplay
            logo={chaosLogo}
            tag={chaosTeam?.tag || "CHAOS"}
            kills={redTeamStats.kills}
            towers={redTeamStats.towers}
            towerIcon={towerIcon}
            goldDiff={chaosGoldDiff}
            goldIcon={goldIcon}
            teamGold={redTeamStats.gold}
            showSeriesScore={showSeriesScore}
            teamWins={teamWins.team2Wins}
            maxWins={maxWins}
          />
        </div>
      </div>
  );
};
