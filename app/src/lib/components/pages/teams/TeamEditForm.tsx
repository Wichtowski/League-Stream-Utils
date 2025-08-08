import React, { useState } from 'react';
import type { Team, CreateTeamRequest, TeamTier } from '@lib/types';

interface TeamEditFormProps {
    team: Team;
    onSave: (team: Partial<CreateTeamRequest>) => Promise<void>;
    onCancel: () => void;
}

export const TeamEditForm: React.FC<TeamEditFormProps> = ({ team, onSave, onCancel }) => {
    const [editFormData, setEditFormData] = useState<Partial<CreateTeamRequest>>({
        name: team.name,
        tag: team.tag,
        colors: team.colors,
        players: {
            main: team.players.main.map((p) => ({
                role: p.role,
                inGameName: p.inGameName,
                tag: p.tag
            })),
            substitutes: team.players.substitutes.map((p) => ({
                role: p.role,
                inGameName: p.inGameName,
                tag: p.tag
            }))
        },
        region: team.region,
        tier: team.tier,
        logo: team.logo,
        socialMedia: team.socialMedia,
        staff: team.staff
    });
    const [editing, setEditing] = useState(false);

    const updateEditPlayer = (index: number, field: 'inGameName' | 'tag', value: string) => {
        const newPlayers = [...(editFormData.players?.main || [])];
        newPlayers[index] = { ...newPlayers[index], [field]: value };
        setEditFormData({
            ...editFormData,
            players: { ...editFormData.players!, main: newPlayers }
        });
    };

    const updateEditSubstitute = (index: number, field: 'role' | 'inGameName' | 'tag', value: string) => {
        const newSubs = [...(editFormData.players?.substitutes || [])];
        newSubs[index] = { ...newSubs[index], [field]: value };
        setEditFormData({
            ...editFormData,
            players: { ...editFormData.players!, substitutes: newSubs }
        });
    };

    const addEditSubstitute = () => {
        const newSubs = [...(editFormData.players?.substitutes || [])];
        newSubs.push({ role: 'TOP', inGameName: '', tag: '' });
        setEditFormData({
            ...editFormData,
            players: { ...editFormData.players!, substitutes: newSubs }
        });
    };

    const removeEditSubstitute = (index: number) => {
        const newSubs = [...(editFormData.players?.substitutes || [])];
        newSubs.splice(index, 1);
        setEditFormData({
            ...editFormData,
            players: { ...editFormData.players!, substitutes: newSubs }
        });
    };

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditing(true);
        try {
            await onSave(editFormData);
        } finally {
            setEditing(false);
        }
    };

    return (
        <div className="min-h-screen text-white">
            <div className="container mx-auto px-6 py-8">
                <h1 className="text-3xl font-bold mb-8">Edit Team: {team.name}</h1>

                <form onSubmit={handleEditSave} className="space-y-6 bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Edit Team Information</h2>

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Team Name</label>
                            <input
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Team Tag</label>
                            <input
                                type="text"
                                value={editFormData.tag}
                                onChange={(e) => setEditFormData({ ...editFormData, tag: e.target.value })}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                                maxLength={5}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Region</label>
                            <input
                                type="text"
                                value={editFormData.region}
                                onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                                placeholder="e.g., EUNE, EUW, NA"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Tier</label>
                            <select
                                value={editFormData.tier}
                                onChange={(e) =>
                                    setEditFormData({
                                        ...editFormData,
                                        tier: e.target.value as TeamTier
                                    })
                                }
                                className="w-full bg-gray-700 rounded px-3 py-2"
                            >
                                <option value="amateur">Amateur</option>
                                <option value="semi-pro">Semi-Professional</option>
                                <option value="professional">Professional</option>
                            </select>
                        </div>
                    </div>

                    {/* Main Roster */}
                    <div>
                        <h3 className="text-lg font-medium mb-3">Main Roster</h3>
                        <div className="space-y-3">
                            {editFormData.players?.main.map((player, index) => (
                                <div key={player.role} className="grid grid-cols-3 gap-4 items-center">
                                    <div className="bg-gray-700 px-3 py-2 rounded text-center font-medium">
                                        {player.role}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="In-game name"
                                        value={player.inGameName}
                                        onChange={(e) => updateEditPlayer(index, 'inGameName', e.target.value)}
                                        className="bg-gray-700 rounded px-3 py-2"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Riot tag (e.g., #EUW)"
                                        value={player.tag}
                                        onChange={(e) => updateEditPlayer(index, 'tag', e.target.value)}
                                        className="bg-gray-700 rounded px-3 py-2"
                                        required
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Substitutes */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-medium">Substitutes</h3>
                            <button
                                type="button"
                                onClick={addEditSubstitute}
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                            >
                                Add Substitute
                            </button>
                        </div>
                        <div className="space-y-3">
                            {editFormData.players?.substitutes.map((player, index) => (
                                <div key={index} className="grid grid-cols-4 gap-4 items-center">
                                    <select
                                        value={player.role}
                                        onChange={(e) => updateEditSubstitute(index, 'role', e.target.value)}
                                        className="bg-gray-700 rounded px-3 py-2"
                                    >
                                        <option value="TOP">TOP</option>
                                        <option value="JUNGLE">JUNGLE</option>
                                        <option value="MID">MID</option>
                                        <option value="ADC">ADC</option>
                                        <option value="SUPPORT">SUPPORT</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="In-game name"
                                        value={player.inGameName}
                                        onChange={(e) => updateEditSubstitute(index, 'inGameName', e.target.value)}
                                        className="bg-gray-700 rounded px-3 py-2"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Riot tag"
                                        value={player.tag}
                                        onChange={(e) => updateEditSubstitute(index, 'tag', e.target.value)}
                                        className="bg-gray-700 rounded px-3 py-2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeEditSubstitute(index)}
                                        className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex space-x-4 mt-6">
                        <button
                            type="submit"
                            disabled={editing}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg"
                        >
                            {editing ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
