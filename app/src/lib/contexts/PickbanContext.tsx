'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { useAuth } from './AuthContext';
import { storage } from '@lib/utils/storage/storage';
import type { PickbanSession, PickbanConfig, PickbanAction, LCUStatus } from '@lib/types';
import { useElectron } from './ElectronContext';

interface PickbanContextType {
    // Active session data
    currentSession: PickbanSession | null;
    sessions: PickbanSession[];
    loading: boolean;
    error: string | null;

    // WebSocket connection
    connected: boolean;
    reconnecting: boolean;

    // LCU Status
    lcuStatus: LCUStatus | null;
    lcuLoading: boolean;

    // Session management
    createSession: (config: PickbanConfig) => Promise<{ success: boolean; session?: PickbanSession; error?: string }>;
    joinSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
    leaveSession: () => void;
    startSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
    endSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;

    // Pick/ban actions
    performAction: (action: PickbanAction) => Promise<{ success: boolean; error?: string }>;
    undoLastAction: () => Promise<{ success: boolean; error?: string }>;

    // Configuration
    updateSessionConfig: (
        sessionId: string,
        config: Partial<PickbanConfig>
    ) => Promise<{ success: boolean; error?: string }>;

    // LCU Integration
    connectToLCU: () => Promise<{ success: boolean; error?: string }>;
    disconnectFromLCU: () => Promise<{ success: boolean; error?: string }>;
    checkLCUStatus: () => Promise<void>;
    initializeLCUCheck: () => Promise<void>;
    syncWithLCU: () => Promise<{ success: boolean; error?: string }>;

    // Data management
    refreshSessions: () => Promise<void>;
    clearCache: () => Promise<void>;
    getLastSync: () => Promise<Date | null>;
}

const PickbanContext = createContext<PickbanContextType | undefined>(undefined);

const SESSIONS_CACHE_KEY = 'pickban-sessions';
const LCU_STATUS_CACHE_KEY = 'lcu-status';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes (shorter for real-time data)
const LCU_CHECK_INTERVAL = 10000; // 10 seconds

export function PickbanProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: authLoading } = useAuth();
    const { authenticatedFetch } = useAuthenticatedFetch();
    const { isElectron } = useElectron();

    // Session state
    const [currentSession, setCurrentSession] = useState<PickbanSession | null>(null);
    const [sessions, setSessions] = useState<PickbanSession[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // WebSocket state
    const [connected, setConnected] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // LCU state
    const [lcuStatus, setLcuStatus] = useState<LCUStatus | null>(null);
    const [lcuLoading, setLcuLoading] = useState(false);

    const fetchSessionsFromAPI = useCallback(
        async (showLoading = true): Promise<PickbanSession[]> => {
            // Don't fetch if user is not authenticated
            if (!user) {
                if (showLoading) setLoading(false);
                return [];
            }

            if (showLoading) setLoading(true);
            setError(null);

            try {
                const response = await authenticatedFetch('/api/v1/pickban/sessions');

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                const fetchedSessions = data.sessions || [];

                setSessions(fetchedSessions);
                await storage.set(SESSIONS_CACHE_KEY, fetchedSessions);

                return fetchedSessions;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sessions';
                setError(errorMessage);
                console.error('Pickban sessions fetch error:', err);
                return [];
            } finally {
                if (showLoading) setLoading(false);
            }
        },
        [user, authenticatedFetch]
    );

    const checkLCUStatus = useCallback(async (): Promise<void> => {
        if (!user || !isElectron) return;
        try {
            const response = await authenticatedFetch('/api/v1/pickban/leagueclient/lcu-test');

            if (response.ok) {
                const data = await response.json();

                if (data.success) {
                    // Create LCU status object from test results
                    const lcuStatus: LCUStatus = {
                        connected: true,
                        gameflowPhase: 'Unknown',
                        inChampSelect: false,
                        currentSummoner: data.summoner
                            ? {
                                  displayName: data.summoner.displayName || 'Unknown',
                                  puuid: 'unknown',
                                  summonerId: 0
                              }
                            : undefined,
                        championSelectSession: undefined,
                        lastUpdated: new Date()
                    };

                    setLcuStatus(lcuStatus);
                    await storage.set(LCU_STATUS_CACHE_KEY, lcuStatus);
                } else {
                    setLcuStatus(null);
                    await storage.remove(LCU_STATUS_CACHE_KEY);
                }
            } else {
                setLcuStatus(null);
                await storage.remove(LCU_STATUS_CACHE_KEY);
            }
        } catch (err) {
            console.debug('LCU status check failed:', err);
            setLcuStatus(null);
        }
    }, [authenticatedFetch, user, isElectron]);

    const handleWebSocketMessage = useCallback(
        (message: unknown): void => {
            // Handle different message types from WebSocket
            if (typeof message === 'object' && message !== null) {
                const msg = message as Record<string, unknown>;

                switch (msg.type) {
                    case 'session_update':
                        if (msg.session) {
                            setCurrentSession(msg.session as PickbanSession);
                        }
                        break;
                    case 'action_performed':
                        // Update current session with new action
                        if (currentSession && msg.action) {
                            const updatedSession = {
                                ...currentSession,
                                actions: [...(currentSession.actions || []), msg.action as PickbanAction]
                            };
                            setCurrentSession(updatedSession);
                        }
                        break;
                    case 'lcu_status':
                        if (msg.status) {
                            setLcuStatus(msg.status as LCUStatus);
                            storage.set(LCU_STATUS_CACHE_KEY, msg.status);
                        }
                        break;
                    case 'error':
                        setError((msg.message as string) || 'WebSocket error');
                        break;
                }
            }
        },
        [currentSession]
    );

    const initializeWebSocket = useCallback(
        (sessionId: string): void => {
            if (wsRef.current) {
                wsRef.current.close();
            }

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/api/v1/pickban/ws?sessionId=${sessionId}`;

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log('WebSocket connected to pickban session');
                setConnected(true);
                setReconnecting(false);
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    handleWebSocketMessage(message);
                } catch (err) {
                    console.error('Failed to parse WebSocket message:', err);
                }
            };

            wsRef.current.onclose = () => {
                console.log('WebSocket disconnected from pickban session');
                setConnected(false);

                // Auto-reconnect after 3 seconds if we have an active session
                if (currentSession && !reconnecting) {
                    setReconnecting(true);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        initializeWebSocket(sessionId);
                    }, 3000);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('WebSocket connection error');
            };
        },
        [currentSession, reconnecting, handleWebSocketMessage]
    );

    const loadCachedData = useCallback(async (): Promise<void> => {
        // Don't fetch data if user is not authenticated
        if (!user) {
            return;
        }

        try {
            const [cachedSessions, cachedLcuStatus] = await Promise.all([
                storage.get<PickbanSession[]>(SESSIONS_CACHE_KEY, { ttl: CACHE_TTL }),
                storage.get<LCUStatus>(LCU_STATUS_CACHE_KEY, { ttl: CACHE_TTL })
            ]);

            if (cachedSessions) {
                setSessions(cachedSessions);
            }

            if (cachedLcuStatus) {
                setLcuStatus(cachedLcuStatus);
            }

            // Fetch fresh data in background
            fetchSessionsFromAPI(false);
            // Don't check LCU status on initial load - only when actively using pickban
        } catch (err) {
            console.error('Failed to load cached pickban data:', err);
            await fetchSessionsFromAPI(true);
        }
    }, [user, fetchSessionsFromAPI]);

    // Load cached data on mount - wait for auth to complete
    useEffect(() => {
        if (!authLoading) {
            loadCachedData();
        }
    }, [user, authLoading, loadCachedData]);

    // LCU status check interval - only when actively using pickban
    useEffect(() => {
        if (!user || authLoading || !currentSession) return;

        const interval = setInterval(() => {
            checkLCUStatus();
        }, LCU_CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, [user, authLoading, currentSession, checkLCUStatus]);

    // Initial LCU status check - only when user explicitly accesses pickban features
    const initializeLCUCheck = useCallback(async (): Promise<void> => {
        if (!user || authLoading) return;

        // Only check LCU status if we have cached sessions or user is actively using pickban
        const cachedSessions = await storage.get<PickbanSession[]>(SESSIONS_CACHE_KEY, { ttl: CACHE_TTL });
        if (cachedSessions && cachedSessions.length > 0) {
            await checkLCUStatus();
        }
    }, [user, authLoading, checkLCUStatus]);

    // Cleanup WebSocket on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    const createSession = useCallback(
        async (
            config: PickbanConfig
        ): Promise<{
            success: boolean;
            session?: PickbanSession;
            error?: string;
        }> => {
            try {
                const response = await authenticatedFetch('/api/v1/pickban/sessions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ config })
                });

                const data = await response.json();

                if (response.ok) {
                    const newSession = data.session;
                    const updatedSessions = [newSession, ...sessions];
                    setSessions(updatedSessions);
                    await storage.set(SESSIONS_CACHE_KEY, updatedSessions);
                    return { success: true, session: newSession };
                } else {
                    return {
                        success: false,
                        error: data.error || 'Failed to create session'
                    };
                }
            } catch (err) {
                const error = err instanceof Error ? err.message : 'Failed to create session';
                return { success: false, error };
            }
        },
        [sessions, authenticatedFetch]
    );

    const joinSession = useCallback(
        async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
            try {
                const response = await authenticatedFetch(`/api/v1/pickban/sessions/${sessionId}`);

                if (response.ok) {
                    const data = await response.json();
                    const session = data.session;
                    setCurrentSession(session);
                    initializeWebSocket(sessionId);
                    return { success: true };
                } else {
                    const data = await response.json();
                    return {
                        success: false,
                        error: data.error || 'Failed to join session'
                    };
                }
            } catch (err) {
                const error = err instanceof Error ? err.message : 'Failed to join session';
                return { success: false, error };
            }
        },
        [authenticatedFetch, initializeWebSocket]
    );

    const leaveSession = useCallback((): void => {
        setCurrentSession(null);
        setConnected(false);
        setReconnecting(false);

        if (wsRef.current) {
            wsRef.current.close();
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
    }, []);

    const startSession = useCallback(
        async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
            try {
                const response = await authenticatedFetch(`/api/v1/pickban/sessions/${sessionId}/start`, {
                    method: 'POST'
                });

                if (response.ok) {
                    await fetchSessionsFromAPI(false);
                    return { success: true };
                } else {
                    const data = await response.json();
                    return {
                        success: false,
                        error: data.error || 'Failed to start session'
                    };
                }
            } catch (err) {
                const error = err instanceof Error ? err.message : 'Failed to start session';
                return { success: false, error };
            }
        },
        [authenticatedFetch, fetchSessionsFromAPI]
    );

    const endSession = useCallback(
        async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
            try {
                const response = await authenticatedFetch(`/api/v1/pickban/sessions/${sessionId}/end`, {
                    method: 'POST'
                });

                if (response.ok) {
                    await fetchSessionsFromAPI(false);
                    leaveSession();
                    return { success: true };
                } else {
                    const data = await response.json();
                    return {
                        success: false,
                        error: data.error || 'Failed to end session'
                    };
                }
            } catch (err) {
                const error = err instanceof Error ? err.message : 'Failed to end session';
                return { success: false, error };
            }
        },
        [authenticatedFetch, fetchSessionsFromAPI, leaveSession]
    );

    const performAction = useCallback(
        async (action: PickbanAction): Promise<{ success: boolean; error?: string }> => {
            if (!currentSession) {
                return { success: false, error: 'No active session' };
            }

            try {
                const response = await authenticatedFetch(`/api/v1/pickban/sessions/${currentSession.id}/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action })
                });

                if (response.ok) {
                    // WebSocket will handle the real-time update
                    return { success: true };
                } else {
                    const data = await response.json();
                    return {
                        success: false,
                        error: data.error || 'Failed to perform action'
                    };
                }
            } catch (err) {
                const error = err instanceof Error ? err.message : 'Failed to perform action';
                return { success: false, error };
            }
        },
        [currentSession, authenticatedFetch]
    );

    const undoLastAction = useCallback(async (): Promise<{
        success: boolean;
        error?: string;
    }> => {
        if (!currentSession) {
            return { success: false, error: 'No active session' };
        }

        try {
            const response = await authenticatedFetch(`/api/v1/pickban/sessions/${currentSession.id}/undo`, {
                method: 'POST'
            });

            if (response.ok) {
                return { success: true };
            } else {
                const data = await response.json();
                return { success: false, error: data.error || 'Failed to undo action' };
            }
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Failed to undo action';
            return { success: false, error };
        }
    }, [currentSession, authenticatedFetch]);

    const updateSessionConfig = useCallback(
        async (sessionId: string, config: Partial<PickbanConfig>): Promise<{ success: boolean; error?: string }> => {
            try {
                const response = await authenticatedFetch(`/api/v1/pickban/sessions/${sessionId}/config`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ config })
                });

                if (response.ok) {
                    await fetchSessionsFromAPI(false);
                    return { success: true };
                } else {
                    const data = await response.json();
                    return {
                        success: false,
                        error: data.error || 'Failed to update config'
                    };
                }
            } catch (err) {
                const error = err instanceof Error ? err.message : 'Failed to update config';
                return { success: false, error };
            }
        },
        [authenticatedFetch, fetchSessionsFromAPI]
    );

    const connectToLCU = useCallback(async (): Promise<{
        success: boolean;
        error?: string;
    }> => {
        setLcuLoading(true);
        try {
            // Just check LCU status to test connection
            await checkLCUStatus();

            if (lcuStatus?.connected) {
                return { success: true };
            } else {
                return { success: false, error: 'Could not connect to League Client' };
            }
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Failed to connect to LCU';
            return { success: false, error };
        } finally {
            setLcuLoading(false);
        }
    }, [checkLCUStatus, lcuStatus]);

    const disconnectFromLCU = useCallback(async (): Promise<{
        success: boolean;
        error?: string;
    }> => {
        try {
            // Simply clear the LCU status - no server endpoint needed
            setLcuStatus(null);
            await storage.remove(LCU_STATUS_CACHE_KEY);
            return { success: true };
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Failed to disconnect from LCU';
            return { success: false, error };
        }
    }, []);

    const syncWithLCU = useCallback(async (): Promise<{
        success: boolean;
        error?: string;
    }> => {
        if (!currentSession) {
            return { success: false, error: 'No active session' };
        }

        try {
            // Get champion select data from LCU
            const response = await authenticatedFetch('/api/cs');

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.inChampSelect) {
                    // In a real implementation, you would sync the champion select data
                    // with your pickban session here
                    return { success: true };
                } else {
                    return { success: false, error: 'Not in champion select' };
                }
            } else {
                const data = await response.json();
                return {
                    success: false,
                    error: data.error || 'Failed to sync with LCU'
                };
            }
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Failed to sync with LCU';
            return { success: false, error };
        }
    }, [currentSession, authenticatedFetch]);

    const refreshSessions = useCallback(async (): Promise<void> => {
        await fetchSessionsFromAPI(true);
    }, [fetchSessionsFromAPI]);

    const clearCache = useCallback(async (): Promise<void> => {
        await Promise.all([storage.remove(SESSIONS_CACHE_KEY), storage.remove(LCU_STATUS_CACHE_KEY)]);
        setSessions([]);
        setLcuStatus(null);
    }, []);

    const getLastSync = useCallback(async (): Promise<Date | null> => {
        const timestamp = await storage.getTimestamp(SESSIONS_CACHE_KEY);
        return timestamp ? new Date(timestamp) : null;
    }, []);

    const value: PickbanContextType = {
        currentSession,
        sessions,
        loading,
        error,
        connected,
        reconnecting,
        lcuStatus,
        lcuLoading,
        createSession,
        joinSession,
        leaveSession,
        startSession,
        endSession,
        performAction,
        undoLastAction,
        updateSessionConfig,
        connectToLCU,
        disconnectFromLCU,
        checkLCUStatus,
        syncWithLCU,
        refreshSessions,
        clearCache,
        getLastSync,
        initializeLCUCheck
    };

    return <PickbanContext.Provider value={value}>{children}</PickbanContext.Provider>;
}

export function usePickban() {
    const context = useContext(PickbanContext);
    if (context === undefined) {
        throw new Error('usePickban must be used within a PickbanProvider');
    }
    return context;
}
