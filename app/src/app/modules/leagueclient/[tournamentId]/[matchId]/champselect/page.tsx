"use client";

import React, { useEffect, useState } from "react";
import type { EnhancedChampSelectSession } from "@lib/types";
import type { Match, Tournament, GameResult } from "@libTournament/types";
import type { Team } from "@libTeam/types";
import type { PlayerRole } from "@lib/types/common";
import type { PickbanPlayer } from "@lib/types/game";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useDownload } from "@lib/contexts/DownloadContext";
import { ChampSelectDisplay } from "@libLeagueClient/components/champselect/ChampSelectDisplay";
import { useLCU, useChampSelectAssets } from "@lib/services";
import { useParams } from "next/navigation";

const ChampSelectOverlayPage: React.FC = () => {
  const { setActiveModule } = useNavigation();
  const { downloadState } = useDownload();

  // Use custom hooks for LCU and assets
  const { isConnected, champSelectSession } = useLCU();
  const { assets } = useChampSelectAssets();

  // State for match and tournament data
  const [match, setMatch] = useState<Match | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const matchId = params.matchId as string;

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

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
            console.warn("Missing team IDs in match data:", {
              blueTeamId: match.blueTeamId,
              redTeamId: match.redTeamId
            });
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
            },
            // Include team names to resolve side for the current pending game
            blueTeamName: blueTeamData?.name || "",
            redTeamName: redTeamData?.name || "",
            // Store full team data for logo resolution
            blueTeamData: blueTeamData,
            redTeamData: redTeamData
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

  type TeamPlayerLite = {
    _id?: string;
    inGameName?: string;
    tag?: string;
    role?: PlayerRole;
    profileImage?: string;
    rank?: string;
    puuid?: string;
    name?: string;
  };

  type MatchWithTeams = Match & {
    blueTeam?: { players: TeamPlayerLite[] };
    redTeam?: { players: TeamPlayerLite[] };
    blueTeamName?: string;
    redTeamName?: string;
    games?: GameResult[];
  };

  // Determine current sides based on latest pending game in the series
  const games: GameResult[] = (match as MatchWithTeams).games || [];
  const pendingGame = [...games].reverse().find((g) => !g.blueTeam.won && !g.redTeam.won);
  let currentBlueTeamPlayers: TeamPlayerLite[] = (match as MatchWithTeams).blueTeam?.players || [];
  let currentRedTeamPlayers: TeamPlayerLite[] = (match as MatchWithTeams).redTeam?.players || [];
  if (pendingGame) {
    const blueName = pendingGame.blueTeam.teamName;
    const redName = pendingGame.redTeam.teamName;
    const blueTeamName = (match as MatchWithTeams).blueTeamName;
    const redTeamName = (match as MatchWithTeams).redTeamName;
    if (blueTeamName && redTeamName) {
      if (blueName === redTeamName && redName === blueTeamName) {
        currentBlueTeamPlayers = (match as MatchWithTeams).redTeam?.players || [];
        currentRedTeamPlayers = (match as MatchWithTeams).blueTeam?.players || [];
      } else if (blueName === blueTeamName && redName === redTeamName) {
        // keep as default mapping
      }
    }
  }

  // Create enhanced champion select data with player information from teams and current sides
  const enhancedData: EnhancedChampSelectSession = {
    ...champSelectSession,
    myTeam: (champSelectSession.myTeam || []).map((player, index) => {
      // Try to find player by summoner name first, then by index
      let teamPlayer = null;
      const blueTeamPlayers: TeamPlayerLite[] = currentBlueTeamPlayers;

      if (player.summonerName && player.summonerName !== `Player ${index + 1}`) {
        // Try exact match first
        teamPlayer = blueTeamPlayers.find((p: TeamPlayerLite) => p.inGameName === player.summonerName);

        // If no exact match, try partial match (in case names are truncated)
        if (!teamPlayer) {
          teamPlayer = blueTeamPlayers.find(
            (p: TeamPlayerLite) => p.inGameName && p.inGameName.includes(player.summonerName)
          );
        }
      }

      // Fallback to index-based matching if no name match found
      if (!teamPlayer && blueTeamPlayers[index]) {
        teamPlayer = blueTeamPlayers[index];
      }

      const hasPlayerInfo = !!(teamPlayer && teamPlayer.inGameName && teamPlayer.role);
      const playerInfo: PickbanPlayer | undefined = hasPlayerInfo
        ? {
            name: (teamPlayer as TeamPlayerLite).inGameName as string,
            role: (teamPlayer as TeamPlayerLite).role as PlayerRole,
            profileImage: (teamPlayer as TeamPlayerLite).profileImage,
            rank: (teamPlayer as TeamPlayerLite).rank,
            puuid: (teamPlayer as TeamPlayerLite).puuid
          }
        : undefined;
      return {
        ...player,
        summonerName: teamPlayer?.inGameName || player.summonerName || `Player ${index + 1}`,
        playerInfo,
        role: teamPlayer?.role
      };
    }),
    theirTeam: (champSelectSession.theirTeam || []).map((player, index) => {
      // Try to find player by summoner name first, then by index
      let teamPlayer = null;
      const redTeamPlayers: TeamPlayerLite[] = currentRedTeamPlayers;

      if (player.summonerName && player.summonerName !== `Player ${index + 1}`) {
        // Try exact match first
        teamPlayer = redTeamPlayers.find((p: TeamPlayerLite) => p.inGameName === player.summonerName);

        // If no exact match, try partial match (in case names are truncated)
        if (!teamPlayer) {
          teamPlayer = redTeamPlayers.find(
            (p: TeamPlayerLite) => p.inGameName && p.inGameName.includes(player.summonerName)
          );
        }
      }

      // Fallback to index-based matching if no name match found
      if (!teamPlayer && redTeamPlayers[index]) {
        teamPlayer = redTeamPlayers[index];
      }

      const hasPlayerInfo = !!(teamPlayer && teamPlayer.inGameName && teamPlayer.role);
      const playerInfo: PickbanPlayer | undefined = hasPlayerInfo
        ? {
            name: (teamPlayer as TeamPlayerLite).inGameName as string,
            role: (teamPlayer as TeamPlayerLite).role as PlayerRole,
            profileImage: (teamPlayer as TeamPlayerLite).profileImage,
            rank: (teamPlayer as TeamPlayerLite).rank,
            puuid: (teamPlayer as TeamPlayerLite).puuid
          }
        : undefined;
      return {
        ...player,
        summonerName: teamPlayer?.inGameName || player.summonerName || `Player ${index + 1}`,
        playerInfo,
        role: teamPlayer?.role
      };
    })
  };

  const data = enhancedData;

  return (
    <ChampSelectDisplay
      data={data}
      match={match || ({} as Match)}
      teams={(() => {
        const m = match as unknown as {
          blueTeam?: { players?: unknown[] } & Record<string, unknown>;
          redTeam?: { players?: unknown[] } & Record<string, unknown>;
          blueTeamId?: string;
          redTeamId?: string;
          blueTeamName?: string;
          redTeamName?: string;
          blueTeamData?: Record<string, unknown>;
          redTeamData?: Record<string, unknown>;
        };
        const bluePlayers = (m?.blueTeam?.players || []).length;
        const redPlayers = (m?.redTeam?.players || []).length;
        // Only pass teams if we likely have full docs (players loaded implies we fetched teams)
        if (bluePlayers >= 0 && redPlayers >= 0) {
          // Helper function to extract logo URL from ImageStorageSchema
          const getLogoUrl = (logo: unknown): string => {
            if (!logo) return "";
            if (typeof logo === "string") return logo;
            if (typeof logo === "object" && logo !== null) {
              const logoObj = logo as { type?: string; data?: string; url?: string };
              if (logoObj.type === "upload" && logoObj.data) return logoObj.data;
              if (logoObj.type === "url" && logoObj.url) return logoObj.url;
              return logoObj.data || logoObj.url || "";
            }
            return "";
          };

          return [
            {
              ...(m?.blueTeamData || {}),
              ...(m?.blueTeam || {}),
              _id: m?.blueTeamId,
              name: m?.blueTeamName || "",
              logo: getLogoUrl((m?.blueTeamData as Record<string, unknown>)?.logo)
            },
            {
              ...(m?.redTeamData || {}),
              ...(m?.redTeam || {}),
              _id: m?.redTeamId,
              name: m?.redTeamName || "",
              logo: getLogoUrl((m?.redTeamData as Record<string, unknown>)?.logo)
            }
          ] as unknown as Team[];
        }
        return undefined;
      })()}
      tournament={tournament || ({} as Tournament)}
      roleIcons={assets.roleIcons}
      banPlaceholder={assets.banPlaceholder}
    />
  );
};

export default ChampSelectOverlayPage;
