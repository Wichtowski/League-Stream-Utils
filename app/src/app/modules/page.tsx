"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useUser } from "@lib/contexts/AuthContext";
import { useElectron } from "@libElectron/contexts/ElectronContext";
import { useDownload } from "@lib/contexts/DownloadContext";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { getVisibleModules, ModuleCard } from "@lib/navigation";
import { tournamentStorage, LastSelectedTournament } from "@lib/services/tournament";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { SpotlightCard } from "@lib/components/modules/SpotlightCard";
import { Button } from "@lib/components/common/button/Button";
import { matchStorage } from "@lib/services/match/match-storage";
import { LastSelectedMatch } from "@lib/services/match/match-storage";
import { LoadingSpinner } from "@lib/components/common";

export default function ModulesPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const user = useUser();
  const { isElectron, useLocalData } = useElectron();
  const { downloadState: downloadState } = useDownload();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [hasLastSelectedTournament, setHasLastSelectedTournament] = useState(false);
  const [lastSelectedTournament, setLastSelectedTournament] = useState<LastSelectedTournament | null>(null);
  const [lastSelectedTournamentName, setLastSelectedTournamentName] = useState<string | null>(null);
  const [loading, setIsLoading] = useState(true);
  const [hasLastSelectedMatch, setHasLastSelectedMatch] = useState(false);
  const [lastSelectedMatch, setLastSelectedMatch] = useState<LastSelectedMatch | null>(null);

  useEffect(() => {
    setActiveModule("modules");
  }, [setActiveModule]);

  useEffect(() => {
    const checkLastSelectedTournament = async () => {
      try {
        const lastSelectedTournament = await tournamentStorage.getLastSelectedTournament();
        const isValid = lastSelectedTournament !== null;
        setHasLastSelectedTournament(isValid);
        setLastSelectedTournament(lastSelectedTournament);

        const lastSelectedMatch = await matchStorage.getLastSelectedMatch();
        const isValidMatch = lastSelectedMatch !== null;
        setHasLastSelectedMatch(isValidMatch);
        setLastSelectedMatch(lastSelectedMatch);
      } catch (error) {
        console.error("Failed to check last selected tournament:", error);
        setHasLastSelectedTournament(false);
        setLastSelectedTournament(null);
        setHasLastSelectedMatch(false);
        setLastSelectedMatch(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkLastSelectedTournament();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkLastSelectedTournament();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const loadTournamentName = async () => {
      try {
        const id = lastSelectedTournament?.tournamentId;
        if (!id) {
          setLastSelectedTournamentName(null);
          return;
        }
        const res = await authenticatedFetch(`/api/v1/tournaments/${id}`);
        if (!res.ok) {
          setLastSelectedTournamentName(null);
          return;
        }
        const data = await res.json();
        setLastSelectedTournamentName(data?.tournament?.name ?? null);
      } catch {
        setLastSelectedTournamentName(null);
      }
    };
    loadTournamentName();
  }, [lastSelectedTournament, authenticatedFetch]);

  // Memoize the visible modules to prevent unnecessary recalculations
  const visibleModules = useMemo(() => {
    const isAuthenticated = !!user;
    const isAdmin = Boolean(user?.isAdmin);

    const modules = getVisibleModules({
      isElectron,
      useLocalData,
      isAuthenticated,
      isAdmin,
      hasLastSelectedTournament,
      hasLastSelectedMatch
    });

    return modules;
  }, [user, isElectron, useLocalData, hasLastSelectedTournament, hasLastSelectedMatch]);

  useEffect(() => {
    if (
      isElectron &&
      downloadState.progress &&
      downloadState.isDownloading &&
      downloadState.progress.stage !== "complete" &&
      downloadState.progress.stage !== "error"
    ) {
      router.push("/download");
    }
  }, [isElectron, downloadState.progress, downloadState.isDownloading, router]);

  if (
    isElectron &&
    downloadState.progress &&
    downloadState.isDownloading &&
    downloadState.progress.stage !== "complete" &&
    downloadState.progress.stage !== "error"
  ) {
    return null;
  }

  const handleModuleClick = (module: ModuleCard) => {
    try {
      if (module.status === "coming-soon") {
        return;
      }
      if (isHiddenBehindTournament(module)) {
        if (!lastSelectedTournament) {
          return;
        } else {
          router.push(`/modules/tournaments/${lastSelectedTournament.tournamentId}/${module.id}`);
          return;
        }
      } else {
        router.push(module.path);
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const handleRemoveLastSelectedTournament = () => {
    tournamentStorage.clearLastSelectedTournament();
    setLastSelectedTournament(null);
  }

  const handleRemoveLastSelectedMatch = () => {
    matchStorage.clearLastSelectedMatch();
    setLastSelectedMatch(null);
  }

  const isHiddenBehindTournament = (module: ModuleCard) =>
    module.name === "Matches" || module.name === "Commentators" || module.name === "Sponsors";


  if (loading) {
    return (
      <PageWrapper title="Modules" subtitle="Loading modules..." contentClassName="max-w-7xl mx-auto">
        <LoadingSpinner fullscreen>Loading Modules...</LoadingSpinner>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Modules"
      subtitle={`Welcome back, ${user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : "User"}! Choose a module to get started.`}
      contentClassName="max-w-7xl mx-auto"
      actions={
        lastSelectedTournament || lastSelectedMatch ? (
          <>
            <span>Remove Last Selected:</span>
            {lastSelectedTournament ? (
              <Button onClick={() => handleRemoveLastSelectedTournament()}>
                Tournament
              </Button>
            ) : null}
            {lastSelectedMatch ? (
              <Button onClick={() => handleRemoveLastSelectedMatch()}>
                Match
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleModules.map((module) => (
          <SpotlightCard
            key={module.id}
            onClick={() => handleModuleClick(module)}
            className={`cursor-pointer p-6 ${module.status === "coming-soon" ? "opacity-50 cursor-not-allowed" : ""}`}
            spotlightColor={module.spotlightColor}
            module={module}
            isHiddenBehindTournament={isHiddenBehindTournament(module)}
            tournamentName={lastSelectedTournamentName || undefined}
          />
        ))}
      </div>
    </PageWrapper>
  );
}
