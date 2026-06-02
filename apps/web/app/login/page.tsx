'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/_components/auth-provider';
import { Button } from '@/_components/button';
import { Input } from '@/_components/input';
import { isElectron } from '@lsu/electron-bridge';
import { useAppMode } from '@lsu/electron-bridge/hooks';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setMode: setAppMode } = useAppMode();
  const [electron, setElectron] = useState(false);

  useEffect(() => {
    setElectron(isElectron());
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = mode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
      const body =
        mode === 'login'
          ? { username: form.username, password: form.password }
          : { username: form.username, email: form.email, password: form.password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }

      if (mode === 'register') {
        setMode('login');
        setError('');
        return;
      }

      await refresh();
      const raw = searchParams.get('redirect') ?? '/modules';
      const redirect = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/modules';
      router.push(redirect);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border-subtle bg-surface-raised p-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            {mode === 'login' ? 'Enter your credentials' : 'Register a new account'}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            id="username"
            autoComplete="username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          {mode === 'register' && (
            <Input
              label="Email"
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          )}
          <Input
            label="Password"
            id="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Register'}
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-xs text-text-muted">or</span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() =>
            window.open('/api/v1/auth/google/start', 'google-oauth', 'width=500,height=600')
          }
          type="button"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>

        {electron && (
          <>
            <div className="flex items-center gap-1">
              <div className="h-px flex-1 bg-border-subtle" />
              <span className="text-xs text-text-muted">or</span>
              <div className="h-px flex-1 bg-border-subtle" />
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={async () => {
                await setAppMode('offline');

                document.cookie = 'app_mode=offline; path=/; max-age=31536000; SameSite=Lax';
                await refresh();
                router.push('/modules');
              }}
              type="button"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z"
                  clipRule="evenodd"
                />
              </svg>
              Continue with local data
            </Button>
          </>
        )}

        <p className="text-center text-xs text-text-muted">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-indigo-400 hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </main>
  );
}
