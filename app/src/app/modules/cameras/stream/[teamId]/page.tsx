"use client";

import React, { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { CameraPlayer, CameraTeam } from "@libCamera/types";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { useCameras } from "@libCamera/context/CamerasContext";
import { SafeImage } from "@lib/components/common/SafeImage";
import { LoadingSpinner } from "@lib/components/common";

export default function TeamCameraStreamPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const { setActiveModule } = useNavigation();
  const { teams: cameraTeamsRaw, loading: camerasLoading, refreshCameras } = useCameras();
  const [players, setPlayers] = useState<CameraPlayer[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<CameraPlayer | null>(null);
  const [randomMode, setRandomMode] = useState(true);
  const [teamName, setTeamName] = useState<string>("");

  const getRandomPlayer = useCallback((): CameraPlayer | null => {
    if (players.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * players.length);
    return players[randomIndex];
  }, [players]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === " ") {
        const nextPlayer = getRandomPlayer();
        if (nextPlayer) {
          setCurrentPlayer(nextPlayer);
        }
      } else if (e.key.toLowerCase() === "r") {
        setRandomMode((prev) => !prev);
      } else if (e.key >= "1" && e.key <= "9") {
        const playerIndex = parseInt(e.key) - 1;
        if (playerIndex >= 0 && playerIndex < players.length) {
          setCurrentPlayer(players[playerIndex]);
          setRandomMode(false);
        }
      }
    },
    [players, getRandomPlayer]
  );

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

  // Set initial player when players are loaded
  useEffect(() => {
    if (players.length > 0 && !currentPlayer) {
      const initialPlayer = getRandomPlayer();
      if (initialPlayer) {
        setCurrentPlayer(initialPlayer);
      }
    }
  }, [players, currentPlayer, getRandomPlayer]);

  // Keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Random mode timer
  useEffect(() => {
    if (!randomMode || players.length <= 1) return;

    const interval = setInterval(() => {
      const nextPlayer = getRandomPlayer();
      if (nextPlayer) {
        setCurrentPlayer(nextPlayer);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [randomMode, players.length, getRandomPlayer]);

  const pageProps = useMemo(() => {
    return {
      title: !teamName ? (camerasLoading ? "Loading..." : "Team not found") : teamName,
      breadcrumbs: [
        { label: "Camera Hub", href: "/modules/cameras" },
        { label: teamName, href: `/modules/cameras/stream/${teamId}`, isActive: true }
      ]
    }
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
              : "This team doesn't exist or you don't have access to it"
            }
          </p>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/modules/cameras")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Camera Hub
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
    <Suspense fallback={<LoadingSpinner fullscreen text="Loading..." />}>
      <div className="relative w-full aspect-video">
        {/* Main Stream Display */}
        {currentPlayer && (
          <div className="absolute inset-0 w-full h-full block">
            {currentPlayer.url ? (
              <iframe
                src={currentPlayer.url}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                title={`${currentPlayer.inGameName || currentPlayer.playerName} camera feed`}
              />
            ) : currentPlayer.imagePath ? (
              <SafeImage
                src={currentPlayer.imagePath}
                alt={currentPlayer.inGameName || currentPlayer.playerName || "Player"}
                fill={true}
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-2xl mb-2">📹</div>
                  <p className="text-sm">No feed</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Player Name Overlay */}
        {currentPlayer && (
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black via-black/70 to-transparent py-8 px-4">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-white drop-shadow-lg">
                {currentPlayer.inGameName || currentPlayer.playerName || "Unknown Player"}
              </h2>
            </div>
          </div>
        )}
      </div>
      {/* Random Mode Indicator */}
      {randomMode && (
        <div className="flex justify-center mt-4">
          <div className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium animate-pulse">
            🔄 Random Mode Active
          </div>
        </div>
      )}
    </Suspense>
  );
}