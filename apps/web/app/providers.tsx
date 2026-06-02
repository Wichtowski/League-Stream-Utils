'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, type Theme } from '@lsu/ui/theme';
import { AuthProvider } from '@/_components/auth-provider';
import { ToastContainer } from '@/_components/toast';
import { GlobalLoadingBar } from '@/_components/global-loading-bar';
import { AssetDownloadProgress } from '@/_components/asset-download-progress';
import { CommandPaletteProvider } from '@/_components/command-palette';
import { SyncProgressModal } from '@/_components/sync-progress-modal';

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

  const [theme, setTheme] = useState<Theme>('dark');

  return (
    <ThemeProvider value={{ theme, setTheme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }}>
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
  );
}
