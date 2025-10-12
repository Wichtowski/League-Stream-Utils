"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useElectron } from "@libElectron/contexts/ElectronContext";
import { useCurrentMatch, useCurrentTournament } from "@lib/contexts";
import { getVisibleModules, ModuleCard } from "@lib/navigation";
import { Bars3Icon, XMarkIcon, Cog6ToothIcon, ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { isHiddenBehindTournament } from "@lib/components/modules/SpotlightCard";
import { AiOutlineHome, AiFillHome } from "react-icons/ai";
import { CiCoffeeCup } from "react-icons/ci";

export const Sidebar = (): React.ReactElement => {
  const { activeModule, sidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useNavigation();
  const { user, logout } = useAuth();
  const { isElectron, useLocalData } = useElectron();
  const { currentTournament } = useCurrentTournament();
  const { currentMatch } = useCurrentMatch();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);
  const [showCoffeeTooltip, setShowCoffeeTooltip] = useState(false);

  const isAuthenticated = !!user;
  const isAdmin = Boolean(user?.isAdmin);

  const allVisibleModules = getVisibleModules({
    isElectron,
    useLocalData,
    isAuthenticated,
    isAdmin,
    needsTournamentSelected: currentTournament !== null,
    needsMatchSelected: currentMatch !== null
  });

  const tournamentSpecificIds = ["matches", "commentators", "sponsors", "ticker", "currentMatch", "currentTournament"];

  const globalModules = allVisibleModules.filter(
    (m) => !tournamentSpecificIds.includes(m.id) && m.status !== "unavailable"
  );
  const tournamentModules = allVisibleModules.filter(
    (m) => tournamentSpecificIds.includes(m.id) && m.status !== "unavailable"
  );

  const hasTournamentContext = currentTournament !== null || currentMatch !== null;

  const isElectronRemote = isElectron && !useLocalData;
  const showBasicNav = !isAuthenticated && (isElectronRemote || !isElectron);

  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    if (!navRef.current) return;

    setIsDragging(true);
    setStartY(e.clientY);
    setScrollStart(navRef.current.scrollTop);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent): void => {
      if (!isDragging || !navRef.current) return;

      const deltaY = e.clientY - startY;
      navRef.current.scrollTop = scrollStart - deltaY;
    },
    [isDragging, startY, scrollStart]
  );

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback((): void => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!sidebarCollapsed && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        if (window.innerWidth < 768 && !target.closest(".sidebar-overlay")) {
          setSidebarCollapsed(true);
        }
      }
      // Close coffee tooltip when clicking outside
      if (showCoffeeTooltip) {
        setShowCoffeeTooltip(false);
      }
    };

    if (!sidebarCollapsed && window.innerWidth < 768) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [sidebarCollapsed, setSidebarCollapsed, showCoffeeTooltip]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleModuleClick = (module: ModuleCard): void => {
    if (module.status === "coming-soon") {
      return;
    }

    if (isHiddenBehindTournament(module.id)) {
      if (!currentTournament) {
        return;
      } else if (module.id === "currentMatch") {
        router.push(`/modules/tournaments/${currentTournament._id}/matches/${currentMatch?._id}`);
      } else if (module.id === "currentTournament") {
        router.push(`/modules/tournaments/${currentTournament._id}`);
      } else {
        router.push(`/modules/tournaments/${currentTournament._id}/${module.id}`);
      }
    } else {
      router.push(module.path);
    }

    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  };

  if (activeModule === null) {
    return <></>;
  }

  return (
    <>
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden sidebar-overlay"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-0 h-full bg-black border-r border-gray-800 z-50 transition-[width] duration-300 ease-in-out ${
          sidebarCollapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="flex flex-col h-full justify-start">
          <div
            className={`flex items-center p-4 border-b border-gray-800 ${
              sidebarCollapsed ? "justify-center" : "justify-between"
            }`}
          >
            <button
              onClick={toggleSidebar}
              className={`p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 ${
                sidebarCollapsed ? "mx-auto" : ""
              }`}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <div className="relative w-6 h-6">
                <Bars3Icon
                  className={`w-6 h-6 text-gray-400 absolute transition-all duration-200 ${
                    sidebarCollapsed ? "opacity-100 rotate-0" : "opacity-0 rotate-90"
                  }`}
                />
                <XMarkIcon
                  className={`w-6 h-6 text-gray-400 absolute transition-all duration-200 ${
                    sidebarCollapsed ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
                  }`}
                />
              </div>
            </button>
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2 relative">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center cursor-pointer hover:from-blue-400 hover:to-purple-400 transition-all duration-200">
                  <span className="text-white font-bold text-sm">LSU</span>
                </div>
                <div
                  className="relative"
                  onMouseEnter={() => setShowCoffeeTooltip(true)}
                  onMouseLeave={() => setShowCoffeeTooltip(false)}
                >
                  <Link href="https://buymeacoffee.com/wichtowski" target="_blank">
                    <CiCoffeeCup className="w-7 h-7 text-yellow-400 cursor-pointer hover:text-yellow-300 transition-colors duration-200" />
                  </Link>
                  {showCoffeeTooltip && (
                    <div className="absolute top-0 left-8 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-xl z-50 min-w-[220px]">
                      <div className="flex items-center space-x-2 text-white">
                        <span className="text-base font-medium">Buy me coffee!</span>
                      </div>
                      <div className="text-sm text-gray-300 mt-2">And support the development</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <nav
            ref={navRef}
            className={`flex-1 overflow-y-auto py-4 max-h-[calc(100vh-200px)] scrollbar-none ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none"
            }}
          >
            <div className="space-y-0.5 px-2">
              <Link
                href="/modules"
                className={`flex items-center justify-start rounded-lg transition-all duration-200 ${
                  activeModule === "modules"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 p-2 mb-1 max-h-[52px]"
                    : "hover:bg-gray-800 p-2 max-h-[48px]"
                }`}
                title="Modules"
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setSidebarCollapsed(true);
                  }
                }}
              >
                {activeModule === "modules" ? (
                  <AiOutlineHome className="text-white flex-shrink-0 transition-all duration-200 w-8 h-8" />
                ) : (
                  <AiFillHome className="text-white flex-shrink-0 transition-all duration-200 w-8 h-8" />
                )}
                {!sidebarCollapsed && (
                  <span className="ml-3 text-white font-medium animate-fade-in-delayed">Modules</span>
                )}
              </Link>

              {showBasicNav && (
                <Link
                  href="/login"
                  className={`flex items-center justify-start rounded-lg transition-all duration-200 ${
                    activeModule === "auth"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 p-3 my-1 max-h-[52px]"
                      : "hover:bg-gray-800 p-2 max-h-[48px]"
                  }`}
                  title="Login"
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setSidebarCollapsed(true);
                    }
                  }}
                >
                  <div
                    className={`flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                      activeModule === "auth" ? "w-7 h-7" : "w-6 h-6"
                    }`}
                  >
                    <span
                      className={`text-white transition-all duration-200 ${
                        activeModule === "auth" ? "text-2xl" : "text-xl"
                      }`}
                    >
                      🔐
                    </span>
                  </div>
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-white font-medium animate-fade-in-delayed">Login</span>
                  )}
                </Link>
              )}

              {globalModules.map((module, index) => {
                const Icon = module.icon;
                const isActive = activeModule === module.id;
                const prevModule = index > 0 ? globalModules[index - 1] : null;
                const nextModule = index < globalModules.length - 1 ? globalModules[index + 1] : null;
                const isNearActive = isActive || activeModule === prevModule?.id || activeModule === nextModule?.id;

                return (
                  <button
                    key={module.id}
                    onClick={() => handleModuleClick(module)}
                    className={`w-full flex items-center ${isActive && sidebarCollapsed ? "justify-center" : "justify-start"} rounded-lg transition-all duration-200 ${
                      isActive
                        ? `bg-gradient-to-r ${module.color} p-3 my-1 max-h-[52px]`
                        : isNearActive
                          ? "hover:bg-gray-800 p-2 max-h-[48px]"
                          : "hover:bg-gray-800 p-2 max-h-[48px]"
                    } ${module.status === "coming-soon" ? "opacity-50 cursor-not-allowed" : ""}`}
                    title={module.name}
                  >
                    <div
                      className={`flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        isActive ? "w-7 h-7" : "w-8 h-8 bg-gradient-to-r " + module.color + " rounded"
                      }`}
                    >
                      <Icon className={`text-white transition-all duration-200 ${isActive ? "w-7 h-7" : "w-5 h-5"}`} />
                    </div>
                    {!sidebarCollapsed && (
                      <span className="ml-3 relative text-white font-medium animate-fade-in-delayed">
                        {module.name}
                      </span>
                    )}
                  </button>
                );
              })}

              {hasTournamentContext && tournamentModules.length > 0 && (
                <>
                  {tournamentModules.map((module, index) => {
                    const Icon = module.icon;
                    const isActive = activeModule === module.id;
                    const prevModule = index > 0 ? tournamentModules[index - 1] : null;
                    const nextModule = index < tournamentModules.length - 1 ? tournamentModules[index + 1] : null;
                    const isNearActive = isActive || activeModule === prevModule?.id || activeModule === nextModule?.id;

                    return (
                      <button
                        key={module.id}
                        onClick={() => handleModuleClick(module)}
                        className={`w-full flex items-center justify-start rounded-lg transition-all duration-300 ${
                          isActive
                            ? `bg-gradient-to-r ${module.color} p-3 my-1 max-h-[52px]`
                            : isNearActive
                              ? "hover:bg-gray-800 p-2 max-h-[48px]"
                              : "hover:bg-gray-800 p-2 max-h-[48px]"
                        } ${module.status === "coming-soon" ? "opacity-50 cursor-not-allowed" : ""} animate-slide-in-right`}
                        style={{ animationDelay: `${index * 50}ms` }}
                        title={module.name}
                      >
                        <div
                          className={`flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            isActive && isHiddenBehindTournament(module.id)
                              ? "w-6 h-6"
                              : isActive
                                ? "w-7 h-7"
                                : "w-8 h-8 bg-gradient-to-r " + module.color + " rounded"
                          }`}
                        >
                          <Icon
                            className={`text-white transition-all duration-200 ${isActive ? "w-7 h-7" : "w-5 h-5"}`}
                          />
                        </div>
                        {!sidebarCollapsed && (
                          <span className="ml-3 text-white font-medium animate-fade-in-delayed">{module.name}</span>
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </nav>

          <div className="border-t border-gray-800 p-2">
            {isElectron && (
              <Link
                href="/settings"
                className={`flex items-center p-2 justify-start rounded-lg transition-all duration-200 ${
                  activeModule === "settings"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 max-h-[52px]"
                    : "hover:bg-gray-800 max-h-[48px]"
                }`}
                title="Settings"
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setSidebarCollapsed(true);
                  }
                }}
              >
                <Cog6ToothIcon
                  className={`flex-shrink-0 w-8 h-8  transition-all duration-200 ${
                    activeModule === "settings" ? "text-white" : `${useLocalData ? "text-green-400" : "text-blue-400"}`
                  }`}
                />
                {!sidebarCollapsed && (
                  <div className="ml-3 flex flex-col items-start">
                    <span className="text-white font-medium text-lg animate-fade-in-delayed">Settings </span>
                  </div>
                )}
              </Link>
            )}

            {isAuthenticated && (
              <div className="mt-2">
                <button
                  onClick={() => {
                    logout();
                    if (window.innerWidth < 768) {
                      setSidebarCollapsed(true);
                    }
                  }}
                  className={`w-full flex items-center justify-start rounded-lg transition-all duration-200 bg-red-600 hover:bg-red-700 text-white p-2`}
                  title="Logout"
                >
                  <ArrowRightStartOnRectangleIcon className="w-8 h-8 text-white hover:text-gray-400 flex-shrink-0 transition-colors duration-200" />
                  {!sidebarCollapsed && (
                    <span className="ml-3 text-white font-medium text-lg animate-fade-in-delayed">Logout</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
