"use client";

import React, { useEffect, useState } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { GameDataDisplay } from "@libLeagueClient/components/game/GameDataDisplay";
import { useGameData } from "@lib/hooks/useGameData";
import { useCurrentTournament } from "@lib/contexts";
import { useCurrentMatch } from "@lib/contexts";
import { Tournament, Match } from "@libTournament/types";
import { useRouter } from "next/navigation";

const LiveGamePage: React.FC = () => {
  const { setActiveModule } = useNavigation();
  const { gameData, isConnected, isLoading: useGameDataLoading } = useGameData();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);

  const { getCurrentTournament } = useCurrentTournament();
  const { getCurrentMatch } = useCurrentMatch();

  useEffect(() => {
    setActiveModule(null);
    const init = async (): Promise<void> => {
      const current = await getCurrentTournament();
      const lastSelectedTournament = current ? { tournamentId: current._id } : null;
      const match = await getCurrentMatch();
      const lastSelectedMatch = match ? { matchId: match._id } : null;

      if (lastSelectedTournament?.tournamentId && lastSelectedMatch?.matchId) {
        // Redirect to the new URL parameter-based route
        router.push(`/modules/leagueclient/${lastSelectedTournament.tournamentId}/${lastSelectedMatch.matchId}/game`);
        return;
      }

      // Fallback to old behavior if no stored data
      if (lastSelectedTournament?.tournamentId) {
        const tournament = await fetch(`/api/v1/tournaments/${lastSelectedTournament.tournamentId}`);
        const tournamentData = (await tournament.json()) as Tournament;
        setCurrentTournament(tournamentData);
      }
      if (lastSelectedMatch?.matchId) {
        const match = await fetch(`/api/v1/matches/${lastSelectedMatch.matchId}`);
        const matchData = (await match.json()) as Match;
        setCurrentMatch(matchData);
      }
      if (currentMatch && currentTournament) {
        setLoading(useGameDataLoading);
      }
    };
    init();
  }, [
    setActiveModule,
    router,
    currentMatch,
    currentTournament,
    useGameDataLoading,
    getCurrentTournament,
    getCurrentMatch
  ]);

  console.log(loading, isConnected, gameData, currentMatch, currentTournament);
  if (loading || !isConnected || !gameData || !currentMatch || !currentTournament) {
    return <></>;
  }

  return <GameDataDisplay gameData={gameData} match={currentMatch} tournament={currentTournament} />;
};

export default LiveGamePage;
