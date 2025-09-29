"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useModal } from "@lib/contexts";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { Button, LoadingSpinner } from "@lib/components/common";
import { Player } from "@lib/types";
import { Team } from "@libTeam/types";

interface PlayerCareerStats {
  totalGames: number;
  winRate?: number;
  avgKDA?: number;
  avgCS?: number;
  avgGold?: number;
}

interface ChampionMasteryItem {
  championId: number;
  championName: string;
  gamesPlayed: number;
  winRate?: number;
}

interface RecentMatchItem {
  result: "win" | "loss";
  championName: string;
  duration: number;
}

const PlayerStatsPage: React.FC = () => {
  const params = useParams<{ teamId: string; playerId: string }>();
  const teamId = params?.teamId;
  const playerId = params?.playerId;
  const router = useRouter();

  const { showAlert } = useModal();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [team, setTeam] = useState<Team | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<RecentMatchItem[] | null>(null);
  const [careerStats, setCareerStats] = useState<PlayerCareerStats | null>(null);
  const [championMastery, setChampionMastery] = useState<ChampionMasteryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const pageProps = useMemo(() => {
    return {
      title: !player ? (loading ? "Loading player..." : "Player not found") : `${player.inGameName}#${player.tag}`,
      breadcrumbs: [
        { label: "Teams", href: "/modules/teams" },
        { label: team?.name || "Team", href: `/modules/teams/${teamId}` },
        { label: `${player?.inGameName}#${player?.tag}`, href: `/modules/teams/${teamId}/${playerId}`, isActive: true }]
    }
  }, [player, loading, teamId, playerId, team]);

  useEffect(() => {
    const fetchData = async () => {
      if (!teamId || !playerId) return;

      try {
        setLoading(true);

        // Fetch team data
        const teamResponse = await authenticatedFetch(`/api/v1/teams/${teamId}`);
        if (!teamResponse.ok) {
          throw new Error("Failed to fetch team");
        }

        const teamData = await teamResponse.json();
        setTeam(teamData.team);

        // Find the player in the team
        const foundPlayer = [...teamData.team.players.main, ...teamData.team.players.substitutes].find(
          (p: Player) => p._id === playerId
        );

        if (!foundPlayer) {
          throw new Error("Player not found in team");
        }

        setPlayer(foundPlayer);

        console.log("Found player:", foundPlayer);
        console.log("Player _id:", foundPlayer._id);
        console.log("Player id:", (foundPlayer as Player & { id?: string }).id);

        // Fetch player stats from our database
        try {
          const statsResponse = await authenticatedFetch(
            `/api/v1/player-stats/${foundPlayer._id}?includeCareer=true&includeChampions=true&limit=20`
          );

          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log("Stats response:", statsData);
            setStats((statsData.recentStats as RecentMatchItem[]) || []);
            setCareerStats((statsData.careerStats as PlayerCareerStats) || null);
            setChampionMastery((statsData.championMastery as ChampionMasteryItem[]) || []);
          } else {
            console.error("Stats response not ok:", statsResponse.status, statsResponse.statusText);
          }
        } catch (statsError) {
          console.warn("Failed to fetch player stats:", statsError);
          console.error("Stats error details:", statsError);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        await showAlert({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to load player data"
        });
        router.push(`/modules/teams/${teamId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId, playerId, authenticatedFetch, showAlert, router]);

  if (loading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading player..." />
      </PageWrapper>
    );
  }

  if (!team || !player) {
    return (
      <PageWrapper {...pageProps}>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Player Not Found</h2>
          <p className="text-gray-400 mb-4">
            The player you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <Button
            onClick={() => router.push(`/modules/teams/${teamId}`)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Back to Team
          </Button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps}>
      <div className="space-y-6">
        {/* Player Header */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {player.inGameName}#{player.tag}
              </h2>
              <p className="text-gray-400 mt-1">
                {player.role} • {team.name} • {team.tag}
              </p>
              {player.puuid && <p className="text-sm text-gray-500 mt-1">PUUID: {player.puuid}</p>}
            </div>
            <div className="text-right">
              <Button
                onClick={() => router.push(`/modules/teams/${teamId}`)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Back to Team
              </Button>
            </div>
          </div>
        </div>

        {/* Player Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Career Stats */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Career Stats</h3>
            {careerStats ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Games:</span>
                  <span className="text-white font-medium">{careerStats.totalGames}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="text-white font-medium">{careerStats.winRate?.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg KDA:</span>
                  <span className="text-white font-medium">{careerStats.avgKDA?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg CS/min:</span>
                  <span className="text-white font-medium">{careerStats.avgCS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Gold/min:</span>
                  <span className="text-white font-medium">{careerStats.avgGold}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No career data available</p>
            )}
          </div>

          {/* Champion Mastery */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Top Champions</h3>
            {championMastery && championMastery.length > 0 ? (
              <div className="space-y-3">
                {championMastery.slice(0, 5).map(
                  (
                    champion: {
                      championId: number;
                      championName: string;
                      gamesPlayed: number;
                      winRate?: number;
                    },
                    index: number
                  ) => (
                    <div key={champion.championId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm">#{index + 1}</span>
                        <span className="text-white font-medium">{champion.championName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm">{champion.gamesPlayed} games</div>
                        <div className="text-gray-400 text-xs">{champion.winRate?.toFixed(1)}% WR</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-gray-400">No champion mastery data available</p>
            )}
          </div>

          {/* Recent Matches */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Matches</h3>
            {stats && stats.length > 0 ? (
              <div className="space-y-3">
                {stats.slice(0, 5).map(
                  (
                    match: {
                      result: "win" | "loss";
                      championName: string;
                      duration: number;
                    },
                    index: number
                  ) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-2 h-2 rounded-full ${match.result === "win" ? "bg-green-500" : "bg-red-500"}`}
                        ></span>
                        <span className="text-white font-medium">{match.championName}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm ${match.result === "win" ? "text-green-400" : "text-red-400"}`}>
                          {match.result === "win" ? "W" : "L"}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, "0")}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="text-gray-400">No recent match data available</p>
            )}
          </div>
        </div>

        {/* Additional Player Info */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Player Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-300 mb-3">Basic Info</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Role:</span>
                  <span className="text-white">{player.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team:</span>
                  <span className="text-white">{team.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Team Tag:</span>
                  <span className="text-white">{team.tag}</span>
                </div>
                {player.summonerLevel && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Summoner Level:</span>
                    <span className="text-white">{player.summonerLevel}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-300 mb-3">Additional Details</h4>
              <div className="space-y-2">
                {player.firstName && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">First Name:</span>
                    <span className="text-white">{player.firstName}</span>
                  </div>
                )}
                {player.lastName && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Name:</span>
                    <span className="text-white">{player.lastName}</span>
                  </div>
                )}
                {player.country && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Country:</span>
                    <span className="text-white">{player.country}</span>
                  </div>
                )}
                {player.lastGameAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Game:</span>
                    <span className="text-white">{new Date(player.lastGameAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default PlayerStatsPage;
