"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useUser } from "@lib/contexts/AuthContext";
import { useElectron } from "@lib/contexts/ElectronContext";
import { useDownload } from "@lib/contexts/DownloadContext";
import { AssetDownloadProgress } from "@/lib/components/system/LCU";
import { getVisibleModules, ModuleCard } from "@lib/navigation";
import { tournamentStorage, LastSelectedTournament } from "@lib/services/tournament";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { SpotlightCard } from "@lib/components/features/modules/SpotlightCard";

export default function ModulesPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const user = useUser();
  const { isElectron, useLocalData } = useElectron();
  const { downloadState: downloadState, cancelDownload } = useDownload();
  const [hasLastSelectedTournament, setHasLastSelectedTournament] = useState(false);
  const [lastSelectedTournament, setLastSelectedTournament] = useState<LastSelectedTournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setActiveModule("modules");
  }, [setActiveModule]);

  useEffect(() => {
    const checkLastSelectedTournament = async () => {
      try {
        const lastSelected = await tournamentStorage.getLastSelectedTournament();
        const isValid = await tournamentStorage.isLastSelectedTournamentValid();
        setHasLastSelectedTournament(isValid);
        setLastSelectedTournament(lastSelected);
      } catch (error) {
        console.error("Failed to check last selected tournament:", error);
        setHasLastSelectedTournament(false);
        setLastSelectedTournament(null);
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

  // Memoize the visible modules to prevent unnecessary recalculations
  const visibleModules = useMemo(() => {
    const isAuthenticated = !!user;
    const isAdmin = Boolean(user?.isAdmin);

    const modules = getVisibleModules({
      isElectron,
      useLocalData,
      isAuthenticated,
      isAdmin,
      hasLastSelectedTournament
    });

    return modules;
  }, [user, isElectron, useLocalData, hasLastSelectedTournament]);

  // Block access if downloads are in progress in Electron
  if (
    isElectron &&
    downloadState.progress &&
    downloadState.isDownloading &&
    downloadState.progress.stage !== "complete" &&
    downloadState.progress.stage !== "error"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AssetDownloadProgress progress={downloadState.progress} onCancel={cancelDownload} />
      </div>
    );
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
          console.log("Pushing to tournament module:", module.name);
          console.log("Tournament ID:", lastSelectedTournament.tournamentId);
          console.log("Module ID:", module.id);
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

  const isHiddenBehindTournament = (module: ModuleCard) =>
    module.name === "Matches" || module.name === "Commentators" || module.name === "Sponsors";

  if (isLoading) {
    return (
      <PageWrapper
        title="Modules"
        subtitle="Loading modules..."
        contentClassName="max-w-7xl mx-auto"
        loadingComponent={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <SpotlightCard
                key={index}
                className="animate-pulse min-h-48"
                loading={true}
                module={{
                  id: `loading-${index}`,
                  name: "Loading...",
                  description: "Loading module...",
                  path: "",
                  status: "available",
                  color: "from-gray-500 to-gray-600",
                  spotlightColor: "#6B7280",
                  icon: "📦",
                  category: "core"
                }}
                isHiddenBehindTournament={false}
              />
            ))}
          </div>
        }
      >
        <div />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Modules"
      subtitle={`Welcome back, ${user?.username || "User"}! Choose a module to get started.`}
      contentClassName="max-w-7xl mx-auto"
    >
      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleModules.map((module) => (
          <SpotlightCard
            key={module.id}
            onClick={() => handleModuleClick(module)}
            className={`cursor-pointer p-6 ${module.status === "coming-soon" ? "opacity-50 cursor-not-allowed" : ""}`}
            spotlightColor={module.spotlightColor}
            module={module}
            isHiddenBehindTournament={isHiddenBehindTournament(module)}
            lastSelectedTournament={lastSelectedTournament || undefined}
          />
        ))}
      </div>
    </PageWrapper>
  );
}
