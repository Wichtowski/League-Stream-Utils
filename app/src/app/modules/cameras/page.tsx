"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useCameras } from "@libCamera/context/CamerasContext";
import type { Team } from "@libTeam/types";

import { useMergedCameraTeams, type MergedTeamWithPlayers, type MergedPlayer } from "@lib/hooks/useMergedCameraTeams";
import { SafeImage } from "@lib/components/common/SafeImage";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { useRouter } from "next/navigation";
import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import type { Tournament } from "@libTournament/types";
import { Pagination } from "@lib/components/common/Pagination";
import { Permission } from "@lib/types/permissions";
import { ConditionalPermission } from "@lib/components/permissions/PermissionGuard";

export default function CamerasPage(): ReactElement {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { isLoading: authLoading } = useAuth();
  const { teams: cameraTeamsRaw, loading: camerasLoading, refreshCameras } = useCameras();
  const { mergedTeams, loading: mergedLoading } = useMergedCameraTeams(false);
  const [loading, setLoading] = useState(true);
  const hasRefreshed = useRef(false);

  const { tournaments, loading: tournamentsLoading, refreshTournaments } = useTournaments();
  const [tournamentPage, setTournamentPage] = useState(1);
  const [teamsPageByTournament, setTeamsPageByTournament] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setActiveModule("cameras");
  }, [setActiveModule]);

  useEffect(() => {
    if (!authLoading && !camerasLoading && !mergedLoading && !tournamentsLoading) {
      setLoading(false);
    }
  }, [authLoading, camerasLoading, mergedLoading, tournamentsLoading]);

  useEffect(() => {
    if (!hasRefreshed.current && !authLoading) {
      hasRefreshed.current = true;
      if (!cameraTeamsRaw || (Array.isArray(cameraTeamsRaw) && cameraTeamsRaw.length === 0)) {
        void refreshCameras();
      }
      void refreshTournaments();
    }
  }, [authLoading, cameraTeamsRaw, refreshCameras, refreshTournaments]);

  const TOURNAMENTS_PER_PAGE = 2;
  const TEAMS_PER_TOURNAMENT = 4;

  const { filteredTournamentsWithTeams, filteredUnassignedTeams } = useMemo(() => {
    const byTournament: { tournament: Tournament; teams: MergedTeamWithPlayers[] }[] = [];

    tournaments.forEach((t) => {
      const setRegistered = new Set<string>((t.registeredTeams || []).map((id) => id));
      const teamsForTournament = mergedTeams.filter(
        (mt) => setRegistered.has(mt._id) || (mt as unknown as Team).tournamentId === t._id
      );
      if (teamsForTournament.length > 0) {
        byTournament.push({ tournament: t, teams: teamsForTournament });
      }
    });

    const assignedIds = new Set(byTournament.flatMap((x) => x.teams.map((tt) => tt._id)));
    const unassigned = mergedTeams.filter((mt) => !assignedIds.has(mt._id));

    // Apply search filter
    const searchLower = searchQuery.toLowerCase().trim();
    let filteredTournaments = byTournament;
    let filteredUnassigned = unassigned;

    if (searchLower) {
      filteredTournaments = byTournament.filter(({ tournament, teams }) => {
        const tournamentMatches = tournament.name.toLowerCase().includes(searchLower);
        const teamMatches = teams.some(team => 
          team.name.toLowerCase().includes(searchLower) ||
          team.players.main.some(p => p.inGameName.toLowerCase().includes(searchLower)) ||
          team.players.substitutes.some(p => p.inGameName.toLowerCase().includes(searchLower))
        );
        return tournamentMatches || teamMatches;
      });

      filteredUnassigned = unassigned.filter(team =>
        team.name.toLowerCase().includes(searchLower) ||
        team.players.main.some(p => p.inGameName.toLowerCase().includes(searchLower)) ||
        team.players.substitutes.some(p => p.inGameName.toLowerCase().includes(searchLower))
      );
    }

    return { 
      filteredTournamentsWithTeams: filteredTournaments,
      filteredUnassignedTeams: filteredUnassigned
    };
  }, [tournaments, mergedTeams, searchQuery]);

  const paginatedTournamentGroups = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredTournamentsWithTeams.length / TOURNAMENTS_PER_PAGE));
    const currentPage = Math.min(Math.max(1, tournamentPage), totalPages);
    const startIndex = (currentPage - 1) * TOURNAMENTS_PER_PAGE;
    const endIndex = startIndex + TOURNAMENTS_PER_PAGE;
    return {
      groups: filteredTournamentsWithTeams.slice(startIndex, endIndex),
      totalPages,
      currentPage
    };
  }, [filteredTournamentsWithTeams, tournamentPage]);

  const pageProps = useMemo(() => {
    return {
      requireAuth: false,
      title: "Camera Control",
      breadcrumbs: [{ label: "Cameras", href: "/modules/cameras", isActive: true }],
      subtitle:
        cameraTeamsRaw.length > 0
          ? `${mergedTeams.reduce(
              (sum: number, team: MergedTeamWithPlayers) =>
                sum + team.players.main.length + team.players.substitutes.length,
              0
            )} cameras across ${mergedTeams.length} teams across ${tournaments.length} tournaments`
          : ""
    };
  }, [mergedTeams, cameraTeamsRaw.length, tournaments.length]);

  if (authLoading || loading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading cameras..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps}>
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Tournaments Overview</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search tournaments and teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-2 w-80 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className={`w-full center justify-center transition-all duration-300 ease-in-out overflow-hidden ${
              searchQuery ? 'max-w-20 opacity-100' : 'max-w-0 opacity-0'
            }`}>
              <button
                onClick={() => setSearchQuery("")}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {paginatedTournamentGroups.groups.length > 0 ? (
          <>
            <div className="space-y-6">
              {paginatedTournamentGroups.groups.map(({ tournament, teams }) => {
              const teamsPage = teamsPageByTournament[tournament._id] || 1;
              const totalTeamPages = Math.max(1, Math.ceil(teams.length / TEAMS_PER_TOURNAMENT));
              const teamsStart = (Math.min(teamsPage, totalTeamPages) - 1) * TEAMS_PER_TOURNAMENT;
              const teamsEnd = teamsStart + TEAMS_PER_TOURNAMENT;
              const teamsSlice = teams.slice(teamsStart, teamsEnd);

              return (
                <div key={tournament._id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{tournament.name}</h3>
                    {totalTeamPages > 1 && (
                      <Pagination
                        currentPage={Math.min(teamsPage, totalTeamPages)}
                        totalPages={totalTeamPages}
                        onPageChange={(p: number) =>
                          setTeamsPageByTournament((prev) => ({
                            ...prev,
                            [tournament._id]: Math.max(1, Math.min(totalTeamPages, p))
                          }))
                        }
                      />
                    )}
                  </div>

                  <ConditionalPermission
                    permission={Permission.TOURNAMENT_VIEW}
                    resourceId={tournament._id}
                    hasPermission={
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teamsSlice.map((team: MergedTeamWithPlayers) => (
                          <div key={team._id} className="bg-gray-600 rounded-lg p-4">
                            <Link href={`/modules/cameras/${team._id}`} className="cursor-pointer">
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                  {team.logo?.data ? (
                                    <SafeImage
                                      src={team.logo.data}
                                      alt={team.name}
                                      width={24}
                                      height={24}
                                      className="w-6 h-6 rounded object-cover"
                                    />
                                  ) : null}
                                  {team.name}
                                </h3>
                                <span className="text-sm text-gray-300">
                                  {team.players.main.length + team.players.substitutes.length} players
                                </span>
                              </div>
                              {team.players.substitutes.length > 0 ? (
                                <div className="text-sm text-gray-200 mb-2">
                                  <span className="font-semibold">Subs:</span>{" "}
                                  {team.players.substitutes.map((p: MergedPlayer) => p.inGameName).join(", ")}
                                </div>
                              ) : null}
                              <div className="mt-2">
                                <span className="font-semibold text-xs text-gray-200">Camera Status:</span>
                                <ul className="text-xs mt-1">
                                  {team.players.main.map((p: MergedPlayer) => (
                                    <li
                                      key={`main-${p._id}`}
                                      className={p.cameraUrl ? "text-green-300" : "text-yellow-300"}
                                    >
                                      {p.inGameName} {p.cameraUrl ? "• Configured" : "• Not Configured"}
                                    </li>
                                  ))}
                                  {team.players.substitutes.map((p: MergedPlayer) => (
                                    <li
                                      key={`sub-${p._id}`}
                                      className={p.cameraUrl ? "text-green-300" : "text-yellow-300"}
                                    >
                                      {p.inGameName} (Sub) {p.cameraUrl ? "• Configured" : "• Not Configured"}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    }
                    noPermission={
                      <div className="text-gray-400 text-sm">No permission to view cameras for this tournament.</div>
                    }
                  />
                </div>
              );
            })}
          </div>

            <div>
              <Pagination
                currentPage={paginatedTournamentGroups.currentPage}
                totalPages={paginatedTournamentGroups.totalPages}
                onPageChange={(p: number) =>
                  setTournamentPage(Math.max(1, Math.min(paginatedTournamentGroups.totalPages, p)))
                }
              />
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">
              {searchQuery ? "No tournaments or teams found matching your search" : "No tournaments available"}
            </div>
            <div className="flex justify-center">
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                searchQuery ? 'max-w-32 opacity-100' : 'max-w-0 opacity-0'
              }`}>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Clear search
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Unassigned Teams</h2>
        {filteredUnassignedTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUnassignedTeams.map((team: MergedTeamWithPlayers) => (
              <div key={team._id} className="bg-gray-700 rounded-lg p-4">
                <Link href={`/modules/teams/${team._id}`} className="cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      {team.logo?.data ? (
                        <SafeImage
                          src={team.logo.data}
                          alt={team.name}
                          width={24}
                          height={24}
                          className="w-6 h-6 rounded object-cover"
                        />
                      ) : null}
                      {team.name}
                    </h3>
                    <span className="text-sm text-gray-400">
                      {team.players.main.length + team.players.substitutes.length} players
                    </span>
                  </div>
                  {team.players.substitutes.length > 0 ? (
                    <div className="text-sm text-gray-400 mb-2">
                      <span className="font-semibold">Subs:</span>{" "}
                      {team.players.substitutes.map((p: MergedPlayer) => p.inGameName).join(", ")}
                    </div>
                  ) : null}
                  <div className="mt-2">
                    <span className="font-semibold text-xs text-gray-400">Camera Status:</span>
                    <ul className="text-xs mt-1">
                      {team.players.main.map((p: MergedPlayer) => (
                        <li key={`main-${p._id}`} className={p.cameraUrl ? "text-green-400" : "text-yellow-400"}>
                          {p.inGameName} {p.cameraUrl ? "• Configured" : "• Not Configured"}
                        </li>
                      ))}
                      {team.players.substitutes.map((p: MergedPlayer) => (
                        <li key={`sub-${p._id}`} className={p.cameraUrl ? "text-green-400" : "text-yellow-400"}>
                          {p.inGameName} (Sub) {p.cameraUrl ? "• Configured" : "• Not Configured"}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">
              {searchQuery ? "No unassigned teams found matching your search" : "No unassigned teams available"}
            </div>
            <div className="flex justify-center">
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                searchQuery ? 'max-w-32 opacity-100' : 'max-w-0 opacity-0'
              }`}>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-400 hover:text-blue-300 underline whitespace-nowrap"
                >
                  Clear search
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-6 mb-8 mt-8`}>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-3">📱 Multi View</h2>
          <p className="text-gray-400 mb-4">Grid layout showing all cameras within current tournament simultaneously</p>
          <button
            onClick={() => router.push("/modules/cameras/all")}
            className="cursor-pointer w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            All Cameras Grid
          </button>
        </div>
      </div>

      <div className="mt-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">Keyboard Controls</h3>
        <div className="text-sm text-gray-300 space-y-1 flex flex-row gap-2">
          <p>
            <kbd className="bg-gray-600 px-2 py-1 rounded">Space</kbd> - Random player
          </p>
          <p>
            <kbd className="bg-gray-600 px-2 py-1 rounded">R</kbd> - Toggle auto-random mode
          </p>
          <p>
            <kbd className="bg-gray-600 px-2 py-1 rounded">1-9</kbd> - Select specific player
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
