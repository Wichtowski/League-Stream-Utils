"use client";

import React, { useEffect, useRef, useState } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { GameDataDisplay } from "@libLeagueClient/components/game/GameDataDisplay";
import { useGameData } from "@lib/hooks/useGameData";
import { Tournament, Match } from "@libTournament/types";
import { Team } from "@libTeam/types";
import { useParams } from "next/navigation";

const LiveGamePage: React.FC = () => {
  const { setActiveModule } = useNavigation();
  const { gameData, isConnected, isLoading: useGameDataLoading } = useGameData();
  const [loading, setLoading] = useState(true);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [currentTournament, setCurrentTournament] = useState<Tournament | null>(null);
  const [blueTeamData, setBlueTeamData] = useState<Team | undefined>(undefined);
  const [redTeamData, setRedTeamData] = useState<Team | undefined>(undefined);
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const matchId = params.matchId as string;
  const processedMatchRef = useRef<string | null>(null);

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

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
        } else {
          console.error("Failed to fetch tournament data:", tournamentResponse.status, tournamentResponse.statusText);
        }

        // Fetch match data
        const matchResponse = await fetch(`/api/public/matches/${matchId}`);
        if (matchResponse.ok) {
          const matchData = await matchResponse.json();

          // Handle MongoDB document format - extract data from _doc if present
          let match = matchData.match;
          if (match && match._doc) {
            match = match._doc;
          }

          console.log("Match data received:", match);

          // Check if team IDs exist before fetching
          if (!match.blueTeamId || !match.redTeamId) {
            console.error("Missing team IDs in match data:", {
              blueTeamId: match.blueTeamId,
              redTeamId: match.redTeamId
            });
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

          if (blueTeamResponse.ok) {
            const blueTeamResult = await blueTeamResponse.json();
            setBlueTeamData(blueTeamResult.team);
          } else {
            console.error("Failed to fetch blue team data:", blueTeamResponse.status);
          }

          if (redTeamResponse.ok) {
            const redTeamResult = await redTeamResponse.json();
            setRedTeamData(redTeamResult.team);
          } else {
            console.error("Failed to fetch red team data:", redTeamResponse.status);
          }

          setCurrentMatch(match);
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
    if (currentMatch && blueTeamData && redTeamData && processedMatchRef.current !== currentMatch._id) {
      // Create a match object with the expected structure for bindLivePlayersToMatch
      const matchWithTeams = {
        ...currentMatch,
        blueTeam: {
          players: blueTeamData?.players?.main || []
        },
        redTeam: {
          players: redTeamData?.players?.main || []
        }
      };
      setCurrentMatch(matchWithTeams as Match);
      processedMatchRef.current = currentMatch._id;
    }
  }, [currentMatch, blueTeamData, redTeamData]);

  useEffect(() => {
    if (currentMatch && currentTournament) {
      setLoading(useGameDataLoading);
    }
  }, [currentMatch, currentTournament, useGameDataLoading]);

  if (loading || !isConnected || !gameData || !currentMatch || !currentTournament) {
    return <></>;
  }

  return (
    <GameDataDisplay
      gameData={gameData}
      match={currentMatch}
      tournament={currentTournament}
      blueTeamData={blueTeamData}
      redTeamData={redTeamData}
    />
  );
};

export default LiveGamePage;
