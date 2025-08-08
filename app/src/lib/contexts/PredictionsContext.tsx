'use client';

import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { useElectron } from './ElectronContext';
import { useAuthenticatedFetch } from '@lib/hooks/useAuthenticatedFetch';
import { useAuth } from './AuthContext';

export interface Prediction {
    commentator: string;
    prediction: string;
    timestamp: string;
}

interface PredictionsContextType {
    getPredictions: (matchId: string) => Promise<Prediction[]>;
    submitPrediction: (
        matchId: string,
        prediction: string
    ) => Promise<{ success: boolean; prediction?: Prediction; error?: string }>;
    loading: boolean;
}

const PredictionsContext = createContext<PredictionsContextType | undefined>(undefined);

export function PredictionsProvider({ children }: { children: ReactNode }): React.ReactElement {
    const { isElectron, useLocalData } = useElectron();
    const { authenticatedFetch } = useAuthenticatedFetch();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const isLocalDataMode = isElectron && useLocalData;

    const getPredictions = useCallback(
        async (matchId: string): Promise<Prediction[]> => {
            setLoading(true);
            try {
                if (isLocalDataMode && typeof window !== 'undefined' && window.electronAPI?.storage?.get) {
                    const data = await window.electronAPI.storage.get(`predictions-${matchId}`);
                    setLoading(false);
                    return (data as Prediction[]) || [];
                } else {
                    const res = await authenticatedFetch(`/api/v1/predictions/${matchId}`);
                    if (!res.ok) throw new Error('Failed to fetch predictions');
                    const { predictions } = await res.json();
                    setLoading(false);
                    return predictions || [];
                }
            } catch {
                setLoading(false);
                return [];
            }
        },
        [isLocalDataMode, authenticatedFetch]
    );

    const submitPrediction = useCallback(
        async (matchId: string, prediction: string) => {
            setLoading(true);
            try {
                if (isLocalDataMode && typeof window !== 'undefined' && window.electronAPI?.storage?.set) {
                    // Get current user from auth context
                    const commentator = user?.username || 'ElectronUser';
                    const newPrediction: Prediction = {
                        commentator,
                        prediction,
                        timestamp: new Date().toISOString()
                    };
                    const existing =
                        ((await window.electronAPI.storage.get(`predictions-${matchId}`)) as Prediction[]) || [];
                    const filtered = existing.filter((p) => p.commentator !== commentator);
                    const updated = [...filtered, newPrediction];
                    await window.electronAPI.storage.set(`predictions-${matchId}`, updated);
                    setLoading(false);
                    return { success: true, prediction: newPrediction };
                } else {
                    const res = await authenticatedFetch(`/api/v1/predictions/${matchId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prediction })
                    });
                    const data = await res.json();
                    setLoading(false);
                    return data;
                }
            } catch (_error) {
                setLoading(false);
                return { success: false, error: 'Failed to submit prediction' };
            }
        },
        [isLocalDataMode, authenticatedFetch, user?.username]
    );

    return (
        <PredictionsContext.Provider value={{ getPredictions, submitPrediction, loading }}>
            {children}
        </PredictionsContext.Provider>
    );
}

export function usePredictions(): PredictionsContextType {
    const ctx = useContext(PredictionsContext);
    if (!ctx) throw new Error('usePredictions must be used within a PredictionsProvider');
    return ctx;
}
