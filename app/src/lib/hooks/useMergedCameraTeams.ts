"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@lib/contexts/AuthContext";
import { useCameras } from "@/libCamera/context/CamerasContext";

import type { CameraPlayer, CameraTeam, Team } from "@lib/types";

export type MergedPlayer = Team["players"]["main"][number] & {
  inGameName: string;
  cameraUrl: string | null;
};

export interface MergedTeamPlayers {
  main: MergedPlayer[];
  substitutes: MergedPlayer[];
}

type BaseMergedTeam = {
  id: string;
  name: string;
  logo: Team["logo"];
};

export type MergedTeamWithPlayers = BaseMergedTeam & { players: MergedTeamPlayers };
export type MergedTeamWithAllPlayers = BaseMergedTeam & { allPlayers: MergedPlayer[] };

function mapPlayerWithCameraUrl(
  player: Team["players"]["main"][number],
  cameraTeam?: CameraTeam | undefined
): MergedPlayer {
  const cameraPlayer = cameraTeam?.players.find(
    (cp: CameraPlayer) =>
      (cp.playerId && cp.playerId === player.id) || (cp.inGameName && cp.inGameName === player.inGameName)
  );
  return {
    ...player,
    cameraUrl: cameraPlayer?.url ?? null
  };
}

function useMergedCameraTeams(withAllPlayers: true): {
  mergedTeams: MergedTeamWithAllPlayers[];
  loading: boolean;
  refresh: () => Promise<void>;
};
function useMergedCameraTeams(withAllPlayers?: false): {
  mergedTeams: MergedTeamWithPlayers[];
  loading: boolean;
  refresh: () => Promise<void>;
};
function useMergedCameraTeams(withAllPlayers = false) {
  const { isLoading: authLoading } = useAuth();
  const { teams: cameraTeamsRaw, loading: camerasLoading, refreshCameras } = useCameras();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const hasRefreshed = useRef(false);
  const [internalLoading, setInternalLoading] = useState(true);

  const cameraTeams = useMemo(() => (cameraTeamsRaw as unknown as CameraTeam[]) || [], [cameraTeamsRaw]);

  useEffect(() => {
    if (!authLoading && !camerasLoading && !teamsLoading) {
      setInternalLoading(false);
    }
  }, [authLoading, camerasLoading, teamsLoading]);

  // Fetch teams directly
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("/api/v1/teams", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserTeams(data.teams || []);
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchTeams();
  }, []);

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

  const mergedTeams = useMemo(() => {
    const result = userTeams.map((team) => {
      const cameraTeam = cameraTeams.find((ct: CameraTeam) => ct.teamId === team.id);
      if (withAllPlayers) {
        const allPlayers = [
          ...team.players.main.map((p) => mapPlayerWithCameraUrl(p, cameraTeam)),
          ...team.players.substitutes.map((p) => mapPlayerWithCameraUrl(p, cameraTeam))
        ];
        return {
          id: team.id,
          name: team.name,
          logo: team.logo,
          allPlayers
        } as MergedTeamWithAllPlayers;
      }

      return {
        id: team.id,
        name: team.name,
        logo: team.logo,
        players: {
          main: team.players.main.map((p) => mapPlayerWithCameraUrl(p, cameraTeam)),
          substitutes: team.players.substitutes.map((p) => mapPlayerWithCameraUrl(p, cameraTeam))
        }
      } as MergedTeamWithPlayers;
    });
    return result;
  }, [userTeams, cameraTeams, withAllPlayers]);

  const loading = authLoading || internalLoading;

  const refresh = async (): Promise<void> => {
    await refreshCameras();
    // Refresh teams by refetching
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/teams", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserTeams(data.teams || []);
      }
    } catch (error) {
      console.error("Error refreshing teams:", error);
    }
  };

  return { mergedTeams, loading, refresh };
}

export { useMergedCameraTeams };

