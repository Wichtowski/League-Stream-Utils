'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GameSession, SessionUrls } from '@lib/types';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useModal } from '@lib/contexts/ModalContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { API_BASE_URL } from '@lib/constants';
import { AuthenticatedHome } from '@components/home';
import { PageLoader } from '@components/common';

export default function PickBanPage() {
  const { setActiveModule } = useNavigation();
  const { showConfirm } = useModal();
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [newSessionUrls, setNewSessionUrls] = useState<SessionUrls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveModule('pickban');
    
    if (!authLoading) {
      fetchSessions();
    }
  }, [authLoading]);

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

  const createSession = async () => {
    if (!authUser) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
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

  const logout = () => {
    // Handle logout through auth context
    window.location.href = '/auth';
  };

  if (authLoading) {
    return <PageLoader text="Checking authentication..." />;
  }

  if (authUser) {
    return (
      <AuthenticatedHome
        user={authUser}
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        onLogout={logout}
        onCreateSession={createSession}
        onDeleteSession={deleteSession}
        loading={loading}
        error={error}
        newSessionUrls={newSessionUrls}
      />
    );
  }

  // Return null or redirect if not authenticated
  return null;
}
