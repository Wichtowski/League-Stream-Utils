"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useUser } from "@lib/contexts/AuthContext";
import { useElectron } from "@lib/contexts/ElectronContext";
import { useDownload } from "@lib/contexts/DownloadContext";
import { AssetDownloadProgress } from "@lib/components/LCU";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { getVisibleModules, ModuleCard } from "@lib/navigation";
import {
  tournamentStorage,
  LastSelectedTournament,
} from "@lib/utils/storage/tournament-storage";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { SpotlightCard } from "@lib/components/pages/modules";

export default function ModulesPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const user = useUser();
  const { isElectron, useLocalData } = useElectron();
  const { downloadState: downloadState, cancelDownload } = useDownload();
  const [hasLastSelectedTournament, setHasLastSelectedTournament] =
    useState(false);
  const [lastSelectedTournament, setLastSelectedTournament] =
    useState<LastSelectedTournament | null>(null);

  useEffect(() => {
    setActiveModule("modules");
  }, [setActiveModule]);

  useEffect(() => {
    const checkLastSelectedTournament = async () => {
      try {
        const lastSelected =
          await tournamentStorage.getLastSelectedTournament();
        const isValid = await tournamentStorage.isLastSelectedTournamentValid();
        setHasLastSelectedTournament(isValid);
        setLastSelectedTournament(lastSelected);
      } catch (error) {
        console.error("Failed to check last selected tournament:", error);
        setHasLastSelectedTournament(false);
        setLastSelectedTournament(null);
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
      hasLastSelectedTournament,
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
        <AssetDownloadProgress
          progress={downloadState.progress}
          onCancel={cancelDownload}
        />
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
          router.push(
            `/modules/tournaments/${lastSelectedTournament.tournamentId}/${module.id}`,
          );
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
    module.name === "Matches" ||
    module.name === "Commentators" ||
    module.name === "Sponsors";



  return (
    <PageWrapper
      title="Modules"
      subtitle={`Welcome back, ${user?.username || "User"}! Choose a module to get started.`}
      actions={
        isElectron ? (
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-sm text-gray-400">
                Mode:{" "}
                <span
                  className={
                    useLocalData ? "text-green-400" : "text-blue-400"
                  }
                >
                  {useLocalData ? "Local Data" : "Online"}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push("/settings")}
              className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-colors"
              title="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5 text-gray-400 hover:text-gray-300" />
            </button>
          </div>
        ) : undefined
      }
      contentClassName="max-w-7xl mx-auto"
    >
      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleModules.map((module) => (
          <SpotlightCard
            key={module.id}
            onClick={() => handleModuleClick(module)}
            className={`cursor-pointer p-6 ${module.status === "coming-soon" ? "opacity-50 cursor-not-allowed" : ""}`}
            color={module.spotlightColor}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center text-2xl`}
              >
                {module.icon}
              </div>
              <div className="flex items-center space-x-2">
                {module.status === "beta" && (
                  <span className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs font-semibold">
                    BETA
                  </span>
                )}
                {module.status === "new" && (
                  <span className="bg-green-600 text-green-100 px-2 py-1 rounded text-xs font-semibold">
                    NEW
                  </span>
                )}
                {module.status === "revamped" && (
                  <span className="bg-purple-600 text-purple-100 px-2 py-1 rounded text-xs font-semibold">
                    REVAMPED
                  </span>
                )}
                {module.status === "coming-soon" && (
                  <span className="bg-gray-600 text-gray-100 px-2 py-1 rounded text-xs font-semibold disabled">
                    COMING SOON
                  </span>
                )}
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {isHiddenBehindTournament(module) && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">
                    Current Tournament:{" "}
                    {lastSelectedTournament?.tournamentName}
                  </span>
                </div>
              )}
              {module.name}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {module.description}
            </p>
          </SpotlightCard>
        ))}
      </div>
    </PageWrapper>
  );
}
