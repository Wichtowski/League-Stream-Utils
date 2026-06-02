'use client';

import { Button } from '@/_components/button';

export default function LoginError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-border-subtle bg-surface-raised p-8 text-center">
        <p className="text-sm text-red-400">{error.message || 'Authentication error'}</p>
        <Button variant="secondary" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
