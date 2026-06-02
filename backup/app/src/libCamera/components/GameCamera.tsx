"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { LiveGameData } from "@libLeagueClient/types";
import { Tournament, Match } from "@libTournament/types";
import { Team } from "@libTeam/types";


interface GameCameraProps {
  gameData: LiveGameData;
  match?: Match;
  tournament?: Tournament;
  blueTeamData?: Team;
  redTeamData?: Team;
}

interface TeamDisplayProps {
  team: Team | null;
  players: any[];
  side: "left" | "right";
  teamColor: "blue" | "red";
}

const TeamDisplay: React.FC<TeamDisplayProps> = ({ team, players, side, teamColor }) => {
  const isLeft = side === "left";
  
  if (!players || players.length === 0) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ x: isLeft ? -100 : 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.1 }}
      className={`absolute ${isLeft ? "left-0" : "right-0"} top-20 w-80 h-full bg-black/80 backdrop-blur-sm border-r-2 ${isLeft ? "border-blue-500" : "border-red-500"}`}
    >
      <div className="p-6 h-full flex flex-col">

      </div>
    </motion.div>
  );
};

export const GameCamera: React.FC<GameCameraProps> = ({
  match,
  blueTeamData,
  redTeamData
}) => {
  if (!gameData || !gameData.allPlayers) {
    return null;
  }

  // Determine which team is on which side based on the current game
  const determineTeamSides = (): { blueTeam: Team | null; redTeam: Team | null; bluePlayers: any[]; redPlayers: any[] } => {
    if (!match) {
      // Fallback: use ORDER/CHAOS teams directly
      const orderPlayers = gameData.allPlayers.filter(p => p.team === "ORDER");
      const chaosPlayers = gameData.allPlayers.filter(p => p.team === "CHAOS");
      return { 
        blueTeam: blueTeamData || null, 
        redTeam: redTeamData || null, 
        bluePlayers: orderPlayers, 
        redPlayers: chaosPlayers 
      };
    }

    // Bind players to match to get proper team assignments
    const bound = bindLivePlayersToMatch(gameData.allPlayers, match);
    const bluePlayers = bound.blue.filter(Boolean).map(bp => bp.livePlayer).filter(Boolean);
    const redPlayers = bound.red.filter(Boolean).map(bp => bp.livePlayer).filter(Boolean);

    // Determine which team is actually on blue side vs red side
    // The bound players are already correctly assigned to blue/red based on match data
    // bluePlayers contains the team that should be on blue side
    // redPlayers contains the team that should be on red side
    
    // Get the current game to determine side assignments
    const currentGame = match.games?.find(game => game.winner === "ongoing");
    
    let blueTeam = blueTeamData || null;
    let redTeam = redTeamData || null;

    // If we have a current game with team assignments, use those
    if (currentGame && typeof currentGame.blueTeam === 'string' && typeof currentGame.redTeam === 'string') {
      // The game has explicit team assignments
      if (currentGame.blueTeam === match.blueTeamId) {
        blueTeam = blueTeamData;
        redTeam = redTeamData;
      } else {
        // Teams are swapped in this game
        blueTeam = redTeamData;
        redTeam = blueTeamData;
      }
    }

    return { blueTeam, redTeam, bluePlayers, redPlayers };
  };

  const { blueTeam, redTeam, bluePlayers, redPlayers } = determineTeamSides();

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Left Side - Blue Team */}
      <TeamDisplay
        team={blueTeam}
        players={bluePlayers}
        side="left"
        teamColor="blue"
      />

      {/* Right Side - Red Team */}
      <TeamDisplay
        team={redTeam}
        players={redPlayers}
        side="right"
        teamColor="red"
      />
    </div>
  );
};
