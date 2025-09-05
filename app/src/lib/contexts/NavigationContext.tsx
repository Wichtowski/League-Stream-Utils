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
  | "admin"
  | "teams"
  | "settings"
  | "leagueclient"
  | "sponsors"
  | "matches"
  | "commentators"
  | null;

interface NavigationContextType {
  activeModule: NavigationModule;
  setActiveModule: (module: NavigationModule) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModule] = useState<NavigationModule>(null);

  return <NavigationContext.Provider value={{ activeModule, setActiveModule }}>{children}</NavigationContext.Provider>;
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}
