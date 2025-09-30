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

  const { tournamentsWithTeams, unassignedTeams } = useMemo(() => {
    const byTournament: { tournament: Tournament; teams: MergedTeamWithPlayers[] }[] = [];

    tournaments.forEach((t) => {
      const setRegistered = new Set<string>((t.registeredTeams || []).map((id) => id));
      const teamsForTournament = mergedTeams.filter((mt) => setRegistered.has(mt._id) || (mt as unknown as Team).tournamentId === t._id);
      if (teamsForTournament.length > 0) {
        byTournament.push({ tournament: t, teams: teamsForTournament });
      }
    });

    const assignedIds = new Set(byTournament.flatMap((x) => x.teams.map((tt) => tt._id)));
    const unassigned = mergedTeams.filter((mt) => !assignedIds.has(mt._id));

    return { tournamentsWithTeams: byTournament, unassignedTeams: unassigned };
  }, [tournaments, mergedTeams]);

  const paginatedTournamentGroups = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(tournamentsWithTeams.length / TOURNAMENTS_PER_PAGE));
    const currentPage = Math.min(Math.max(1, tournamentPage), totalPages);
    const startIndex = (currentPage - 1) * TOURNAMENTS_PER_PAGE;
    const endIndex = startIndex + TOURNAMENTS_PER_PAGE;
    return {
      groups: tournamentsWithTeams.slice(startIndex, endIndex),
      totalPages,
      currentPage
    };
  }, [tournamentsWithTeams, tournamentPage]);

  const pageProps = useMemo(() => {
    return {
      requireAuth: false,
      title: "Camera Control",
      breadcrumbs: [
        { label: "Camera Hub", href: "/modules/cameras", isActive: true }
      ],
      subtitle: cameraTeamsRaw.length > 0 ? `${mergedTeams.reduce(
        (sum: number, team: MergedTeamWithPlayers) => sum + team.players.main.length + team.players.substitutes.length,
        0
      )} cameras across ${mergedTeams.length} teams` : "",
    }
  }, [mergedTeams, cameraTeamsRaw.length]);

  if (authLoading || loading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading cameras..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps}>
      <div className={`grid grid-cols-1 gap-6 mb-8 md:grid-cols-2`}>
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-3">📺 Team Streams</h2>
          <p className="text-gray-400 mb-4">Team-based camera switching with keyboard controls</p>
          <button
            onClick={() => router.push("/modules/cameras/setup")}
            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            Team Stream Configuration
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-3">📱 Multi View</h2>
          <p className="text-gray-400 mb-4">Grid layout showing all cameras simultaneously</p>
          <button
            onClick={() => router.push("/modules/cameras/all")}
            className="cursor-pointer w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            All Cameras Grid
          </button>
        </div>
      </div>

      {paginatedTournamentGroups.groups.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Teams Overview</h2>

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
                          setTeamsPageByTournament((prev) => ({ ...prev, [tournament._id]: Math.max(1, Math.min(totalTeamPages, p)) }))
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
                            <Link href={`/modules/cameras/setup/${team._id}`} className="cursor-pointer">
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
                                    <li key={`main-${p._id}`} className={p.cameraUrl ? "text-green-300" : "text-yellow-300"}>
                                      {p.inGameName} {p.cameraUrl ? "• Configured" : "• Not Configured"}
                                    </li>
                                  ))}
                                  {team.players.substitutes.map((p: MergedPlayer) => (
                                    <li key={`sub-${p._id}`} className={p.cameraUrl ? "text-green-300" : "text-yellow-300"}>
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
                    noPermission={<div className="text-gray-400 text-sm">No permission to view cameras for this tournament.</div>}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <Pagination
              currentPage={paginatedTournamentGroups.currentPage}
              totalPages={paginatedTournamentGroups.totalPages}
              onPageChange={(p: number) => setTournamentPage(Math.max(1, Math.min(paginatedTournamentGroups.totalPages, p)))}
            />
          </div>
        </div>
      )}

      {unassignedTeams.length > 0 && (
        <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Unassigned Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unassignedTeams.map((team: MergedTeamWithPlayers) => (
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
        </div>
      )}

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
