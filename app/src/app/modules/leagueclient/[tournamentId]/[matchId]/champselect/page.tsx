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
          const tournament = tournamentData.tournament || tournamentData;
          setTournament(tournament as Tournament);
        } else {
          console.warn("Failed to fetch tournament data:", tournamentResponse.status, tournamentResponse.statusText);
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
          
          
          // Check if team IDs exist before fetching
          if (!match.blueTeamId || !match.redTeamId) {
            console.warn("Missing team IDs in match data:", { blueTeamId: match.blueTeamId, redTeamId: match.redTeamId });
            // Set match without team data as fallback
            const matchWithEmptyTeams = {
              ...match,
              blueTeam: { players: [] },
              redTeam: { players: [] }
            };
            setMatch(matchWithEmptyTeams as Match);
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
            console.warn("Failed to fetch blue team data:", blueTeamResponse.status);
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
        } else {
          console.warn("Failed to fetch match data:", matchResponse.status, matchResponse.statusText);
        }
      } catch (error) {
        console.warn("Failed to load match/tournament from API:", error);
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
    return <></>;
  }

  // Create enhanced champion select data with player information from teams
  const enhancedData: EnhancedChampSelectSession = {
    ...champSelectSession,
    myTeam: (champSelectSession.myTeam || []).map((player, index) => {
      // Try to find player by summoner name first, then by index
      let teamPlayer = null;
      const blueTeamPlayers = (match as any).blueTeam?.players || [];
      
      if (player.summonerName && player.summonerName !== `Player ${index + 1}`) {
        // Try exact match first
        teamPlayer = blueTeamPlayers.find(
          (p: any) => p.inGameName === player.summonerName
        );
        
        // If no exact match, try partial match (in case names are truncated)
        if (!teamPlayer) {
          teamPlayer = blueTeamPlayers.find(
            (p: any) => p.inGameName && p.inGameName.includes(player.summonerName)
          );
        }
      }
      
      // Fallback to index-based matching if no name match found
      if (!teamPlayer && blueTeamPlayers[index]) {
        teamPlayer = blueTeamPlayers[index];
      }
      
      return {
        ...player,
        summonerName: teamPlayer?.inGameName || player.summonerName || `Player ${index + 1}`,
        playerInfo: teamPlayer ? {
          name: teamPlayer.inGameName,
          _id: teamPlayer._id,
          inGameName: teamPlayer.inGameName,
          tag: teamPlayer.tag,
          role: teamPlayer.role,
          profileImage: teamPlayer.profileImage,
          rank: teamPlayer.rank,
          puuid: teamPlayer.puuid
        } : undefined,
        role: teamPlayer?.role
      };
    }),
    theirTeam: (champSelectSession.theirTeam || []).map((player, index) => {
      // Try to find player by summoner name first, then by index
      let teamPlayer = null;
      const redTeamPlayers = (match as any).redTeam?.players || [];
      
      if (player.summonerName && player.summonerName !== `Player ${index + 1}`) {
        // Try exact match first
        teamPlayer = redTeamPlayers.find(
          (p: any) => p.inGameName === player.summonerName
        );
        
        // If no exact match, try partial match (in case names are truncated)
        if (!teamPlayer) {
          teamPlayer = redTeamPlayers.find(

            (p: Player) => p.inGameName && p.inGameName.includes(player.summonerName)
          );
        }
      }
      
      // Fallback to index-based matching if no name match found
      if (!teamPlayer && redTeamPlayers[index]) {
        teamPlayer = redTeamPlayers[index];
      }
      
      return {
        ...player,
        summonerName: teamPlayer?.inGameName || player.summonerName || `Player ${index + 1}`,
        playerInfo: teamPlayer ? {
          name: teamPlayer.inGameName,
          _id: teamPlayer._id,
          inGameName: teamPlayer.inGameName,
          tag: teamPlayer.tag,
          role: teamPlayer.role,
          profileImage: teamPlayer.profileImage,
          rank: teamPlayer.rank,
          puuid: teamPlayer.puuid
        } : undefined,
        role: teamPlayer?.role
      };
    })
  };

  const data = enhancedData;

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
