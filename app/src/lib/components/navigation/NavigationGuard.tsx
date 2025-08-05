"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@lib/contexts/AuthContext";
import { useElectron } from "@lib/contexts/ElectronContext";

interface NavigationGuardProps {
  children: React.ReactNode;
}

const NavigationGuard = ({ children }: NavigationGuardProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isElectron, isElectronLoading, useLocalData } = useElectron();

  useEffect(() => {
    // Wait for both auth and electron detection to complete
    if (authLoading || isElectronLoading) {
      return;
    }

    // Skip guard for API routes and Next.js internal routes
    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return;
    }

    // Define valid routes
    const validRoutes = [
      "/",
      "/auth",
      "/modules",
      "/settings",
      "/debug-contexts",
      "/download/assets",
    ];

    // Check if current path starts with any valid route
    const isValidRoute = validRoutes.some((route) => {
      if (route === "/") {
        return pathname === "/";
      }
      return pathname.startsWith(route);
    });

    // If route exists, no need to redirect
    if (isValidRoute) {
      return;
    }

    // Handle 404/invalid routes based on authentication status
    const isAuthenticated = !!user;
    const isElectronLocal = isElectron && useLocalData;

    console.log("NavigationGuard: Invalid route detected:", pathname);

    if (isElectronLocal || isAuthenticated) {
      // Redirect authenticated users or electron local users to modules
      router.replace("/modules");
    } else {
      // Redirect unauthenticated users to auth
      router.replace("/auth");
    }
  }, [
    pathname,
    router,
    user,
    authLoading,
    isElectron,
    isElectronLoading,
    useLocalData,
  ]);

  return <>{children}</>;
};

export { NavigationGuard };
