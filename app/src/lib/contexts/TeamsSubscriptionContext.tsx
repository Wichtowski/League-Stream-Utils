'use client';

import { createContext, useContext, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { useTeams } from './TeamsContext';
import type { Team } from '@lib/types';

interface TeamsSubscriptionContextType {
  // Subscription methods
  subscribe: (callback: (teams: Team[]) => void) => () => void;
  subscribeToTeam: (teamId: string, callback: (team: Team | null) => void) => () => void;
  subscribeToLoading: (callback: (loading: boolean) => void) => () => void;
  subscribeToError: (callback: (error: string | null) => void) => () => void;
  
  // Direct access (for backward compatibility)
  teams: Team[];
  loading: boolean;
  error: string | null;
}

const TeamsSubscriptionContext = createContext<TeamsSubscriptionContextType | undefined>(undefined);

export function TeamsSubscriptionProvider({ children }: { children: ReactNode }) {
  const { teams, loading, error } = useTeams();
  
  // Subscription callbacks
  const teamsSubscribers = useRef<Set<(teams: Team[]) => void>>(new Set());
  const teamSubscribers = useRef<Map<string, Set<(team: Team | null) => void>>>(new Map());
  const loadingSubscribers = useRef<Set<(loading: boolean) => void>>(new Set());
  const errorSubscribers = useRef<Set<(error: string | null) => void>>(new Set());

  // Notify teams subscribers
  useEffect(() => {
    teamsSubscribers.current.forEach(callback => {
      try {
        callback(teams);
      } catch (err) {
        console.error('Teams subscription callback error:', err);
      }
    });
  }, [teams]);

  // Notify loading subscribers
  useEffect(() => {
    loadingSubscribers.current.forEach(callback => {
      try {
        callback(loading);
      } catch (err) {
        console.error('Loading subscription callback error:', err);
      }
    });
  }, [loading]);

  // Notify error subscribers
  useEffect(() => {
    errorSubscribers.current.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error subscription callback error:', err);
      }
    });
  }, [error]);

  // Notify team-specific subscribers
  useEffect(() => {
    teamSubscribers.current.forEach((subscribers, teamId) => {
      const team = teams.find(t => t.id === teamId) || null;
      subscribers.forEach(callback => {
        try {
          callback(team);
        } catch (err) {
          console.error('Team subscription callback error:', err);
        }
      });
    });
  }, [teams]);

  const subscribe = useCallback((callback: (teams: Team[]) => void) => {
    teamsSubscribers.current.add(callback);
    // Initial call
    callback(teams);
    
    return () => {
      teamsSubscribers.current.delete(callback);
    };
  }, [teams]);

  const subscribeToTeam = useCallback((teamId: string, callback: (team: Team | null) => void) => {
    if (!teamSubscribers.current.has(teamId)) {
      teamSubscribers.current.set(teamId, new Set());
    }
    
    const subscribers = teamSubscribers.current.get(teamId)!;
    subscribers.add(callback);
    
    // Initial call
    const team = teams.find(t => t.id === teamId) || null;
    callback(team);
    
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        teamSubscribers.current.delete(teamId);
      }
    };
  }, [teams]);

  const subscribeToLoading = useCallback((callback: (loading: boolean) => void) => {
    loadingSubscribers.current.add(callback);
    // Initial call
    callback(loading);
    
    return () => {
      loadingSubscribers.current.delete(callback);
    };
  }, [loading]);

  const subscribeToError = useCallback((callback: (error: string | null) => void) => {
    errorSubscribers.current.add(callback);
    // Initial call
    callback(error);
    
    return () => {
      errorSubscribers.current.delete(callback);
    };
  }, [error]);

  const value: TeamsSubscriptionContextType = useMemo(() => ({
    subscribe,
    subscribeToTeam,
    subscribeToLoading,
    subscribeToError,
    teams,
    loading,
    error
  }), [subscribe, subscribeToTeam, subscribeToLoading, subscribeToError, teams, loading, error]);

  return (
    <TeamsSubscriptionContext.Provider value={value}>
      {children}
    </TeamsSubscriptionContext.Provider>
  );
}

export function useTeamsSubscription(): TeamsSubscriptionContextType {
  const context = useContext(TeamsSubscriptionContext);
  if (context === undefined) {
    throw new Error('useTeamsSubscription must be used within a TeamsSubscriptionProvider');
  }
  return context;
} 