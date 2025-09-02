"use client";

import React, { useEffect, useState } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { GameDataDisplay } from "@libLeagueClient/components/game/GameDataDisplay";
import { useGameData } from "@lib/hooks/useGameData";
import { Tournament, Match } from "@lib/types";

interface GamePageProps {
  params: Promise<{
    tournamentId: string;
    matchId: string;
  }>;
}

const LiveGamePage: React.FC<GamePageProps> = ({ params }) => {
  const { setActiveModule } = useNavigation();
  const { gameData, isConnected, isLoading: useGameDataLoading } = useGameData();
  const [loading, setLoading] = useState(true);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [tournamentId, setTournamentId] = useState<string>("");
  const [matchId, setMatchId] = useState<string>("");

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTournamentId(resolvedParams.tournamentId);
      setMatchId(resolvedParams.matchId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    const init = async (): Promise<void> => {
      if (!tournamentId || !matchId) return;

      try {
        // Fetch tournament data
        const tournamentResponse = await fetch(`/api/public/tournaments/${tournamentId}`);
        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();
          console.log("Tournament response:", tournamentData);
          const tournament = tournamentData.tournament || tournamentData;
          setCurrentTournament(tournament as Tournament);
          console.log("Loaded tournament from API:", tournament);
        } else {
          console.error("Failed to fetch tournament data:", tournamentResponse.status, tournamentResponse.statusText);
        }

        // Fetch match data
        const matchResponse = await fetch(`/api/public/matches/${matchId}`);
        if (matchResponse.ok) {
          const matchData = await matchResponse.json();
          console.log("Match response:", matchData);
          
          // Handle MongoDB document format - extract data from _doc if present
          let match = matchData.match;
          if (match && match._doc) {
            match = match._doc;
          }
          
          console.log("Match data received:", match);
          console.log("Blue team ID:", match.blueTeamId);
          console.log("Red team ID:", match.redTeamId);
          
          // Check if team IDs exist before fetching
          if (!match.blueTeamId || !match.redTeamId) {
            console.error("Missing team IDs in match data:", { blueTeamId: match.blueTeamId, redTeamId: match.redTeamId });
            // Set match without team data as fallback
            const matchWithEmptyTeams = {
              ...match,
              blueTeam: { players: [] },
              redTeam: { players: [] }
            };
            setCurrentMatch(matchWithEmptyTeams as Match);
            return;
          }
          
          // Fetch team data for both teams to get player information
          const [blueTeamResponse, redTeamResponse] = await Promise.all([
            fetch(`/api/public/teams/${match.blueTeamId}`),
            fetch(`/api/public/teams/${match.redTeamId}`)
          ]);

          let blueTeamData = null;
          let redTeamData = null;

          if (blueTeamResponse.ok) {
            const blueTeamResult = await blueTeamResponse.json();
            blueTeamData = blueTeamResult.team;
          } else {
            console.error("Failed to fetch blue team data:", blueTeamResponse.status);
          }

          if (redTeamResponse.ok) {
            const redTeamResult = await redTeamResponse.json();
            redTeamData = redTeamResult.team;
          } else {
            console.error("Failed to fetch red team data:", redTeamResponse.status);
          }

          // Create a match object with the expected structure for bindLivePlayersToMatch
          const matchWithTeams = {
            ...match,
            blueTeam: {
              players: blueTeamData?.players?.main || []
            },
            redTeam: {
              players: redTeamData?.players?.main || []
            }
          };

          setCurrentMatch(matchWithTeams as Match);
        } else {
          console.error("Failed to fetch match data:", matchResponse.status, matchResponse.statusText);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    init();
  }, [tournamentId, matchId]);

  useEffect(() => {
    if (currentMatch && currentTournament) {
      setLoading(useGameDataLoading);
    }
  }, [currentMatch, currentTournament, useGameDataLoading]);

  if (loading || !isConnected || !gameData || !currentMatch || !currentTournament) {
    return <></>;
  }

  return <GameDataDisplay gameData={gameData} match={currentMatch} tournament={currentTournament} />;
};

export default LiveGamePage;
