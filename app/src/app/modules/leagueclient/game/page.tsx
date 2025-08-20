"use client";

import React, { useEffect, useState } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { GameDataDisplay } from "@libLeagueClient/components/game/GameDataDisplay";
import { useGameData } from "@lib/hooks/useGameData";
import { tournamentStorage } from "@lib/services/tournament";
import { matchStorage } from "@lib/services/match/match-storage";
import { Tournament, Match } from "@lib/types";

const LiveGamePage: React.FC = () => {
  const { setActiveModule } = useNavigation();
  const {
    gameData,
    isConnected,
    isLoading
  } = useGameData();
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  // Show nothing if loading, not connected, or no game data
  useEffect(() => {
    setActiveModule(null);
    const init = async (): Promise<void> => {
      const lastSelectedTournament = await tournamentStorage.getLastSelectedTournament();
      const lastSelectedMatch = await matchStorage.getLastSelectedMatch();
      if (lastSelectedTournament?.tournamentId) {
        const tournament = await fetch(`/api/v1/tournaments/${lastSelectedTournament.tournamentId}`);
        const tournamentData = await tournament.json() as Tournament;
        setCurrentTournament(tournamentData);
      }
      if (lastSelectedMatch?.matchId) {
        const match = await fetch(`/api/v1/matches/${lastSelectedMatch.matchId}`);
        const matchData = await match.json() as Match;
        setCurrentMatch(matchData);
      }
    };
    init();
  }, [setActiveModule]);
  
  
  if (isLoading || !isConnected || !gameData || !currentMatch || !currentTournament) {
    return null;
  }

  return <GameDataDisplay gameData={gameData} match={currentMatch} tournament={currentTournament} />;
};

export default LiveGamePage;
