"use client";

import { useState, type ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { I18nProvider } from "@lsu/i18n/provider";
import { ThemeProvider, type Theme } from "@lsu/ui/theme";

import { AssetDownloadProgress } from "@/_components/asset-download-progress";
import { AuthProvider } from "@/_components/auth-provider";
import { CommandPaletteProvider } from "@/_components/command-palette";
import { GlobalLoadingBar } from "@/_components/global-loading-bar";
import { SyncProgressModal } from "@/_components/sync-progress-modal";
import { ToastContainer } from "@/_components/toast";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  const [theme, setTheme] = useState<Theme>("dark");

  return (
    <I18nProvider>
      <ThemeProvider
        value={{
          theme,
          setTheme,
          toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        }}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CommandPaletteProvider>
              <GlobalLoadingBar />
              {children}
              <ToastContainer />
              <AssetDownloadProgress />
              <SyncProgressModal />
            </CommandPaletteProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}
