import type { ReactNode } from "react";

export type ModuleCategory = "tournament" | "prediction" | "core" | "integration" | "admin";

export interface ModuleCard {
  id: string;
  name: string;
  description: string;
  icon: ReactNode | string;
  path: string;
  color: string;
  spotlightColor: string;
  status: "available" | "beta" | "new" | "revamped" | "coming-soon";
  category: ModuleCategory;
  adminOnly?: boolean;
}

export const MODULES: ModuleCard[] = [
  {
    id: "teams",
    name: "Teams",
    description: "Create and manage tournament teams with player rosters and information",
    icon: "👥",
    path: "/modules/teams",
    color: "from-blue-500 to-cyan-500",
    spotlightColor: "rgba(14, 165, 233, 0.15)",
    status: "available",
    category: "core"
  },
  {
    id: "tournaments",
    name: "Tournaments",
    description: "Create and manage tournaments with brackets, schedules, and settings",
    icon: "🏆",
    path: "/modules/tournaments",
    color: "from-yellow-500 to-orange-500",
    spotlightColor: "rgba(245, 158, 11, 0.15)",
    status: "available",
    category: "tournament"
  },
  {
    id: "adminTournaments",
    name: "Admin Tournament Manager",
    description: "Register any team to any tournament with admin privileges and bypass restrictions",
    icon: "🔧",
    path: "/modules/tournaments/admin",
    color: "from-purple-500 to-pink-500",
    spotlightColor: "rgba(168, 85, 247, 0.15)",
    status: "new",
    category: "tournament",
    adminOnly: true
  },
  {
    id: "adminPermissions",
    name: "Global Permissions",
    description: "Manage user roles and permissions across the entire system",
    icon: "🛡️",
    path: "/modules/admin/permissions",
    color: "from-red-500 to-pink-500",
    spotlightColor: "rgba(239, 68, 68, 0.15)",
    status: "available",
    category: "admin",
    adminOnly: true
  },
  {
    id: "pickban",
    name: "Pick & Ban",
    description: "Champion draft interface for tournament matches with live updates",
    icon: "⚔️",
    path: "/modules/pickban",
    color: "from-purple-500 to-pink-500",
    spotlightColor: "rgba(168, 85, 247, 0.15)",
    status: "available",
    category: "core"
  },
  {
    id: "cameras",
    name: "Camera Setup",
    description: "Configure player stream cameras and fallback images for broadcasting",
    icon: "📹",
    path: "/modules/cameras",
    color: "from-green-500 to-emerald-500",
    spotlightColor: "rgba(34, 197, 94, 0.15)",
    status: "available",
    category: "core"
  },
  {
    id: "leagueclient",
    name: "League Client",
    description: "Connect to the League of Legends client to get live data",
    icon: "📟",
    path: "/modules/leagueclient",
    color: "from-teal-500 to-cyan-500",
    spotlightColor: "rgba(20, 184, 166, 0.15)",
    status: "beta",
    category: "integration"
  },
  {
    id: "champ-ability",
    name: "Champions Abilities",
    description: "Browse League of Legends champions abilities with stats and information",
    icon: "⚡",
    path: "/modules/champ-ability",
    color: "from-indigo-500 to-purple-500",
    spotlightColor: "rgba(99, 102, 241, 0.15)",
    status: "available",
    category: "core"
  },
  {
    id: "commentators",
    name: "Commentators",
    description: "Manage commentators and their predictions for the selected tournament",
    icon: "🗣️",
    path: "", // PATH IS DYNAMIC SET IN handleModuleClick
    color: "from-pink-500 to-yellow-500",
    spotlightColor: "rgba(236, 72, 153, 0.15)",
    status: "new",
    category: "tournament"
  },
  {
    id: "sponsors",
    name: "Sponsors",
    description: "Manage tournament sponsors and their display settings",
    icon: "💼",
    path: "", // PATH IS DYNAMIC SET IN handleModuleClick
    color: "from-emerald-500 to-teal-500",
    spotlightColor: "rgba(16, 185, 129, 0.15)",
    status: "new",
    category: "tournament"
  },
  {
    id: "matches",
    name: "Matches",
    description: "View and manage tournament matches",
    icon: "🎮",
    path: "", // PATH IS DYNAMIC SET IN handleModuleClick
    color: "from-red-500 to-pink-500",
    spotlightColor: "rgba(239, 68, 68, 0.15)",
    status: "new",
    category: "tournament"
  }
];

export interface ModuleVisibilityParams {
  isElectron: boolean;
  useLocalData: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  needsTournamentSelected?: boolean;
  needsMatchSelected?: boolean;
}

export function getVisibleModules({
  isElectron,
  useLocalData,
  isAuthenticated,
  isAdmin,
  needsTournamentSelected = false,
  needsMatchSelected = false
}: ModuleVisibilityParams): ModuleCard[] {
  const isElectronLocal = isElectron && useLocalData;
  const showLeagueClient = isElectron && (isElectronLocal || isAuthenticated);
  const showFullNav = isAuthenticated || isElectronLocal;

  return MODULES.filter((module) => {
    if (module.id.includes("leagueclient")) {
      return showLeagueClient;
    }
    if (module.id === "pickban") {
      return showFullNav;
    }
    if (module.id === "champ-ability") {
      return true;
    }
    if (module.id === "adminTournaments" || module.id === "adminPermissions") {
      return showFullNav && isAdmin;
    }
    if (module.id === "sponsors" || module.id === "matches" || module.id === "commentators") {
      return showFullNav && (needsTournamentSelected || needsMatchSelected);
    }
    // All other modules require full nav
    return showFullNav;
  });
}
