"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { CameraPlayer, CameraTeam } from "@libCamera/types";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { useCameras } from "@libCamera/context/CamerasContext";
import { LoadingSpinner } from "@lib/components/common";
import { CameraStream } from "@libCamera/components";

export default function TeamCameraStreamPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const { setActiveModule, setRemoveSidebar } = useNavigation();
  const { teams: cameraTeamsRaw, loading: camerasLoading, refreshCameras } = useCameras();
  const [players, setPlayers] = useState<CameraPlayer[]>([]);
  const [teamName, setTeamName] = useState<string>("");

  useEffect(() => {
    setRemoveSidebar(true);
    
    return () => {
      setRemoveSidebar(false);
    };
  }, [setRemoveSidebar]);

  // Load team data and players
  useEffect(() => {
    setActiveModule("cameras");

    if (teamId) {
      if (!cameraTeamsRaw || (Array.isArray(cameraTeamsRaw) && cameraTeamsRaw.length === 0)) {
        refreshCameras();
      }
    }
  }, [teamId, setActiveModule, cameraTeamsRaw, refreshCameras]);

  // Load team players from camera data
  useEffect(() => {
    if (!teamId || camerasLoading) return;

    const cameraTeams = cameraTeamsRaw as unknown as CameraTeam[];
    const team = (cameraTeams || []).find((t) => t.teamId === teamId);

    if (team) {
      setTeamName(team.teamName);
      const basePlayers = team.players || [];
      const playersWithTeamStream: CameraPlayer[] =
        team.teamStreamUrl && team.teamStreamUrl.trim() !== ""
          ? [
              {
                playerId: "team-stream",
                playerName: "TEAM STREAM",
                inGameName: "Team Stream",
                url: team.teamStreamUrl.trim(),
                imagePath: ""
              },
              ...basePlayers
            ]
          : basePlayers;
      setPlayers(playersWithTeamStream);
    } else {
      setPlayers([]);
      setTeamName("");
    }
  }, [teamId, cameraTeamsRaw, camerasLoading]);

  const pageProps = useMemo(() => {
    return {
      title: !teamName ? (camerasLoading ? "Loading..." : "Team not found") : teamName,
      breadcrumbs: [
        { label: "Cameras", href: "/modules/cameras" },
        { label: teamName, href: `/modules/cameras/${teamId}`, isActive: true }
      ]
    };
  }, [teamName, camerasLoading, teamId]);

  if (camerasLoading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading..." />
      </PageWrapper>
    );
  }

  if (players.length === 0 && !camerasLoading) {
    return (
      <PageWrapper {...pageProps}>
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            {teamName ? "No Players Found" : "Team Not Found"}
          </h2>
          <p className="text-gray-400 mb-4">
            {teamName
              ? `No camera feeds configured for ${teamName}`
              : "This team doesn't exist or you don't have access to it"}
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/modules/cameras")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Cameras Hub
            </button>
            <button
              onClick={() => router.push("/modules/teams")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              My Teams
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <CameraStream
      players={players}
      teamName={teamName}
      width="100%"
      height="auto"
      aspectRatio="16/9"
      showPlayerName={true}
      showRandomModeIndicator={true}
      enableKeyboardControls={true}
      enableRandomMode={true}
      randomModeInterval={5000}
      className="w-full"
    />
  );
}
