"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useElectron } from "@libElectron/contexts/ElectronContext";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import type { Team } from "@lib/types";

import { useCameras } from "@libCamera/context/CamerasContext";
import { CameraPlayer, CameraTeam } from "@libCamera/types/camera";
import {
  TeamSetupHeader,
  ProgressBar,
  TeamStreamSection,
  PlayerStreamCard,
  QuickActions,
  HelpSection
} from "@libCamera/components";

export default function TeamCameraSetupPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const { user, isLoading: authLoading } = useAuth();
  const { isElectron, useLocalData } = useElectron();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const { teams: cameraTeamsRaw, loading: camerasLoading, refreshCameras } = useCameras();
  const [team, setTeam] = useState<CameraTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Find the full team info from userTeams
  const fullTeam = userTeams.find((t) => t._id === teamId);

  // Set module once
  useEffect(() => {
    setActiveModule("cameras");
  }, [setActiveModule]);

  // Fetch teams directly
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/v1/teams", {
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          setUserTeams(data.teams || []);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    fetchTeams();
  }, []);

  // Build team view from context (and refresh once if empty)
  useEffect(() => {
    if (authLoading) return;
    if (!user && !(isElectron && useLocalData)) {
      router.push("/login");
      return;
    }

    let cancelled = false;
    const ensureDataAndCompose = async (): Promise<void> => {
      try {
        setLoading(true);
        if ((!cameraTeamsRaw || (Array.isArray(cameraTeamsRaw) && cameraTeamsRaw.length === 0)) && !camerasLoading) {
          await refreshCameras();
        }

        const cameraTeams = (cameraTeamsRaw as unknown as CameraTeam[]) || [];
        const foundTeam = cameraTeams.find((t) => t.teamId === teamId) || null;

        if (!cancelled) {
          if (fullTeam) {
            const allPlayers = [...fullTeam.players.main, ...fullTeam.players.substitutes].map((player) => {
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
            setTeam({
              teamId: fullTeam._id,
              teamName: fullTeam.name,
              teamLogo: fullTeam.logo?.data,
              players: allPlayers,
              teamStreamUrl: foundTeam?.teamStreamUrl || ""
            });
          } else {
            router.push("/modules/cameras/setup");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void ensureDataAndCompose();
    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    user,
    isElectron,
    useLocalData,
    router,
    teamId,
    fullTeam,
    cameraTeamsRaw,
    camerasLoading,
    refreshCameras
  ]);

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

      // Save updated settings
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
        // Optionally refresh context after save
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
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
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <TeamSetupHeader
          teamId={teamId}
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
  );
}
