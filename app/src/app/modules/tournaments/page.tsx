'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@lib/contexts/AuthContext';
import type { Tournament, CreateTournamentRequest, MatchFormat, TournamentFormat } from '@lib/types';
import { useModal } from '@lib/contexts/ModalContext';

export default function TournamentsPage() {
    const user = useUser();
    const { showAlert } = useModal();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);

    const [formData, setFormData] = useState<Partial<CreateTournamentRequest>>({
        name: '',
        abbreviation: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        matchFormat: 'BO1',
        tournamentFormat: 'Ladder',
        maxTeams: 16,
        fearlessDraft: false,
        selectedTeams: [],
        timezone: 'UTC',
        matchDays: ['wednesday', 'friday'],
        defaultMatchTime: '19:00',
        logo: {
            type: 'url',
            data: '',
            size: 0,
            format: 'png'
        }
    });

    useEffect(() => {
        if (user) {
            fetchUserTournaments();
        }
    }, [user]);

    const fetchUserTournaments = async () => {
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

    const handleCreateTournament = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const response = await fetch('/api/v1/tournaments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setTournaments([data.tournament, ...tournaments]);
                setShowCreateForm(false);
                setFormData({
                    name: '',
                    abbreviation: '',
                    startDate: '',
                    endDate: '',
                    registrationDeadline: '',
                    matchFormat: 'BO1',
                    tournamentFormat: 'Ladder',
                    maxTeams: 16,
                    fearlessDraft: false,
                    selectedTeams: [],
                    timezone: 'UTC',
                    matchDays: ['wednesday', 'friday'],
                    defaultMatchTime: '19:00',
                    logo: {
                        type: 'url',
                        data: '',
                        size: 0,
                        format: 'png'
                    }
                });
            } else {
                await showAlert({ type: 'error', message: data.error || 'Failed to create tournament' });
            }
        } catch (error) {
            await showAlert({ type: 'error', message: 'Failed to create tournament' });
            console.error('Failed to create tournament:', error);
        } finally {
            setCreating(false);
        }
    };

    const updateTournamentStatus = async (tournamentId: string, status: Tournament['status']) => {
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
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
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
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white">
            <div className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">My Tournaments</h1>
                    <p>You are logged in as {user.username}</p>
                </div>

                {showCreateForm && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold mb-4">Create New Tournament</h2>
                        <form onSubmit={handleCreateTournament} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tournament Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Abbreviation</label>
                                    <input
                                        type="text"
                                        value={formData.abbreviation}
                                        onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Start Date</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">End Date</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Registration Deadline</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.registrationDeadline}
                                        onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Max Teams</label>
                                    <input
                                        type="number"
                                        value={formData.maxTeams}
                                        onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                        min={2}
                                        max={128}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Match Format</label>
                                    <select
                                        value={formData.matchFormat}
                                        onChange={(e) => setFormData({ ...formData, matchFormat: e.target.value as MatchFormat })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                    >
                                        <option value="BO1">Best of 1</option>
                                        <option value="BO3">Best of 3</option>
                                        <option value="BO5">Best of 5</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tournament Format</label>
                                    <select
                                        value={formData.tournamentFormat}
                                        onChange={(e) => setFormData({ ...formData, tournamentFormat: e.target.value as TournamentFormat })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                    >
                                        <option value="Ladder">Ladder</option>
                                        <option value="Swiss into Ladder">Swiss into Ladder</option>
                                        <option value="Round Robin into Ladder">Round Robin into Ladder</option>
                                        <option value="Groups">Groups</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.fearlessDraft}
                                        onChange={(e) => setFormData({ ...formData, fearlessDraft: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span>Fearless Draft (League of Legends)</span>
                                </label>
                                <p className="text-sm text-gray-400 mt-1">Champions picked/banned in previous games cannot be used again in the series</p>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg"
                                >
                                    {creating ? 'Creating...' : 'Create Tournament'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="cursor-pointer bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid gap-6">
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
                        tournaments.map((tournament) => (
                            <div key={tournament.id} className="bg-gray-800 rounded-lg p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold">{tournament.name}</h3>
                                        <p className="text-gray-400">{tournament.abbreviation}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded text-sm ${tournament.status === 'draft' ? 'bg-yellow-600' :
                                            tournament.status === 'registration' ? 'bg-blue-600' :
                                                tournament.status === 'ongoing' ? 'bg-green-600' :
                                                    tournament.status === 'completed' ? 'bg-gray-600' :
                                                        'bg-red-600'
                                            }`}>
                                            {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Format</p>
                                        <p>{tournament.matchFormat} • {tournament.tournamentFormat}</p>
                                        {tournament.fearlessDraft && (
                                            <p className="text-xs text-blue-400 mt-1">⚔️ Fearless Draft</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Teams</p>
                                        <p>{tournament.registeredTeams.length} / {tournament.maxTeams}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Start Date</p>
                                        <p>{new Date(tournament.startDate).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex space-x-2">
                                    {tournament.status === 'draft' && (
                                        <button
                                            onClick={() => updateTournamentStatus(tournament.id, 'registration')}
                                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                                        >
                                            Open Registration
                                        </button>
                                    )}
                                    {tournament.status === 'registration' && (
                                        <>
                                            <button
                                                onClick={() => updateTournamentStatus(tournament.id, 'ongoing')}
                                                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                                            >
                                                Start Tournament
                                            </button>
                                            <button
                                                onClick={() => updateTournamentStatus(tournament.id, 'draft')}
                                                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                                            >
                                                Close Registration
                                            </button>
                                        </>
                                    )}
                                    {tournament.status === 'ongoing' && (
                                        <button
                                            onClick={() => updateTournamentStatus(tournament.id, 'completed')}
                                            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                                        >
                                            Complete Tournament
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
} 