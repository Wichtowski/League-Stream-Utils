'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@lib/contexts/AuthContext';
import type { Tournament } from '@lib/types';
import { useModal } from '@lib/contexts/ModalContext';
import { TournamentCreationForm, TournamentList, AdminTournamentManager } from '@components/tournaments';
import { useNavigation } from '@/app/lib/contexts/NavigationContext';

export default function TournamentsPage() {
    const user = useUser();
    const { showAlert } = useModal();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showAdminManager, setShowAdminManager] = useState(false);
    const { setActiveModule } = useNavigation();

    useEffect(() => {
        setActiveModule('tournaments');
        if (user) {
            fetchUserTournaments();
        }
    }, [user]);

    const fetchUserTournaments = async (): Promise<void> => {
        try {
            const response = await fetch('/api/v1/tournaments?mine=true', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTournaments(data.tournaments);
            }
        } catch (error) {
            console.error('Failed to fetch tournaments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTournamentCreated = (tournament: Tournament): void => {
        setTournaments([tournament, ...tournaments]);
        setShowCreateForm(false);
    };

    const handleTournamentUpdated = (updatedTournament: Tournament): void => {
        setTournaments(tournaments.map(t => 
            t.id === updatedTournament.id ? updatedTournament : t
        ));
    };

    const updateTournamentStatus = async (tournamentId: string, status: Tournament['status']): Promise<void> => {
        try {
            const response = await fetch(`/api/v1/tournaments/${tournamentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                const data = await response.json();
                setTournaments(tournaments.map(t =>
                    t.id === tournamentId ? data.tournament : t
                ));
            } else {
                const data = await response.json();
                await showAlert({ type: 'error', message: data.error || 'Failed to update tournament status' });
            }
        } catch (error) {
            await showAlert({ type: 'error', message: 'Failed to update tournament status' });
            console.error('Failed to update tournament status:', error);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please log in to manage tournaments</h1>
                    <a href="/auth" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg">
                        Login
                    </a>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white">
            <div className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">My Tournaments</h1>
                    <div className="flex items-center space-x-4">
                        <p>You are logged in as {user.username}</p>
                        {user.isAdmin && (
                            <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm">Admin</span>
                        )}
                        {user.isAdmin && (
                            <button
                                onClick={() => setShowAdminManager(true)}
                                className="cursor-pointer bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg"
                            >
                                Admin Team Manager
                            </button>
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

                {showAdminManager && (
                    <AdminTournamentManager
                        onClose={() => setShowAdminManager(false)}
                    />
                )}
            </div>
        </div>
    );
} 