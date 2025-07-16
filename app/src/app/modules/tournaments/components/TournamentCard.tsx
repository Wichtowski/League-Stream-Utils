'use client';

import { useState } from 'react';
import type { Tournament } from '@lib/types';
import { MyTeamRegistration } from './index';

interface TournamentCardProps {
    tournament: Tournament;
    onStatusUpdate: (tournamentId: string, status: Tournament['status']) => void;
    onTournamentUpdate?: (tournament: Tournament) => void;
}

export const TournamentCard = ({ tournament, onStatusUpdate, onTournamentUpdate }: TournamentCardProps): React.ReactElement => {
    const [showMyTeamRegistration, setShowMyTeamRegistration] = useState(false);

    const handleTournamentUpdated = (updatedTournament: Tournament) => {
        onTournamentUpdate?.(updatedTournament);
        setShowMyTeamRegistration(false);
    };
    return (
        <div className="bg-gray-800 rounded-lg p-6">
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

            <div className="flex flex-wrap gap-2">
                {tournament.status === 'draft' && (
                    <button
                        onClick={() => onStatusUpdate(tournament.id, 'registration')}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                    >
                        Open Registration
                    </button>
                )}
                {tournament.status === 'registration' && (
                    <>
                        <button
                            onClick={() => onStatusUpdate(tournament.id, 'ongoing')}
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                        >
                            Start Tournament
                        </button>
                        <button
                            onClick={() => setShowMyTeamRegistration(true)}
                            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
                        >
                            Add My Teams
                        </button>
                        <button
                            onClick={() => onStatusUpdate(tournament.id, 'draft')}
                            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                        >
                            Close Registration
                        </button>
                    </>
                )}
                {tournament.status === 'ongoing' && (
                    <button
                        onClick={() => onStatusUpdate(tournament.id, 'completed')}
                        className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm"
                    >
                        Complete Tournament
                    </button>
                )}
            </div>

            {showMyTeamRegistration && (
                <MyTeamRegistration
                    tournament={tournament}
                    onClose={() => setShowMyTeamRegistration(false)}
                    onTeamRegistered={handleTournamentUpdated}
                />
            )}
        </div>
    );
};
