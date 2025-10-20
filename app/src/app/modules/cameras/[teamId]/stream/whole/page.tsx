"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { CameraPlayer, CameraTeam } from "@libCamera/types";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { useCameras } from "@libCamera/context/CamerasContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { CameraStream } from "@libCamera/components/CameraStream";

export default function TeamCameraStreamPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const { teams: cameraTeamsRaw, loading: camerasLoading, refreshCameras } = useCameras();
  const [players, setPlayers] = useState<CameraPlayer[]>([]);
  const [teamName, setTeamName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { setRemoveSidebar } = useNavigation();

  useEffect(() => {
    setRemoveSidebar(true);
    
    return () => {
      setRemoveSidebar(false);
    };
  }, [setRemoveSidebar]);

  useEffect(() => {
    setLoading(true);

    if (teamId) {
      // First, ensure we have camera data
      if (!cameraTeamsRaw || (Array.isArray(cameraTeamsRaw) && cameraTeamsRaw.length === 0)) {
        refreshCameras();
      }
    }
  }, [teamId, cameraTeamsRaw, refreshCameras]);

  // Set loading to false when camera data is loaded
  useEffect(() => {
    if (!camerasLoading) {
      setLoading(false);
    }
  }, [camerasLoading]);

  // Derive team players from CamerasContext
  useEffect(() => {
    if (!teamId) return;
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
    } else if (!camerasLoading) {
      setPlayers([]);
      setTeamName("");
    }
  }, [teamId, cameraTeamsRaw, camerasLoading]);

  const pageProps = useMemo(() => {
    return {
      title: !teamName ? (loading ? "Loading..." : "Team not found") : teamName,
      breadcrumbs: [
        { label: "Cameras", href: "/modules/cameras" },
        { label: teamName, href: `/modules/cameras/${teamId}/stream`, isActive: true }
      ]
    };
  }, [teamName, loading, teamId]);

  if (loading) {
    return (
      <></>
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
    <div className="w-full aspect-video bg-black">
      {/* Top row - 2 cameras */}
      <div className="grid grid-cols-2 h-1/2 gap-1">
        {players.slice(0, 2).map((player, index) => (
          <div key={`${player.inGameName || player.playerName || "player"}-${index}`} className="aspect-video bg-black">
            <CameraStream
              players={[player]}
              teamName={teamName}
              width="100%"
              height="100%"
              aspectRatio="16/9"
              showPlayerName={true}
              showRandomModeIndicator={false}
              enableKeyboardControls={false}
              enableRandomMode={false}
              objectFit="cover"
              playerNameSize="small"
              className="w-full h-full"
            />
          </div>
        ))}
      </div>

      {/* Bottom row - 3 cameras */}
      <div className="grid grid-cols-3 h-1/2 gap-1">
        {players.slice(2, 5).map((player, index) => (
          <div key={`${player.inGameName || player.playerName || "player"}-${index + 2}`} className="aspect-video bg-black">
            <CameraStream
              players={[player]}
              teamName={teamName}
              width="100%"
              height="100%"
              aspectRatio="16/9"
              showPlayerName={true}
              showRandomModeIndicator={false}
              enableKeyboardControls={false}
              enableRandomMode={false}
              objectFit="cover"
              playerNameSize="small"
              className="w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
