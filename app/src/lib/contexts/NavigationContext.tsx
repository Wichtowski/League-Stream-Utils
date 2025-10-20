"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type NavigationModule =
  | "home"
  | "auth"
  | "champ-ability"
  | "pickban/static"
  | "cameras"
  | "modules"
  | "tournaments"
  | "adminTournaments"
  | "adminPermissions"
  | "teams"
  | "settings"
  | "leagueclient"
  | "sponsors"
  | "matches"
  | "commentators"
  | "ticker"
  | "currentMatch"
  | "currentTournament"
  | "predictions"
  | null;

interface NavigationContextType {
  activeModule: NavigationModule;
  setActiveModule: (module: NavigationModule) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  removeSidebar: boolean;
  setRemoveSidebar: (remove: boolean) => void;
  toggleSidebar: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState<NavigationModule>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [removeSidebar, setRemoveSidebar] = useState<boolean>(false);

  const toggleSidebar = (): void => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <NavigationContext.Provider
      value={{ activeModule, setActiveModule, sidebarCollapsed, setSidebarCollapsed, removeSidebar, setRemoveSidebar, toggleSidebar }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
