"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { User } from "@lib/types/auth";
import { useElectron } from "../../libElectron/contexts/ElectronContext";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache for auth state to prevent unnecessary API calls
const AUTH_CACHE_KEY = "auth-cache";
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface AuthCache {
  user: User;
  timestamp: number;
}

const getAuthCache = (): AuthCache | null => {
  if (typeof window === "undefined") return null;
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;

    const parsed: AuthCache = JSON.parse(cached);
    const now = Date.now();

    if (now - parsed.timestamp > AUTH_CACHE_DURATION) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const setAuthCache = (user: User): void => {
  if (typeof window === "undefined") return;
  try {
    const cache: AuthCache = {
      user,
      timestamp: Date.now()
    };
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache errors
  }
};

const clearAuthCache = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // Ignore cache errors
  }
};

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isElectron, isElectronLoading, useLocalData } = useElectron();
  const authCheckInProgress = useRef(false);

  const clearAuthData = useCallback(() => {
    setUser(null);
    clearAuthCache();
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        credentials: "include"
      });

      if (response.ok) {
        return true;
      } else {
        clearAuthData();
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      clearAuthData();
      return false;
    }
  }, [clearAuthData]);

  const login = useCallback(
    async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
      try {
        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
          setAuthCache(data.user);
          return { success: true };
        } else {
          return { success: false, message: data.error || "Login failed" };
        }
      } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: "Network error occurred" };
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthData();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, [clearAuthData]);

  const checkAuthCallback = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress.current) {
      return;
    }

    // Wait for Electron detection to complete
    if (isElectronLoading) {
      return;
    }

    // If running in Electron with local data mode, automatically login as admin
    if (isElectron && useLocalData) {
      const localAdmin: User = {
        id: "electron-admin",
        username: "Local Admin",
        isAdmin: true,
        email: "admin@local",
        password: "",
        sessionsCreatedToday: 0,
        lastSessionDate: new Date(),
        createdAt: new Date(),
        passwordHistory: []
      };
      setUser(localAdmin);
      setAuthCache(localAdmin);
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = getAuthCache();
    if (cached) {
      setUser(cached.user);
      setIsLoading(false);
      return;
    }

    authCheckInProgress.current = true;

    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "GET",
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAuthCache(data.user);
      } else if (response.status === 401) {
        // Try to refresh token only once
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry getting user info
          const retryResponse = await fetch("/api/v1/auth/me", {
            method: "GET",
            credentials: "include"
          });

          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setUser(data.user);
            setAuthCache(data.user);
          }
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      clearAuthData();
    } finally {
      setIsLoading(false);
      authCheckInProgress.current = false;
    }
  }, [isElectronLoading, isElectron, useLocalData, refreshToken, clearAuthData]);

  useEffect(() => {
    checkAuthCallback();

    // Safety timeout to ensure loading state doesn't hang indefinitely
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Auth check timeout, forcing completion");
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(safetyTimeout);
  }, [checkAuthCallback, isLoading]);

  const value = {
    user,
    isLoading,
    login,
    logout,
    checkAuth: checkAuthCallback,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}
