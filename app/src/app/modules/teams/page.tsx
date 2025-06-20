'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@lib/contexts/AuthContext';
import type { Team, CreateTeamRequest } from '@lib/types';
import { useModal } from '@lib/contexts/ModalContext';

export default function TeamsPage() {
    const user = useUser();
    const { showAlert, showConfirm } = useModal();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [verifyingPlayers, setVerifyingPlayers] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState<Partial<CreateTeamRequest>>({
        name: '',
        tag: '',
        colors: {
            primary: '#3B82F6',
            secondary: '#1E40AF',
            accent: '#FFFFFF'
        },
        players: {
            main: [
                { role: 'TOP', inGameName: '', tag: '' },
                { role: 'JUNGLE', inGameName: '', tag: '' },
                { role: 'MID', inGameName: '', tag: '' },
                { role: 'ADC', inGameName: '', tag: '' },
                { role: 'SUPPORT', inGameName: '', tag: '' }
            ],
            substitutes: []
        },
        region: '',
        tier: 'amateur',
        logo: {
            type: 'url',
            data: '',
            size: 0,
            format: 'png'
        }
    });

    useEffect(() => {
        if (user) {
            fetchUserTeams();
        }
    }, [user]);

    const fetchUserTeams = async () => {
        try {
            const response = await fetch('/api/v1/teams', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTeams(data.teams);
            }
        } catch (error) {
            console.error('Failed to fetch teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const response = await fetch('/api/v1/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setTeams([data.team, ...teams]);
                setShowCreateForm(false);
                resetForm();
            } else {
                alert(data.error || 'Failed to create team');
            }
        } catch (error) {
            alert('Failed to create team');
        } finally {
            setCreating(false);
        }
    };

    const handleLogoUrlChange = (url: string) => {
        setFormData({
            ...formData,
            logo: {
                type: 'url',
                data: url,
                size: 0,
                format: 'png'
            }
        });
        setLogoPreview(url);
    };

    const handleLogoFileChange = async (file: File) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            alert('Image must be smaller than 5MB');
            return;
        }

        const format = file.type.split('/')[1] as 'png' | 'jpg' | 'webp' | 'jpeg';
        if (!['png', 'jpg', 'jpeg', 'webp'].includes(format)) {
            alert('Supported formats: PNG, JPG, WEBP');
            return;
        }

        // Convert to base64
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setFormData({
                ...formData,
                logo: {
                    type: 'upload',
                    data: base64,
                    size: file.size,
                    format: format === 'jpeg' ? 'jpg' : format
                }
            });
            setLogoPreview(base64);
        };
        reader.readAsDataURL(file);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            tag: '',
            colors: {
                primary: '#3B82F6',
                secondary: '#1E40AF',
                accent: '#FFFFFF'
            },
            players: {
                main: [
                    { role: 'TOP', inGameName: '', tag: '' },
                    { role: 'JUNGLE', inGameName: '', tag: '' },
                    { role: 'MID', inGameName: '', tag: '' },
                    { role: 'ADC', inGameName: '', tag: '' },
                    { role: 'SUPPORT', inGameName: '', tag: '' }
                ],
                substitutes: []
            },
            region: '',
            tier: 'amateur',
            logo: {
                type: 'url',
                data: '',
                size: 0,
                format: 'png'
            }
        });
        setLogoPreview('');
    };

    const updatePlayer = (index: number, field: 'inGameName' | 'tag', value: string) => {
        const newPlayers = [...(formData.players?.main || [])];
        newPlayers[index] = { ...newPlayers[index], [field]: value };
        setFormData({
            ...formData,
            players: { ...formData.players!, main: newPlayers }
        });
    };

    const addSubstitute = () => {
        const newSubs = [...(formData.players?.substitutes || [])];
        newSubs.push({ role: 'TOP', inGameName: '', tag: '' });
        setFormData({
            ...formData,
            players: { ...formData.players!, substitutes: newSubs }
        });
    };

    const removeSubstitute = (index: number) => {
        const newSubs = [...(formData.players?.substitutes || [])];
        newSubs.splice(index, 1);
        setFormData({
            ...formData,
            players: { ...formData.players!, substitutes: newSubs }
        });
    };

    const updateSubstitute = (index: number, field: 'role' | 'inGameName' | 'tag', value: string) => {
        const newSubs = [...(formData.players?.substitutes || [])];
        newSubs[index] = { ...newSubs[index], [field]: value };
        setFormData({
            ...formData,
            players: { ...formData.players!, substitutes: newSubs }
        });
    };

    const handleVerifyPlayer = async (teamId: string, playerId: string, playerName: string, playerTag: string) => {
        if (verifyingPlayers.has(playerId)) return;

        try {
            setVerifyingPlayers(prev => new Set(prev).add(playerId));

            const response = await fetch(`/api/v1/teams/${teamId}/players/${playerId}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    gameName: playerName,
                    tagLine: playerTag
                })
            });

            const data = await response.json();

            if (response.ok) {
                await showAlert({
                    type: 'success',
                    message: `Player ${playerName} verified successfully!`
                });

                await fetchUserTeams();
            } else {
                await showAlert({
                    type: 'error',
                    message: data.error || 'Failed to verify player'
                });
            }
        } catch (error) {
            console.error('Error verifying player:', error);
            await showAlert({
                type: 'error',
                message: 'Failed to verify player'
            });
        } finally {
            setVerifyingPlayers(prev => {
                const newSet = new Set(prev);
                newSet.delete(playerId);
                return newSet;
            });
        }
    };

    const handleVerifyAllPlayers = async (team: Team) => {
        const unverifiedPlayers = team.players.main.filter(p => !p.verified);

        if (unverifiedPlayers.length === 0) {
            await showAlert({
                type: 'info',
                message: 'All players are already verified!'
            });
            return;
        }

        const confirmed = await showConfirm({
            title: 'Verify All Players',
            message: `This will attempt to verify ${unverifiedPlayers.length} unverified players. Continue?`,
            type: 'default'
        });

        if (!confirmed) return;

        for (const player of unverifiedPlayers) {
            await handleVerifyPlayer(team.id, player.id, player.inGameName, player.tag);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Please log in to manage teams</h1>
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
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">My Teams</h1>
                    <p>You are logged in as {user.username}</p>
                </div>

                {showCreateForm && (
                    <div className="bg-gray-800 rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-bold mb-4">Create New Team</h2>
                        <form onSubmit={handleCreateTeam} className="space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Team Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Team Tag</label>
                                    <input
                                        type="text"
                                        value={formData.tag}
                                        onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                        maxLength={5}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Region</label>
                                    <input
                                        type="text"
                                        value={formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                        placeholder="e.g., EUNE, EUW, NA"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tier</label>
                                    <select
                                        value={formData.tier}
                                        onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                    >
                                        <option value="amateur">Amateur</option>
                                        <option value="semi-pro">Semi-Professional</option>
                                        <option value="professional">Professional</option>
                                    </select>
                                </div>
                            </div>

                            {/* Team Logo */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Team Logo</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Upload Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleLogoFileChange(e.target.files[0])}
                                            className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Max 5MB • PNG, JPG, WEBP</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Or paste URL</label>
                                        <input
                                            type="url"
                                            value={formData.logo?.type === 'url' ? formData.logo.data : ''}
                                            onChange={(e) => handleLogoUrlChange(e.target.value)}
                                            className="w-full bg-gray-700 rounded px-3 py-2"
                                            placeholder="https://example.com/logo.png"
                                        />
                                    </div>
                                </div>
                                {logoPreview && (
                                    <div className="mt-4 flex justify-center">
                                        <div className="bg-gray-700 rounded-lg p-4">
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                width={100}
                                                height={100}
                                                className="rounded-lg object-contain"
                                                onError={() => setLogoPreview('')}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Team Colors */}
                            <div>
                                <h3 className="text-lg font-medium mb-3">Team Colors</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Primary Color</label>
                                        <input
                                            type="color"
                                            value={formData.colors?.primary}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                colors: { ...formData.colors!, primary: e.target.value }
                                            })}
                                            className="w-full h-10 rounded border-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Secondary Color</label>
                                        <input
                                            type="color"
                                            value={formData.colors?.secondary}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                colors: { ...formData.colors!, secondary: e.target.value }
                                            })}
                                            className="w-full h-10 rounded border-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Accent Color</label>
                                        <input
                                            type="color"
                                            value={formData.colors?.accent}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                colors: { ...formData.colors!, accent: e.target.value }
                                            })}
                                            className="w-full h-10 rounded border-gray-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Main Roster */}
                            <div>
                                <h3 className="text-lg font-medium mb-3">Main Roster (5 players required)</h3>
                                <div className="space-y-3">
                                    {formData.players?.main.map((player, index) => (
                                        <div key={player.role} className="grid grid-cols-3 gap-4 items-center">
                                            <div className="bg-gray-700 px-3 py-2 rounded text-center font-medium">
                                                {player.role}
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="In-game name"
                                                value={player.inGameName}
                                                onChange={(e) => updatePlayer(index, 'inGameName', e.target.value)}
                                                className="bg-gray-700 rounded px-3 py-2"
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="Riot tag (e.g., #EUW)"
                                                value={player.tag}
                                                onChange={(e) => updatePlayer(index, 'tag', e.target.value)}
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
                                        onClick={addSubstitute}
                                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                                    >
                                        Add Substitute
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.players?.substitutes.map((player, index) => (
                                        <div key={index} className="grid grid-cols-4 gap-4 items-center">
                                            <select
                                                value={player.role}
                                                onChange={(e) => updateSubstitute(index, 'role', e.target.value)}
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
                                                onChange={(e) => updateSubstitute(index, 'inGameName', e.target.value)}
                                                className="bg-gray-700 rounded px-3 py-2"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Riot tag"
                                                value={player.tag}
                                                onChange={(e) => updateSubstitute(index, 'tag', e.target.value)}
                                                className="bg-gray-700 rounded px-3 py-2"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeSubstitute(index)}
                                                className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg"
                                >
                                    {creating ? 'Creating...' : 'Create Team'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid gap-6">
                    {teams.length === 0 ? (
                        <div className="text-center py-12">
                            <h3 className="text-xl text-gray-400 mb-4">No teams created yet</h3>
                            <button
                                onClick={() => setShowCreateForm(true)}
                                className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                            >
                                Create Your First Team
                            </button>
                        </div>
                    ) : (
                        teams.map((team) => (
                            <div key={team.id} className="bg-gray-800 rounded-lg p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold">{team.name}</h3>
                                        <p className="text-gray-400">{team.tag} • {team.region} • {team.tier}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className="w-6 h-6 rounded"
                                            style={{ backgroundColor: team.colors.primary }}
                                        ></div>
                                        <span className={`px-3 py-1 rounded text-sm ${team.verified ? 'bg-green-600' : 'bg-yellow-600'
                                            }`}>
                                            {team.verified ? 'Verified' : 'Pending Verification'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-medium">Main Roster</h4>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleVerifyAllPlayers(team)}
                                                className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                                            >
                                                Verify All
                                            </button>
                                            {user.isAdmin && (
                                                <button
                                                    onClick={async () => {
                                                        const confirmed = await showConfirm({
                                                            title: 'Admin Verify Team',
                                                            message: `Verify entire team "${team.name}" and all players?`,
                                                            type: 'default'
                                                        });

                                                        if (confirmed) {
                                                            try {
                                                                const response = await fetch(`/api/v1/teams/${team.id}/verify`, {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                                                    },
                                                                    body: JSON.stringify({ verified: true, verifyPlayers: true })
                                                                });

                                                                if (response.ok) {
                                                                    await showAlert({ type: 'success', message: 'Team verified successfully!' });
                                                                    await fetchUserTeams();
                                                                } else {
                                                                    await showAlert({ type: 'error', message: 'Failed to verify team' });
                                                                }
                                                            } catch (error) {
                                                                await showAlert({ type: 'error', message: 'Failed to verify team' });
                                                            }
                                                        }
                                                    }}
                                                    className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
                                                >
                                                    Admin Verify
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                                        {team.players.main.map((player) => (
                                            <div key={player.id} className="bg-gray-700 rounded p-3 text-center">
                                                <div className="text-xs text-gray-400 mb-1">{player.role}</div>
                                                <div className="font-medium">{player.inGameName}</div>
                                                <div className="text-xs text-gray-400 mb-2">{player.tag}</div>

                                                {player.verified ? (
                                                    <div className="text-xs text-green-400">
                                                        ✓ Verified
                                                        {player.verifiedAt && (
                                                            <div className="text-gray-500">
                                                                {new Date(player.verifiedAt).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleVerifyPlayer(team.id, player.id, player.inGameName, player.tag)}
                                                        disabled={verifyingPlayers.has(player.id)}
                                                        className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded transition-colors w-full"
                                                    >
                                                        {verifyingPlayers.has(player.id) ? 'Verifying...' : 'Verify'}
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Show substitute players if any */}
                                {team.players.substitutes.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-medium mb-2">Substitutes</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                            {team.players.substitutes.map((player) => (
                                                <div key={player.id} className="bg-gray-700 rounded p-3 text-center">
                                                    <div className="text-xs text-gray-400 mb-1">{player.role}</div>
                                                    <div className="font-medium">{player.inGameName}</div>
                                                    <div className="text-xs text-gray-400 mb-2">{player.tag}</div>

                                                    {player.verified ? (
                                                        <div className="text-xs text-green-400">✓ Verified</div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleVerifyPlayer(team.id, player.id, player.inGameName, player.tag)}
                                                            disabled={verifyingPlayers.has(player.id)}
                                                            className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded transition-colors w-full"
                                                        >
                                                            {verifyingPlayers.has(player.id) ? 'Verifying...' : 'Verify'}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Team verification status summary */}
                                <div className="mt-4 p-3 bg-gray-700 rounded">
                                    <div className="text-sm text-gray-300">
                                        <strong>Verification Status:</strong>
                                        <span className={`ml-2 ${team.verified ? 'text-green-400' : 'text-yellow-400'}`}>
                                            {team.verified ? 'Team Verified' : 'Pending Team Verification'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Players: {team.players.main.filter(p => p.verified).length}/{team.players.main.length} verified
                                        {team.players.substitutes.length > 0 && (
                                            <span> • Subs: {team.players.substitutes.filter(p => p.verified).length}/{team.players.substitutes.length} verified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
} 