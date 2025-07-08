'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GameSession, SessionUrls } from '@lib/types';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useModal } from '@lib/contexts/ModalContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { API_BASE_URL } from '@lib/constants';
import { AuthenticatedHome } from '@components/home';
import { AuthGuard } from '@lib/components/AuthGuard';

export default function StaticPickBanPage() {
  const { setActiveModule } = useNavigation();
  const { showConfirm } = useModal();
  const { user: authUser } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [newSessionUrls, setNewSessionUrls] = useState<SessionUrls | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions`);

      if (response.ok) {
        const data = await response.json();
        setSessions(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Failed to fetch sessions');
      }
    } catch (error) {
      setError('Failed to fetch sessions');
      console.error(error);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    setActiveModule('pickban/static');
    fetchSessions();
  }, [fetchSessions, setActiveModule]);

  const createSession = async () => {
    if (!authUser) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'static', // Mark as static session
          config: {
            enableLCU: false, // Disable LCU for static sessions
            mode: 'manual'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewSessionUrls({
          ...data.urls,
          sessionId: data.sessionId
        });
        await fetchSessions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create session');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!authUser?.isAdmin) return;

    const confirmed = await showConfirm({
      type: 'danger',
      title: 'Delete Session',
      message: 'Are you sure you want to delete this session? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions/${sessionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchSessions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete session');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete session');
    }
  };

  return (
    <AuthGuard loadingMessage="Loading Static Pick & Ban...">
      <div className="min-h-screen  text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Pick & Ban</h1>
            <p className="text-gray-400">
              Create and manage pick & ban sessions without League Client integration.
              Perfect for tournaments, practice, or when League Client is not available.
            </p>
          </div>

          {authUser && (
            <AuthenticatedHome
              user={authUser}
              sessions={sessions.filter(session => session.type === 'web' || !session.type)} // Show static or legacy sessions
              sessionsLoading={sessionsLoading}
              onLogout={() => window.location.href = '/auth'}
              onCreateSession={createSession}
              onDeleteSession={deleteSession}
              loading={loading}
              error={error}
              newSessionUrls={newSessionUrls}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
} 