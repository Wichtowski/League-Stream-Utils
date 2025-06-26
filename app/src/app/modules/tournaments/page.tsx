'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@lib/contexts/AuthContext';
import { useTournaments } from '@lib/contexts/TournamentsContext';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useElectron } from '@lib/contexts/ElectronContext';
import { useModal } from '@lib/contexts/ModalContext';
import { AuthGuard } from '@lib/components/AuthGuard';
import { LoadingSpinner } from '@components/common';
import { TournamentCreationForm, TournamentList } from './components';
import type { TournamentStatus } from '@lib/types';

export default function TournamentsPage() {
    const { user } = useAuth();
    const { 
        tournaments, 
        loading: tournamentsLoading, 
        error,
        refreshTournaments,
        updateTournament
    } = useTournaments();
    const { setActiveModule } = useNavigation();
    const { isElectron, useLocalData } = useElectron();
    const { showAlert } = useModal();
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    const isLocalDataMode = isElectron && useLocalData;

    useEffect(() => {
        setActiveModule('tournaments');
    }, [setActiveModule]);

    const handleTournamentCreated = (): void => {
        setShowCreateForm(false);
        refreshTournaments(); // Refresh the list after creation
    };

    const handleTournamentUpdated = (): void => {
        refreshTournaments(); // Refresh the list after update
    };

    const updateTournamentStatus = async (tournamentId: string, status: TournamentStatus): Promise<void> => {
        try {
            const result = await updateTournament(tournamentId, { status });
            if (!result.success) {
                await showAlert({ 
                    type: 'error', 
                    message: result.error || 'Failed to update tournament status' 
                });
            }
        } catch (error) {
            await showAlert({ 
                type: 'error', 
                message: 'Failed to update tournament status' 
            });
            console.error('Failed to update tournament status:', error);
        }
    };

    // Show error if there's an error from the context
    useEffect(() => {
        if (error) {
            showAlert({ type: 'error', message: error });
        }
    }, [error, showAlert]);

    return (
        <AuthGuard loadingMessage="Loading tournaments...">
            {tournamentsLoading && tournaments.length === 0 ? (
                <LoadingSpinner fullscreen text="Loading tournaments..." />
            ) : (
                <div className="min-h-screen text-white">
                    <div className="container mx-auto px-6 py-8">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold">My Tournaments</h1>
                            <div className="flex items-center space-x-4">
                                {!isLocalDataMode && user && (
                                    <p>You are logged in as {user.username}</p>
                                )}
                                {user?.isAdmin && (
                                    <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm">
                                        Admin
                                    </span>
                                )}
                                {!showCreateForm && tournaments.length > 0 && (
                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                                    >
                                        Create Tournament
                                    </button>
                                )}
                            </div>
                        </div>

                        {showCreateForm && (
                            <TournamentCreationForm
                                onTournamentCreated={handleTournamentCreated}
                                onCancel={() => setShowCreateForm(false)}
                            />
                        )}

                        <TournamentList
                            tournaments={tournaments}
                            onShowCreateForm={() => setShowCreateForm(true)}
                            onStatusUpdate={updateTournamentStatus}
                            onTournamentUpdate={handleTournamentUpdated}
                        />
                    </div>
                </div>
            )}
        </AuthGuard>
    );
} 