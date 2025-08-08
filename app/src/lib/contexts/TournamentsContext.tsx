'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useTournamentData } from './TournamentDataContext';
import { useTournamentBracket } from './TournamentBracketContext';
import { useTournamentStats } from './TournamentStatsContext';
import type { Tournament, CreateTournamentRequest, TournamentStats, Bracket } from '@lib/types';

interface TournamentsContextType {
    // Data
    tournaments: Tournament[];
    myTournaments: Tournament[];
    registeredTournaments: Tournament[];
    loading: boolean;
    error: string | null;

    // Actions
    refreshTournaments: () => Promise<void>;
    createTournament: (
        tournamentData: CreateTournamentRequest
    ) => Promise<{ success: boolean; tournament?: Tournament; error?: string }>;
    updateTournament: (
        tournamentId: string,
        updates: Partial<Tournament>
    ) => Promise<{ success: boolean; tournament?: Tournament; error?: string }>;
    deleteTournament: (tournamentId: string) => Promise<{ success: boolean; error?: string }>;

    // Registration
    registerTeam: (tournamentId: string, teamId: string) => Promise<{ success: boolean; error?: string }>;
    unregisterTeam: (tournamentId: string, teamId: string) => Promise<{ success: boolean; error?: string }>;

    // Tournament management
    startTournament: (tournamentId: string) => Promise<{ success: boolean; error?: string }>;
    finalizeTournament: (tournamentId: string) => Promise<{ success: boolean; error?: string }>;

    // Brackets and games
    getBracket: (tournamentId: string) => Promise<{ success: boolean; bracket?: Bracket; error?: string }>;
    updateBracket: (tournamentId: string, bracket: Bracket) => Promise<{ success: boolean; error?: string }>;
    recordGameResult: (
        tournamentId: string,
        gameId: string,
        result: unknown
    ) => Promise<{ success: boolean; error?: string }>;

    // Stats
    getTournamentStats: (
        tournamentId: string
    ) => Promise<{ success: boolean; stats?: TournamentStats; error?: string }>;

    // Cache management
    clearCache: () => Promise<void>;
    getLastSync: () => Promise<Date | null>;
}

const TournamentsContext = createContext<TournamentsContextType | undefined>(undefined);

export function TournamentsProvider({ children }: { children: ReactNode }) {
    const tournamentData = useTournamentData();
    const tournamentBracket = useTournamentBracket();
    const tournamentStats = useTournamentStats();

    const value: TournamentsContextType = {
        // Data from TournamentDataContext
        tournaments: tournamentData.tournaments,
        myTournaments: tournamentData.myTournaments,
        registeredTournaments: tournamentData.registeredTournaments,
        loading: tournamentData.loading,
        error: tournamentData.error,

        // Actions from TournamentDataContext
        refreshTournaments: tournamentData.refreshTournaments,
        createTournament: tournamentData.createTournament,
        updateTournament: tournamentData.updateTournament,
        deleteTournament: tournamentData.deleteTournament,
        registerTeam: tournamentData.registerTeam,
        unregisterTeam: tournamentData.unregisterTeam,
        startTournament: tournamentData.startTournament,
        finalizeTournament: tournamentData.finalizeTournament,

        // Actions from TournamentBracketContext
        getBracket: tournamentBracket.getBracket,
        updateBracket: tournamentBracket.updateBracket,
        recordGameResult: tournamentBracket.recordGameResult,

        // Actions from TournamentStatsContext
        getTournamentStats: tournamentStats.getTournamentStats,

        // Cache management from TournamentDataContext
        clearCache: tournamentData.clearCache,
        getLastSync: tournamentData.getLastSync
    };

    return <TournamentsContext.Provider value={value}>{children}</TournamentsContext.Provider>;
}

export function useTournaments(): TournamentsContextType {
    const context = useContext(TournamentsContext);
    if (context === undefined) {
        throw new Error('useTournaments must be used within a TournamentsProvider');
    }
    return context;
}
