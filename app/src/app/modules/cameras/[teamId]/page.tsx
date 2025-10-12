"use client";

import React, { useEffect, useState, type ReactElement, useMemo } from "react";
import { useParams } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { useCameras } from "@libCamera/context/CamerasContext";
import { CameraPlayer, CameraTeam } from "@libCamera/types";
import {
  TeamSetupHeader,
  ProgressBar,
  StreamUrlInput,
  QuickActions,
  HelpSection
} from "@libCamera/components";
import { useMergedCameraTeams } from "@lib/hooks/useMergedCameraTeams";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { LoadingSpinner } from "@lib/components/common";
import { validateStreamUrl } from "@libCamera/utils/urlValidation";

export default function TeamCameraSetupPage(): ReactElement {
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
  const [isMobile, setIsMobile] = useState(false);
  const baseTeam = mergedTeams.find((t) => t._id === teamId);

  const pageProps = useMemo(() => {
    return {
      title: "Manage camera stream settings",
      breadcrumbs: [
        { label: "Cameras", href: "/modules/cameras" },
        { label: team?.teamName || "Camera Setup", href: `/modules/cameras/${teamId}`, isActive: true }
      ]
    };
  }, [team, teamId]);

  useEffect(() => {
    setActiveModule("cameras");
  }, [setActiveModule]);

  useEffect(() => {
    const updateWindowWidth = (): void => {
      setIsMobile(window.innerWidth <= 1280 && window.innerWidth > 0);
    };
    
    updateWindowWidth();
    window.addEventListener('resize', updateWindowWidth);
    
    return () => {
      window.removeEventListener('resize', updateWindowWidth);
    };
  }, []);

  // Build team data when baseTeam is available
  useEffect(() => {
    if (!baseTeam) return;

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

    const invalidUrls: string[] = [];
    
    // Check team stream URL
    if (team.teamStreamUrl && team.teamStreamUrl.trim() !== "") {
      const teamValidation = validateStreamUrl(team.teamStreamUrl);
      if (!teamValidation.isValid) {
        invalidUrls.push(`Team Stream: ${teamValidation.error}`);
      }
    }
    
    // Check player URLs
    team.players.forEach((player) => {
      if (player.url && player.url.trim() !== "") {
        const playerValidation = validateStreamUrl(player.url);
        if (!playerValidation.isValid) {
          invalidUrls.push(`${player.playerName || player.inGameName || "Player"}: ${playerValidation.error}`);
        }
      }
    });
    
    // Show error if any URLs are invalid
    if (invalidUrls.length > 0) {
      await showAlert({
        type: "error",
        message: `Invalid URLs found:\n${invalidUrls.join("\n")}`
      });
      return;
    }

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
          <TeamSetupHeader teamName={team.teamName} teamLogo={team.teamLogo} saving={saving} onSave={saveSettings} />

          <ProgressBar
            completed={team.players.filter((p) => p.url && p.url.trim() !== "").length}
            total={team.players.length}
          />

          <div className="space-y-6 mb-8">
            <StreamUrlInput
              title="Team Stream"
              description="Single stream representing the whole team"
              url={team.teamStreamUrl || ""}
              onChange={updateTeamStreamUrl}
              placeholder="https://twitch.tv/team or OBS Stream URL"
              className="w-full"
            />
            {!isMobile ? (
              <>
                {/* Top row - 3 players */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {team.players.slice(0, 3).map((player) => (
                    <StreamUrlInput
                      key={player.playerId}
                      title={player.playerName || player.inGameName || "Unknown Player"}
                      url={player.url || ""}
                      onChange={(url) => updatePlayerUrl(player.playerId || "", url)}
                      placeholder="https://twitch.tv/player or OBS Stream URL"
                    />
                  ))}
                </div>
                
                {/* Bottom row - 2 players centered */}
                {team.players.length > 3 && (
                  <div className="flex justify-center w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {team.players.slice(3, 5).map((player) => (
                        <StreamUrlInput
                          key={player.playerId}
                          title={player.playerName || player.inGameName || "Unknown Player"}
                          url={player.url || ""}
                          onChange={(url) => updatePlayerUrl(player.playerId || "", url)}
                          className="min-w-[334px] min-h-[184px]"
                          placeholder="https://twitch.tv/player or OBS Stream URL"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {team.players.map((player) => (
                  <StreamUrlInput
                    key={player.playerId}
                    title={player.playerName || player.inGameName || "Unknown Player"}
                    url={player.url || ""}
                    onChange={(url) => updatePlayerUrl(player.playerId || "", url)}
                    placeholder="https://twitch.tv/player or OBS Stream URL"
                  />
                ))}
              </div>
            )}
          </div>

          <QuickActions teamId={teamId} players={team.players} isMobile={isMobile} />

          <HelpSection />
        </div>
      </div>
    </PageWrapper>
  );
}
