"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useUser } from "@lib/contexts/AuthContext";
import { useElectron } from "@lib/contexts/ElectronContext";
import { useDownload } from "@lib/contexts/DownloadContext";
import { getVisibleModules, ModuleCard } from "@lib/navigation";
import { tournamentStorage, LastSelectedTournament } from "@lib/services/tournament";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { SpotlightCard } from "@lib/components/features/modules/SpotlightCard";


export default function ModulesPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const user = useUser();
  const { isElectron, useLocalData } = useElectron();
  const { downloadState: downloadState } = useDownload();
  const [hasLastSelectedTournament, setHasLastSelectedTournament] = useState(false);
  const [lastSelectedTournament, setLastSelectedTournament] = useState<LastSelectedTournament | null>(null);
  const [loading, setIsLoading] = useState(true);

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

  if (loading) {
    return (
      <PageWrapper
        title="Modules"
        subtitle="Loading modules..."
        contentClassName="max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(null).map((_, index) => (
            <SpotlightCard
              key={index}
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
              loading={true}
              spotlightColor="#6B7280"
              isHiddenBehindTournament={false}
            />
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Modules"
      subtitle={`Welcome back, ${user?.username ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : "User"}! Choose a module to get started.`}
      contentClassName="max-w-7xl mx-auto"
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
            lastSelectedTournament={lastSelectedTournament || undefined}
          />
        ))}
      </div>
    </PageWrapper>
  );
}
