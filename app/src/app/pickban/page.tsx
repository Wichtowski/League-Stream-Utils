'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { GameSession, SessionUrls, User } from '@lib/types';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useModal } from '@lib/contexts/ModalContext';
import { API_BASE_URL } from '@lib/constants';
import { AuthenticatedHome, LoadingSpinner } from '@components/home';

export default function PickBanPage() {
    const router = useRouter();
    const { setActiveModule } = useNavigation();
    const { showConfirm } = useModal();
    const [user, setUser] = useState<User | null>(null);
    const [sessions, setSessions] = useState<GameSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [newSessionUrls, setNewSessionUrls] = useState<SessionUrls | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        setActiveModule('pickban');

        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/auth');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            fetchSessions(token);
        } catch (err) {
            console.warn(err);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/auth');
        } finally {
            setAuthChecked(true);
        }
    }, [router]);

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return token ? `Bearer ${token}` : '';
    };

    const fetchSessions = useCallback(async (token?: string) => {
        try {
            setSessionsLoading(true);
            const authToken = token || getAuthHeader();
            const response = await fetch(`${API_BASE_URL}/pickban/sessions`, {
                headers: {
                    'Authorization': authToken
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                    router.push('/auth');
                    return;
                }
                throw new Error('Failed to fetch sessions');
            }

            const data = await response.json();
            setSessions(data);
        } catch (error) {
            setError('Failed to fetch sessions');
            console.error(error);
        } finally {
            setSessionsLoading(false);
        }
    }, [router]);

    const createSession = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/pickban/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': getAuthHeader(),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                    router.push('/auth');
                    return;
                }
                throw new Error(errorData.error || 'Failed to create session');
            }

            const data = await response.json();
            setNewSessionUrls({
                ...data.urls,
                sessionId: data.sessionId
            });

            if (!user.isAdmin) {
                setUser(prev => prev ? { ...prev, sessionsCreatedToday: prev.sessionsCreatedToday + 1 } : null);
            }

            await fetchSessions();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    const deleteSession = async (sessionId: string) => {
        if (!user?.isAdmin) return;

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
            const response = await fetch(`${API_BASE_URL}/pickban/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': getAuthHeader(),
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete session');
            }

            await fetchSessions();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete session');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        router.push('/auth');
    };

    if (!authChecked) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <LoadingSpinner />;
    }

    return (
        <AuthenticatedHome
            user={user}
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