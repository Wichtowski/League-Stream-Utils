"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useUser } from "@lib/contexts/AuthContext";
import { useElectron } from "@libElectron/contexts/ElectronContext";
import { useDownload } from "@lib/contexts/DownloadContext";
import { getVisibleModules, ModuleCard } from "@lib/navigation";
import { useCurrentMatch, useCurrentTournament } from "@lib/contexts";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { SpotlightCard } from "@lib/components/modules/SpotlightCard";
import { Button } from "@lib/components/common/button/Button";
import { LoadingSpinner } from "@lib/components/common";

export default function ModulesPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const user = useUser();
  const { isElectron, useLocalData } = useElectron();
  const { downloadState: downloadState } = useDownload();
  const { clearCurrentTournament, currentTournament } = useCurrentTournament();
  const { currentMatch } = useCurrentMatch();
  const [loading] = useState(false);

  useEffect(() => {
    setActiveModule("modules");
  }, [setActiveModule]);

  // Memoize the visible modules to prevent unnecessary recalculations
  const visibleModules = useMemo(() => {
    const isAuthenticated = !!user;
    const isAdmin = Boolean(user?.isAdmin);

    const modules = getVisibleModules({
      isElectron,
      useLocalData,
      isAuthenticated,
      isAdmin,
      needsTournamentSelected: currentTournament !== null,
      needsMatchSelected: currentMatch !== null
    });

    return modules;
  }, [user, isElectron, useLocalData, currentTournament, currentMatch]);

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
        if (!currentTournament) {
          return;
        } else {
          router.push(`/modules/tournaments/${currentTournament._id}/${module.id}`);
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
    clearCurrentTournament();
  }

  const handleRemoveLastSelectedMatch = () => {
    // Use context action if needed; for now, match context is authoritative
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
        currentTournament || currentMatch ? (
          <>
            <span>Remove Last Selected:</span>
            {currentTournament ? (
              <Button onClick={() => handleRemoveLastSelectedTournament()}>
                Tournament
              </Button>
            ) : null}
            {currentMatch ? (
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
            tournamentName={currentTournament?.name || undefined}
          />
        ))}
      </div>
    </PageWrapper>
  );
}
