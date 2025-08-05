'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@lib/contexts/AuthContext';
import { useTournaments } from '@lib/contexts/TournamentsContext';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useModal } from '@lib/components/modal';
import { AuthGuard } from '@lib/components/auth/AuthGuard';
import { LoadingSpinner } from '@lib/components/common';
import { BackButton } from '@/lib/components/common/buttons';
import { tournamentStorage } from '@lib/utils/storage/tournament-storage';

// Dynamic imports for lazy loading
const TournamentCreationForm = dynamic(
  () => import('@lib/components/pages/tournaments').then(mod => ({ default: mod.TournamentCreationForm })),
  { 
    loading: () => <LoadingSpinner text="Loading tournament form..." />,
    ssr: false 
  }
);

export default function TournamentsPage() {
    const { user } = useAuth();
    const { 
        tournaments, 
        loading: tournamentsLoading, 
        error
    } = useTournaments();
    const { setActiveModule } = useNavigation();
    const { showAlert } = useModal();
    const [showCreateForm, setShowCreateForm] = useState(false);

    useEffect(() => {
        setActiveModule('tournaments');
    }, [setActiveModule]);

    const handleTournamentCreated = (): void => {
        setShowCreateForm(false);
    };

    useEffect(() => {
        if (error) {
            showAlert({ type: 'error', message: error });
        }
    }, [error, showAlert]);

    if (showCreateForm) {
        return (
            <AuthGuard loadingMessage="Loading tournaments...">
                <div className="mb-4">
                    <BackButton to="/modules">Back to Modules</BackButton>
                </div>
                <div className="min-h-screen text-white">
                    <div className="container mx-auto px-6 py-8">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold">Create Tournament</h1>
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
                            >
                                Cancel
                            </button>
                        </div>
                        <Suspense fallback={<LoadingSpinner text="Loading tournament form..." />}>
                            <TournamentCreationForm
                                onTournamentCreated={handleTournamentCreated}
                                onCancel={() => setShowCreateForm(false)}
                            />
                        </Suspense>
                    </div>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard loadingMessage="Loading tournaments...">
            <div className="mb-4">
                <BackButton to="/modules">Back to Modules</BackButton>
            </div>
            {tournamentsLoading && tournaments.length === 0 ? (
                <LoadingSpinner fullscreen text="Loading tournaments..." />
            ) : (
                <div className="min-h-screen text-white">
                    <div className="container mx-auto px-6 py-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center space-x-4">
                                <h1 className="text-3xl font-bold">My Tournaments</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                {user?.isAdmin && (
                                    <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm">
                                        Admin
                                    </span>
                                )}
                                {tournaments.length > 0 && (
                                    <button
                                        onClick={() => setShowCreateForm(true)}
                                        className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                                    >
                                        Create Tournament
                                    </button>
                                )}
                            </div>
                        </div>

                        {tournaments.length === 0 ? (
                            <div className="text-center py-12">
                                <h3 className="text-xl text-gray-400 mb-4">No tournaments created yet</h3>
                                <button
                                    onClick={() => setShowCreateForm(true)}
                                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                                >
                                    Create Your First Tournament
                                </button>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-xl text-white mb-6 text-center">Select Tournament to Edit</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {tournaments.map((tournament) => (
                                        <Link
                                            key={tournament.id}
                                            href={`/modules/tournaments/${tournament.id}`}
                                            className="bg-gray-800 hover:bg-blue-700 text-white rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-200 shadow-lg text-left block"
                                            onClick={async () => {
                                                try {
                                                    await tournamentStorage.setLastSelectedTournament(tournament.id, tournament.name);
                                                } catch (error) {
                                                    console.error('Failed to save last selected tournament:', error);
                                                }
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold">{tournament.name}</h3>
                                                    <p className="text-gray-400 text-sm">{tournament.abbreviation}</p>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    tournament.status === 'draft' ? 'bg-yellow-600' :
                                                    tournament.status === 'registration' ? 'bg-blue-600' :
                                                    tournament.status === 'ongoing' ? 'bg-green-600' :
                                                    tournament.status === 'completed' ? 'bg-gray-600' :
                                                    'bg-red-600'
                                                }`}>
                                                    {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <span className="text-gray-400">Format:</span> {tournament.matchFormat} • {tournament.tournamentFormat}
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Teams:</span> {tournament.registeredTeams.length} / {tournament.maxTeams}
                                                </div>
                                                <div>
                                                    <span className="text-gray-400">Start:</span> {new Date(tournament.startDate).toLocaleDateString()}
                                                </div>
                                                {tournament.fearlessDraft && (
                                                    <div className="text-blue-400 text-xs">⚔️ Fearless Draft</div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AuthGuard>
    );
} 