import React from "react";
import { SafeImage } from "@lib/components/common/SafeImage";
import { GameEvent } from "@libLeagueClient/types";

interface SubTopBarProps {
  gameTime: number;
  formatGameTime: (seconds: number) => string;
  blueTeamDragons: GameEvent[];
  redTeamDragons: GameEvent[];
  dragonIcons: { [key: string]: string };
}

export const SubTopBar: React.FC<SubTopBarProps> = ({
  gameTime,
  formatGameTime,
  blueTeamDragons,
  redTeamDragons,
  dragonIcons,
}) => {
  const getDragonIcon = (dragonType: string): string => {
    switch (dragonType) {
      case "Earth":
        return dragonIcons.mountain;
      case "Elder":
        return dragonIcons.elder;
      case "Fire":
        return dragonIcons.infernal;
      case "Water":
        return dragonIcons.ocean;
      case "Air":
        return dragonIcons.cloud;
      case "Chemtech":
        return dragonIcons.chemtech;
      case "Hextech":
        return dragonIcons.hextech;
      default:
        return dragonIcons.infernal;
    }
  };

  const renderDragonIcons = (dragons: GameEvent[], _teamColor: "blue" | "red"): React.ReactNode => {
    // Filter out elder dragons as they will be used elsewhere
    const filteredDragons = dragons.filter(dragon => dragon.DragonType !== "Elder");

    if (filteredDragons.length === 0) {
      return null; // Don't show anything if no dragons
    }

    return (
      <div className="flex flex-row-reverse gap-1 bg-black/90 w-full">
        {filteredDragons.map((dragon, index) => (
          <SafeImage
            key={`${dragon.DragonType}-${index}`}
            src={getDragonIcon(dragon.DragonType || "")}
            alt={`${dragon.DragonType} dragon`}
            width={26}
            height={26}
            className="rounded-sm"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex items-center justify-center relative w-full bg-black/90">
      {/* Blue Team Dragons - Left side */}
      <div className="flex items-center justify-start flex-1 pr-4">
        {renderDragonIcons(blueTeamDragons, "blue")}
      </div>
      
      {/* Center - Timer */}
      <div className="flex items-center justify-center px-4">
        <div className="text-3xl font-bold text-white font-mono">
          {formatGameTime(gameTime)}
        </div>
      </div>
      
      {/* Red Team Dragons - Right side */}
      <div className="flex items-center justify-start flex-1 pl-4">
        {renderDragonIcons(redTeamDragons, "red")}
      </div>
      
      {/* Debug info - remove this later */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
        Blue: {blueTeamDragons.length} | Red: {redTeamDragons.length}
      </div>
    </div>
  );
};
