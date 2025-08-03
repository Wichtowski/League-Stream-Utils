'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useModal } from '@lib/contexts/ModalContext';
import type { Tournament, Team, CreateTeamRequest } from '@lib/types';
import { OverlayLoader } from '@lib/components/common';
import { TeamCreationForm } from '@lib/components/pages/teams/TeamCreationForm';

interface StandaloneTeamManagerProps {
    tournament: Tournament;
    onClose: () => void;
    onTeamAdded: (updatedTournament: Tournament) => void;
}

export const StandaloneTeamManager = ({ tournament, onClose, onTeamAdded }: StandaloneTeamManagerProps): React.ReactElement => {
    const { showAlert } = useModal();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creatingTeam, setCreatingTeam] = useState(false);

    const fetchTeams = useCallback(async (): Promise<void> => {
        try {
            const response = await fetch('/api/v1/teams/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTeams(data.teams || []);
            } else {
                await showAlert({ type: 'error', message: 'Failed to fetch teams' });
            }
        } catch (error) {
            await showAlert({ type: 'error', message: 'Failed to fetch teams' });
            console.error('Failed to fetch teams:', error);
        } finally {
            setLoading(false);
        }
    }, [showAlert]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const handleCreateTeam = useCallback(async (teamData: CreateTeamRequest): Promise<void> => {
        setCreatingTeam(true);
        try {
            const response = await fetch('/api/v1/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(teamData)
            });

            const data = await response.json();

            if (response.ok) {
                await showAlert({ type: 'success', message: 'Team created successfully' });
                // Refresh teams list
                await fetchTeams();
                setShowCreateForm(false);
                // Auto-select the newly created team
                setSelectedTeam(data.team.id);
            } else {
                await showAlert({ type: 'error', message: data.error || 'Failed to create team' });
            }
        } catch (error) {
            await showAlert({ type: 'error', message: 'Failed to create team' });
            console.error('Failed to create team:', error);
        } finally {
            setCreatingTeam(false);
        }
    }, [showAlert, fetchTeams]);

    const handleRegisterTeam = useCallback(async (): Promise<void> => {
        if (!selectedTeam) {
            await showAlert({ type: 'error', message: 'Please select a team' });
            return;
        }

        setRegistering(true);
        try {
            const response = await fetch(`/api/v1/tournaments/${tournament.id}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ teamId: selectedTeam })
            });

            const data = await response.json();

            if (response.ok) {
                await showAlert({ type: 'success', message: data.message });
                onTeamAdded(data.tournament);
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
    }, [tournament.id, selectedTeam, showAlert, onTeamAdded]);

    const handleUnregisterTeam = useCallback(async (teamId: string): Promise<void> => {
        try {
            const response = await fetch(`/api/v1/tournaments/${tournament.id}/register`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ teamId })
            });

            const data = await response.json();

            if (response.ok) {
                await showAlert({ type: 'success', message: data.message });
                onTeamAdded(data.tournament);
            } else {
                await showAlert({ type: 'error', message: data.error || 'Failed to unregister team' });
            }
        } catch (error) {
            await showAlert({ type: 'error', message: 'Failed to unregister team' });
            console.error('Failed to unregister team:', error);
        }
    }, [tournament.id, showAlert, onTeamAdded]);

    const selectedTeamData = teams.find(t => t.id === selectedTeam);

    if (loading) {
        return <OverlayLoader text="Loading teams..." />;
    }

    if (showCreateForm) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Create Standalone Team</h2>
                            <p className="text-gray-400">Create a team specifically for {tournament.name}</p>
                        </div>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="text-gray-400 hover:text-white text-2xl font-bold"
                        >
                            ×
                        </button>
                    </div>

                    <TeamCreationForm
                        onSubmit={handleCreateTeam}
                        onCancel={() => setShowCreateForm(false)}
                        isCreating={creatingTeam}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Add Standalone Teams</h2>
                        <p className="text-gray-400">Add teams to {tournament.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Team Selection */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                            >
                                Create New Team
                            </button>
                        </div>
                        
                        

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {teams.map((team) => (
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
                                            <div className="font-medium">{team.name}</div>
                                            <div className="text-sm opacity-75">({team.tag})</div>
                                        </div>
                                        <div className="text-sm opacity-75">
                                            {team.players.main.length}/5 players
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Registration Action */}
                    {selectedTeam && (
                        <div className="p-4 bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="font-medium text-white">Ready to Register</h4>
                                    <p className="text-sm text-gray-400">
                                        Register <span className="text-green-400 font-medium">{selectedTeamData?.name}</span> to <span className="text-blue-400 font-medium">{tournament.name}</span>
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
                            
                            {selectedTeamData && (
                                <div className="text-xs text-gray-400 space-y-1">
                                    <p><strong>Team Details:</strong></p>
                                    <ul className="list-disc list-inside ml-4 space-y-1">
                                        <li>Region: {selectedTeamData.region}</li>
                                        <li>Tier: {selectedTeamData.tier}</li>
                                        <li>Players: {selectedTeamData.players.main.length}/5 main roster</li>
                                        <li>Substitutes: {selectedTeamData.players.substitutes.length}</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Registered Teams Display */}
                    {tournament.registeredTeams.length > 0 && (
                        <div className="lg:col-span-2">
                            <h3 className="text-lg font-semibold text-white mb-4">
                                Registered Teams ({tournament.registeredTeams.length})
                            </h3>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {tournament.registeredTeams.map((teamId) => {
                                    const team = teams.find(t => t.id === teamId);
                                    return (
                                        <div key={teamId} className="flex items-center justify-between bg-gray-700 p-3 rounded-lg">
                                            <div>
                                                <span className="text-white font-medium">{team?.name || 'Unknown Team'}</span>
                                                <span className="text-gray-400 ml-2">({team?.tag || 'N/A'})</span>
                                            </div>
                                            <button
                                                onClick={() => handleUnregisterTeam(teamId)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                                            >
                                                Remove
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