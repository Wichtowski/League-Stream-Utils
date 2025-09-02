"use client";

import React, { useEffect, useState } from "react";
import type { EnhancedChampSelectSession, Match, Tournament } from "@lib/types";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useDownload } from "@lib/contexts/DownloadContext";
import { ChampSelectDisplay } from "@libLeagueClient/components/champselect/ChampSelectDisplay";
import { useLCU, useChampSelectAssets } from "@lib/services";

interface ChampSelectPageProps {
  params: Promise<{
    tournamentId: string;
    matchId: string;
  }>;
}

const ChampSelectOverlayPage: React.FC<ChampSelectPageProps> = ({ params }) => {
  const { setActiveModule } = useNavigation();
  const { downloadState } = useDownload();

  // Use custom hooks for LCU and assets
  const { isConnected, champSelectSession } = useLCU();
  const { assets } = useChampSelectAssets();

  // State for match and tournament data
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
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

  // Load match and tournament from API using URL parameters
  useEffect(() => {
    const loadData = async () => {
      if (!tournamentId || !matchId) return;

      try {
        // Fetch tournament data
        const tournamentResponse = await fetch(`/api/public/tournaments/${tournamentId}`);
        if (tournamentResponse.ok) {
          const tournamentData = await tournamentResponse.json();
          console.log("Tournament response:", tournamentData);
          const tournament = tournamentData.tournament || tournamentData;
          setTournament(tournament as Tournament);
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
            setMatch(matchWithEmptyTeams as Match);
            console.log("Set match with empty teams as fallback");
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

          // Create a match object with the expected structure
          const matchWithTeams = {
            ...match,
            blueTeam: {
              players: blueTeamData?.players?.main || []
            },
            redTeam: {
              players: redTeamData?.players?.main || []
            }
          };

          setMatch(matchWithTeams as Match);
          console.log("Loaded match from API:", matchWithTeams);
        } else {
          console.error("Failed to fetch match data:", matchResponse.status, matchResponse.statusText);
        }
      } catch (error) {
        console.error("Failed to load match/tournament from API:", error);
      }
    };

    loadData();
  }, [tournamentId, matchId]);

  // Enable polling when connected and not downloading
  useEffect(() => {
    if (isConnected && !downloadState.isDownloading) {
      // Polling is handled by the useLCU hook internally
    }
  }, [isConnected, downloadState.isDownloading]);

  if (!assets.roleIcons || !assets.banPlaceholder || !champSelectSession || !isConnected || !match || !tournament) {
    console.log("assets", assets);
    console.log("champSelectSession", champSelectSession);
    console.log("isConnected", isConnected);
    console.log("downloadState", downloadState);
    console.log("match", match);
    console.log("tournament", tournament);
    return <></>;
  }

  const data = champSelectSession as EnhancedChampSelectSession;

  return (
    <ChampSelectDisplay
      data={data}
      match={match || ({} as Match)}
      tournament={tournament || ({} as Tournament)}
      roleIcons={assets.roleIcons}
      banPlaceholder={assets.banPlaceholder}
    />
  );
};

export default ChampSelectOverlayPage;
