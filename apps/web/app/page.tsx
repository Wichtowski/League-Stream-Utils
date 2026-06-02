'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LinkButton } from '@/_components/button';
import { useAuth } from '@/_components/auth-provider';
import { isElectron } from '@lsu/electron-bridge';
import { useAppMode } from '@lsu/electron-bridge/hooks';
import { HiCloud, HiComputerDesktop } from 'react-icons/hi2';

function ModeSelection() {
  const { setMode } = useAppMode();
  const router = useRouter();

  const chooseMode = async (mode: 'online' | 'offline') => {
    await setMode(mode);
    if (mode === 'offline') {
      document.cookie = 'app_mode=offline; path=/; max-age=31536000; SameSite=Lax';
      router.push('/modules');
    } else {
      document.cookie = 'app_mode=; path=/; max-age=0';
      router.push('/login');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
          League Stream Utils
        </h1>
        <p className="mt-3 text-text-muted">Choose how you want to use the app</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => chooseMode('online')}
          className="group flex w-56 flex-col items-center gap-4 rounded-xl border border-border-subtle bg-surface-raised p-6 transition-all duration-200 hover:border-indigo-500/50 hover:bg-surface-overlay"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/20 transition-transform duration-200 group-hover:scale-110">
            <HiCloud className="text-2xl text-indigo-400" />
          </div>
          <div className="text-center">
            <h2 className="text-sm font-semibold text-gray-200">Online Mode</h2>
            <p className="mt-1 text-xs text-text-muted">
              Sign in to sync data to the cloud. Collaborate with your team.
            </p>
          </div>
        </button>

        <button
          onClick={() => chooseMode('offline')}
          className="group flex w-56 flex-col items-center gap-4 rounded-xl border border-border-subtle bg-surface-raised p-6 transition-all duration-200 hover:border-emerald-500/50 hover:bg-surface-overlay"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 transition-transform duration-200 group-hover:scale-110">
            <HiComputerDesktop className="text-2xl text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="text-sm font-semibold text-gray-200">Offline Mode</h2>
            <p className="mt-1 text-xs text-text-muted">
              Use a local database. No account needed. Data stays on this machine.
            </p>
          </div>
        </button>
      </div>
    </main>
  );
}

export default function HomePage() {
  const { user, loading, appMode, debug } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!loading && user) router.replace('/modules');
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        {mounted && process.env.NODE_ENV === 'development' && (
          <p className="max-w-md text-center font-mono text-[11px] text-text-muted">{debug}</p>
        )}
      </main>
    );
  }

  if (user) return null;

  if (isElectron() && appMode === null) {
    return <ModeSelection />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent">
          League Stream Utils
        </h1>
        <p className="mt-3 text-text-muted">Tournament management & streaming tools</p>
      </div>
      <LinkButton href="/login">Sign in</LinkButton>
    </main>
  );
}
