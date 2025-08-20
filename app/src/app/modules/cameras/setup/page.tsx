"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useCameras } from "@/libCamera/context/CamerasContext";
import { useTeams } from "@/libTeam/contexts/TeamsContext";
import Image from "next/image";
import type { CameraPlayer, CameraTeam } from "@lib/types";
import { PageWrapper } from "@lib/layout/PageWrapper";

export default function CameraSetupListPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { isLoading: authLoading } = useAuth();
  const { teams: cameraTeamsRaw, loading: camerasLoading } = useCameras();
  const { teams: userTeams } = useTeams();

  const [loading, setLoading] = useState(true);

  // Ensure cameraTeams is typed as CameraTeam[]
  const cameraTeams = cameraTeamsRaw as unknown as CameraTeam[];

  // Merge logic: combine userTeams (full info) with cameraTeams (camera URLs)
  const mergedTeams = userTeams.map((team) => {
    const cameraTeam = cameraTeams.find((ct: CameraTeam) => ct.teamId === team.id);
    // Merge all players (main + subs)
    const allPlayers = [
      ...team.players.main.map((player) => {
        const cameraPlayer = cameraTeam?.players.find(
          (cp: CameraPlayer) =>
            (cp.playerId && cp.playerId === player.id) || (cp.inGameName && cp.inGameName === player.inGameName)
        );
        return {
          ...player,
          cameraUrl: cameraPlayer?.url || null
        };
      }),
      ...team.players.substitutes.map((player) => {
        const cameraPlayer = cameraTeam?.players.find(
          (cp: CameraPlayer) =>
            (cp.playerId && cp.playerId === player.id) || (cp.inGameName && cp.inGameName === player.inGameName)
        );
        return {
          ...player,
          cameraUrl: cameraPlayer?.url || null
        };
      })
    ];
    return {
      id: team.id,
      name: team.name,
      logo: team.logo,
      allPlayers
    };
  });

  useEffect(() => {
    setActiveModule("cameras");
    if (!authLoading && !camerasLoading) {
      setLoading(false);
    }
  }, [setActiveModule, authLoading, camerasLoading]);

  if (authLoading || loading) {
    return (
      <PageWrapper requireAuth={false}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      requireAuth={false}
      breadcrumbs={[
        { label: "Camera Hub", href: "/modules/cameras" },
        { label: "Setup", href: `/modules/cameras/setup`, isActive: true }
      ]}
      title="Camera Stream Setup"
      subtitle="Select a team to configure stream URLs"
      contentClassName="max-w-6xl mx-auto"
    >
      {/* Teams List */}
      {mergedTeams.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl text-gray-400 mb-4">No teams found</h3>
          <p className="text-gray-500 mb-6">Create teams first to configure camera streams</p>
          <button
            onClick={() => router.push("/modules/teams")}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Manage Teams
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mergedTeams.map((team, idx) => {
            const configuredCount = team.allPlayers.filter((p) => p.cameraUrl && p.cameraUrl.trim() !== "").length;
            return (
              <div
                key={team.id || idx}
                onClick={() => router.push(`/modules/cameras/setup/${team.id}`)}
                className="bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500 rounded-lg p-6 cursor-pointer transition-all duration-200 transform hover:scale-105"
              >
                <div className="flex items-center gap-4 mb-4">
                  {team.logo?.data ? (
                    <Image
                      src={team.logo.data}
                      alt={team.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center text-gray-400">
                      👥
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{team.name}</h2>
                    <p className="text-gray-400">{team.allPlayers.length} players</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Streams configured:</span>
                    <span className="text-blue-400">
                      {configuredCount} / {team.allPlayers.length}
                    </span>
                  </div>

                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(configuredCount / team.allPlayers.length) * 100}%`
                      }}
                    ></div>
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-gray-500">
                      Players: {team.allPlayers.map((p) => p.inGameName).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Click to configure</span>
                    <div className="text-blue-400">→</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">How to Configure Streams</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-300 mb-2">Step 1: Select Team</h4>
            <p className="text-gray-400">
              Click on a team card above to configure stream URLs for that team&apos;s players.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-2">Step 2: Add Stream URLs</h4>
            <p className="text-gray-400">
              Enter the stream URL for each player. You can use any streaming service that provides a direct stream URL.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
