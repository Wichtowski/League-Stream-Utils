"use client";

import React from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";

interface MainContentProps {
  children: React.ReactNode;
}

export const MainContent = ({ children }: MainContentProps): React.ReactNode => {
  const { activeModule, sidebarCollapsed } = useNavigation();

  const shouldShowSidebar = activeModule !== null;

  return (
    <main
      className={`flex-1 transition-all duration-300 ease-in-out ${
        shouldShowSidebar ? (sidebarCollapsed ? "ml-16 md:ml-16" : "ml-0 md:ml-60") : "ml-0"
      }`}
    >
      {children}
    </main>
  );
};
