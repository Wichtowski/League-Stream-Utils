'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getCachedUser, setCachedUser, clearCachedUser } from '@lsu/auth/client';
import { isElectron } from '@lsu/electron-bridge';
import { useAppMode } from '@lsu/electron-bridge/hooks';

interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  impersonatedBy?: string;
}

type AppMode = 'online' | 'offline' | null;

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  appMode: AppMode;
  isOffline: boolean;
  isDeveloper: boolean;
  debug: string;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  switchToOnline: () => Promise<void>;
}

const OFFLINE_USER: User = {
  id: 'local',
  username: 'Local User',
  email: '',
  isAdmin: true,
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  appMode: null,
  isOffline: false,
  isDeveloper: false,
  debug: '',
  logout: async () => {},
  refresh: async () => {},
  switchToOnline: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [loading, setLoading] = useState(true);
  const { mode: appMode, loading: modeLoading, load: loadMode, setMode } = useAppMode();

  useEffect(() => {
    if (isElectron()) loadMode();
  }, [loadMode]);

  const refresh = useCallback(async () => {
    const currentMode = useAppMode.getState().mode;
    if (currentMode === 'offline') {
      setUser(OFFLINE_USER);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/v1/auth/validate', { credentials: 'include' });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setCachedUser(data.user);
      } else {
        setUser(null);
        clearCachedUser();
      }
    } catch {
      setUser(null);
      clearCachedUser();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (modeLoading) return;
    refresh();
  }, [refresh, modeLoading, appMode]);

  const router = useRouter();

  const logout = useCallback(async () => {
    if (appMode === 'offline') {
      // Clear the offline cookie and reset Electron mode so user
      // returns to the mode selection screen
      document.cookie = 'app_mode=; path=/; max-age=0';
      await setMode(null as any);
    } else {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    }
    setUser(null);
    clearCachedUser();
    router.push('/');
  }, [router, appMode, setMode]);

  const switchToOnline = useCallback(async () => {
    document.cookie = 'app_mode=; path=/; max-age=0';
    await setMode('online');
    setUser(null);
    clearCachedUser();
    // Try to auto-login with existing tokens
    try {
      const res = await fetch('/api/v1/auth/validate', { credentials: 'include' });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setCachedUser(data.user);
        router.push('/modules');
        return;
      }
    } catch {}
    router.push('/login');
  }, [router, setMode]);

  const isOffline = appMode === 'offline';
  const isDeveloper = isOffline && !!user?.isAdmin;
  const combinedLoading = loading || (isElectron() && modeLoading);

  const debug = [
    `electron=${isElectron()}`,
    `modeLoading=${modeLoading}`,
    `appMode=${appMode}`,
    `authLoading=${loading}`,
    `user=${user?.username ?? 'null'}`,
  ].join(' | ');

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: combinedLoading,
        appMode,
        isOffline,
        isDeveloper,
        debug,
        logout,
        refresh,
        switchToOnline,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
