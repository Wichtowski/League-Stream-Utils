'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useModal } from '@lib/contexts/ModalContext';
import type { Tournament, Team } from '@lib/types';
import { OverlayLoader } from '@components/common';

interface AdminTournamentManagerProps {
    onClose: () => void;
}

export const AdminTournamentManager = ({ onClose }: AdminTournamentManagerProps): React.ReactElement => {
    const { showAlert } = useModal();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAdminData = useCallback(async (): Promise<void> => {
        try {
            const response = await fetch('/api/v1/admin/tournaments/register', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTournaments(data.tournaments);
                setTeams(data.teams);
            } else {
                await showAlert({ type: 'error', message: 'Failed to fetch admin data' });
            }
        } catch (error) {
            await showAlert({ type: 'error', message: 'Failed to fetch admin data' });
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    }, [showAlert]);


    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const handleRegisterTeam = useCallback(async (): Promise<void> => {
        if (!selectedTournament || !selectedTeam) {
            await showAlert({ type: 'error', message: 'Please select both a tournament and a team' });
            return;
        }

        setRegistering(true);
        try {
            const response = await fetch('/api/v1/admin/tournaments/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    tournamentId: selectedTournament,
                    teamId: selectedTeam,
                    bypassValidation: true
                })
            });

            const data = await response.json();

            if (response.ok) {
                await showAlert({ type: 'success', message: data.message });
                // Update local tournaments data
                setTournaments(tournaments.map(t => 
                    t.id === selectedTournament ? data.tournament : t
                ));
                setSelectedTeam('');
            } else {
                await showAlert({ type: 'error', message: data.error || 'Failed to register team' });
            }
        } catch (error) {
            await showAlert({ type: 'error', message: 'Failed to register team' });
            console.error('Failed to register team:', error);
        } finally {
            setRegistering(false);
        }
    }, [tournaments, showAlert, selectedTournament, selectedTeam]);

    const handleUnregisterTeam = useCallback(async (tournamentId: string, teamId: string): Promise<void> => {
        try {
            const response = await fetch('/api/v1/admin/tournaments/register', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ tournamentId, teamId })
            });

            const data = await response.json();

            if (response.ok) {
                await showAlert({ type: 'success', message: data.message });
                // Update local tournaments data
                setTournaments(tournaments.map(t => 
                    t.id === tournamentId ? data.tournament : t
                ));
            } else {
                await showAlert({ type: 'error', message: data.error || 'Failed to unregister team' });
            }
        } catch (error) {
            await showAlert({ type: 'error', message: 'Failed to unregister team' });
            console.error('Failed to unregister team:', error);
        }
    }, [tournaments, showAlert]);

    const filteredTournaments = tournaments.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTeams = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.tag.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);
    const selectedTeamData = teams.find(t => t.id === selectedTeam);

    if (loading) {
        return <OverlayLoader text="Loading admin data..." />;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">Admin Tournament Registration</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-2xl"
                        >
                            ×
                        </button>
                    </div>
                    <p className="text-gray-400 mt-2">Register any team to any tournament with admin privileges</p>
                </div>

                <div className="p-6">
                    {/* Search */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Search tournaments and teams..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tournament Selection */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Select Tournament</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {filteredTournaments.map((tournament) => (
                                    <div
                                        key={tournament.id}
                                        onClick={() => setSelectedTournament(tournament.id)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                            selectedTournament === tournament.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-medium">{tournament.name}</h4>
                                                <p className="text-sm opacity-75">{tournament.abbreviation}</p>
                                                <p className="text-xs opacity-60">
                                                    {tournament.registeredTeams.length}/{tournament.maxTeams} teams
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs ${
                                                tournament.status === 'draft' ? 'bg-yellow-600' :
                                                tournament.status === 'registration' ? 'bg-blue-600' :
                                                tournament.status === 'ongoing' ? 'bg-green-600' :
                                                tournament.status === 'completed' ? 'bg-gray-600' :
                                                'bg-red-600'
                                            }`}>
                                                {tournament.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Team Selection */}
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Select Team</h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {filteredTeams.map((team) => (
                                    <div
                                        key={team.id}
                                        onClick={() => setSelectedTeam(team.id)}
                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                            selectedTeam === team.id
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium">{team.name}</h4>
                                                <p className="text-sm opacity-75">{team.tag}</p>
                                                <p className="text-xs opacity-60">
                                                    {team.players.main.length}/5 players
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {team.verified && (
                                                    <span className="text-green-400 text-xs">✓ Verified</span>
                                                )}
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    team.tier === 'professional' ? 'bg-purple-600' :
                                                    team.tier === 'semi-pro' ? 'bg-blue-600' :
                                                    'bg-gray-600'
                                                }`}>
                                                    {team.tier}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Registration Action */}
                    {(selectedTournament && selectedTeam) && (
                        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="font-medium text-white">Ready to Register</h4>
                                    <p className="text-sm text-gray-400">
                                        Register <span className="text-green-400 font-medium">{selectedTeamData?.name}</span> to <span className="text-blue-400 font-medium">{selectedTournamentData?.name}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleRegisterTeam}
                                    disabled={registering}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                >
                                    {registering ? 'Registering...' : 'Register Team'}
                                </button>
                            </div>
                            
                            {/* Admin Bypass Info */}
                            <div className="text-xs text-gray-400 space-y-1">
                                <p>🔧 <strong>Admin Bypass:</strong> This registration will ignore:</p>
                                <ul className="list-disc list-inside ml-4 space-y-1">
                                    <li>Tournament status and registration deadlines</li>
                                    <li>Team capacity limits</li>
                                    <li>Player verification requirements</li>
                                    <li>Complete roster requirements</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Registered Teams Display */}
                    {selectedTournamentData && selectedTournamentData.registeredTeams.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Registered Teams ({selectedTournamentData.registeredTeams.length})
                            </h3>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedTournamentData.registeredTeams.map((teamId) => {
                                    const team = teams.find(t => t.id === teamId);
                                    return (
                                        <div key={teamId} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                                            <div>
                                                <span className="text-white font-medium">{team?.name || 'Unknown Team'}</span>
                                                <span className="text-gray-400 ml-2">({team?.tag || 'N/A'})</span>
                                            </div>
                                            <button
                                                onClick={() => handleUnregisterTeam(selectedTournamentData.id, teamId)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Unregister
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
 