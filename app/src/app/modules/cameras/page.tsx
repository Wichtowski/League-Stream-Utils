"use client";

import React, { useEffect, useRef, useState, type ReactElement } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useCameras } from "@libCamera/context/CamerasContext";
import type { Team } from "@lib/types";

import { useMergedCameraTeams, type MergedTeamWithPlayers, type MergedPlayer } from "@lib/hooks/useMergedCameraTeams";
import { SafeImage } from "@lib/components/common/SafeImage";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CamerasPage(): ReactElement {
  const { setActiveModule } = useNavigation();
  const { isLoading: authLoading } = useAuth();
  const { teams: cameraTeamsRaw, loading: camerasLoading, refreshCameras } = useCameras();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const { mergedTeams } = useMergedCameraTeams(false);
  const router = useRouter();

  // Fetch teams directly
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);
        const response = await fetch("/api/v1/teams", {
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          setUserTeams(data.teams || []);
        } else if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = "/login";
          return;
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchTeams();
  }, []);
  const [loading, setLoading] = useState(true);
  const hasRefreshed = useRef(false);

  // mergedTeams from hook

  useEffect(() => {
    setActiveModule("cameras");
    if (!authLoading && !camerasLoading && !teamsLoading) {
      setLoading(false);
    }
  }, [setActiveModule, authLoading, camerasLoading, teamsLoading]);

  useEffect(() => {
    if (!hasRefreshed.current && !authLoading) {
      hasRefreshed.current = true;
      if (!cameraTeamsRaw || (Array.isArray(cameraTeamsRaw) && cameraTeamsRaw.length === 0)) {
        void refreshCameras();
      }
      if (!userTeams || userTeams.length === 0) {
        // Teams are already fetched in the useEffect above
      }
    }
  }, [authLoading, cameraTeamsRaw, userTeams, refreshCameras]);

  if (authLoading || loading) {
    return <LoadingSpinner fullscreen text="Loading cameras..." className="" />;
  }

  const totalPlayers = mergedTeams.reduce(
    (sum: number, team: MergedTeamWithPlayers) => sum + team.players.main.length + team.players.substitutes.length,
    0
  );

  return (
    <PageWrapper
      requireAuth={false}
      breadcrumbs={[{ label: "Camera Hub", href: "/modules/cameras", isActive: true }]}
      title="Camera Control"
      subtitle={`${totalPlayers} cameras across ${mergedTeams.length} teams`}
    >
      {/* Main Actions */}
      <div className={`grid grid-cols-1 gap-6 mb-8 md:grid-cols-2`}>
        {/* Team Stream Configuration */}
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

        {/* Multi View */}
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

      {/* Team Overview */}
      {mergedTeams.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Teams Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mergedTeams.map((team: MergedTeamWithPlayers) => (
              <div key={team.id} className="bg-gray-700 rounded-lg p-4">
                <Link href={`/modules/teams/${team.id}`} className="cursor-pointer">
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
                  {team.players.substitutes.length > 0 && (
                    <div className="text-sm text-gray-400 mb-2">
                      <span className="font-semibold">Subs:</span>{" "}
                      {team.players.substitutes.map((p: MergedPlayer) => p.inGameName).join(", ")}
                    </div>
                  )}
                  <div className="mt-2">
                    <span className="font-semibold text-xs text-gray-400">Camera Status:</span>
                    <ul className="text-xs mt-1">
                      {team.players.main.map((p: MergedPlayer) => (
                        <li key={p.id} className={p.cameraUrl ? "text-green-400" : "text-yellow-400"}>
                          {p.inGameName} {p.cameraUrl ? "• Configured" : "• Not Configured"}
                        </li>
                      ))}
                      {team.players.substitutes.map((p: MergedPlayer) => (
                        <li key={p.id} className={p.cameraUrl ? "text-green-400" : "text-yellow-400"}>
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

      {/* Controls Help */}
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
