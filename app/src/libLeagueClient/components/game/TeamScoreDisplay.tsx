import React from "react";
import Image from "next/image";

interface GoldDisplayProps {
  goldDiff: number;
  goldIcon: string;
  teamGold: number;
}

const GoldDisplay: React.FC<GoldDisplayProps> = ({ goldDiff, goldIcon, teamGold }) => {
  return (
    <div className="text-center flex flex-row items-center space-x-2">
      <Image src={goldIcon} alt="Gold" width={48} height={48} />
      <div className="text-lg font-bold text-green-400 flex flex-col items-center">
        <div className="text-lg font-bold text-green-400">{(teamGold / 1000).toFixed(1)}K</div>
        {goldDiff > 2000 && <div className="text-xs text-green-400">+{(goldDiff / 1000).toFixed(1)}K</div>}
      </div>
    </div>
  );
};

interface TeamScoreDisplayProps extends GoldDisplayProps {
  logo: string;
  tag: string;
  kills: number;
  towers: number;
  towerIcon: string;
  reverse?: boolean;
}

export const TeamScoreDisplay: React.FC<TeamScoreDisplayProps> = ({
  logo,
  tag,
  kills,
  towers,
  towerIcon,
  goldDiff,
  goldIcon,
  teamGold,
  reverse = false
}) => {
  return (
    <div className={`flex items-center gap-12 ${reverse ? "flex-row-reverse" : "flex-row"}`}>
      <div className="text-center">
        <div className="text-5xl font-bold text-white font-mono">{kills}</div>
      </div>
      <GoldDisplay goldDiff={goldDiff} goldIcon={goldIcon} teamGold={teamGold} />
      <div className="flex flex-row space-x-4 text-center">
        <div className="flex flex-col items-center ">
          <Image src={towerIcon} alt="Tower" width={16} height={16} />
          <div className="text-lg font-bold text-yellow-400">{towers}</div>
        </div>
      </div>
      <div className="text-center">
        <Image src={logo} alt="Team Logo" width={48} height={48} />
        <div className={`text-xl font-bold`}>{tag}</div>
      </div>
    </div>
  );
};
