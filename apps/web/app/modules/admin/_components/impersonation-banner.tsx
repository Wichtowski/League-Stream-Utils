'use client';

import { useAuth } from '@/_components/auth-provider';

export function ImpersonationBanner() {
  const { user } = useAuth();

  if (!user?.impersonatedBy) return null;

  const endImpersonation = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    window.location.href = '/modules/admin';
  };

  return (
    <div className="fixed top-0 left-56 right-0 z-50 flex items-center justify-between bg-amber-500 px-4 py-2 text-sm font-medium text-black">
      <span>
        You are impersonating <strong>{user.username}</strong>
      </span>
      <button
        onClick={endImpersonation}
        className="rounded bg-black/20 px-3 py-1 text-xs font-semibold hover:bg-black/30 transition-colors"
      >
        End Session
      </button>
    </div>
  );
}
