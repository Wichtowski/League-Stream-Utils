"use client";

import React, { useEffect, useState, type ReactElement, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { useCameras } from "@libCamera/context/CamerasContext";
import { CameraPlayer, CameraTeam } from "@libCamera/types";
import {
  TeamSetupHeader,
  ProgressBar,
  TeamStreamSection,
  PlayerStreamCard,
  QuickActions,
  HelpSection
} from "@libCamera/components";
import { useMergedCameraTeams } from "@lib/hooks/useMergedCameraTeams";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { LoadingSpinner } from "@lib/components/common";

export default function TeamCameraSetupPage(): ReactElement {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const { isLoading: authLoading } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { teams: cameraTeamsRaw, loading: camerasLoading, refreshCameras } = useCameras();
  const { mergedTeams, loading: mergedLoading } = useMergedCameraTeams(true);

  const [team, setTeam] = useState<CameraTeam | null>(null);
  const [saving, setSaving] = useState(false);

  const baseTeam = mergedTeams.find((t) => t._id === teamId);

  const pageProps = useMemo(() => {
    return {
      title: "Manage camera stream settings",
      breadcrumbs: [
        { label: "Camera Hub", href: "/modules/cameras" },
        { label: "Setup", href: `/modules/cameras/setup` },
        { label: team?.teamName || "Camera Setup", href: `/modules/cameras/setup/${teamId}`, isActive: true }
      ]
    }
  }, [team, teamId]);

  useEffect(() => {
    setActiveModule("cameras");
  }, [setActiveModule]);

  // Build team data when baseTeam is available
  useEffect(() => {
    if (!baseTeam) return;

    console.log("Building team data for:", baseTeam.name);
    console.log("Base team allPlayers:", baseTeam.allPlayers);

    const cameraTeams = (cameraTeamsRaw as unknown as CameraTeam[]) || [];
    const foundTeam = cameraTeams.find((t) => t.teamId === teamId) || null;

    const allPlayers = (baseTeam.allPlayers || []).map((player) => {
      const cameraPlayer = foundTeam?.players.find(
        (cp: CameraPlayer) =>
          (cp.playerId && cp.playerId === player._id) || (cp.inGameName && cp.inGameName === player.inGameName)
      );
      return {
        ...player,
        playerId: player._id,
        playerName: player.inGameName,
        url: cameraPlayer?.url || "",
        imagePath: cameraPlayer?.imagePath || ""
      };
    });

    console.log("Mapped players:", allPlayers);

    setTeam({
      teamId: baseTeam._id,
      teamName: baseTeam.name,
      teamLogo: baseTeam.logo?.data,
      players: allPlayers,
      teamStreamUrl: foundTeam?.teamStreamUrl || ""
    });
  }, [baseTeam, cameraTeamsRaw, teamId]);

  const updatePlayerUrl = (playerId: string, url: string) => {
    if (!team) return;

    setTeam({
      ...team,
      players: team.players.map((player) =>
        player.playerId === playerId ? { ...player, url, imagePath: url } : player
      )
    });
  };

  const updateTeamStreamUrl = (url: string) => {
    if (!team) return;
    setTeam({ ...team, teamStreamUrl: url });
  };

  const saveSettings = async () => {
    if (!team) return;

    try {
      setSaving(true);

      const currentTeams = ((cameraTeamsRaw as unknown as CameraTeam[]) || []).slice();
      const existingIndex = currentTeams.findIndex((t) => t.teamId === teamId);
      if (existingIndex >= 0) {
        currentTeams[existingIndex] = team;
      } else {
        currentTeams.push(team);
      }

      const saveResponse = await authenticatedFetch("/api/v1/cameras/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ teams: currentTeams })
      });

      if (saveResponse.ok) {
        await showAlert({
          type: "success",
          message: "Camera settings saved successfully!"
        });
        await refreshCameras();
      } else {
        await showAlert({
          type: "error",
          message: "Failed to save camera settings"
        });
      }
    } catch (error) {
      console.error("Error saving camera settings:", error);
      await showAlert({
        type: "error",
        message: "Failed to save camera settings"
      });
    } finally {
      setSaving(false);
    }
  };

  // Show loading while data is being fetched
  if (authLoading || mergedLoading || camerasLoading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading team..." />
      </PageWrapper>
    );
  }

  // Show not found only after all loading is complete and no team found
  if (!baseTeam) {
    return (
      <PageWrapper {...pageProps}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Team Not Found</h2>
            <button
              onClick={() => router.push("/modules/cameras/setup")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Back to Setup
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Show loading while team data is being built
  if (!team) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Preparing team data..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps}>
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <TeamSetupHeader
            teamName={team.teamName}
            teamLogo={team.teamLogo}
            saving={saving}
            onSave={saveSettings}
          />

          <ProgressBar
            completed={team.players.filter((p) => p.url && p.url.trim() !== "").length}
            total={team.players.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <TeamStreamSection teamStreamUrl={team.teamStreamUrl || ""} onChange={updateTeamStreamUrl} />
            {team.players.map((player) => (
              <PlayerStreamCard key={player.playerId} player={player} onChange={updatePlayerUrl} />
            ))}
          </div>

          <QuickActions teamId={teamId} />

          <HelpSection />
        </div>
      </div>
    </PageWrapper>
  );
}