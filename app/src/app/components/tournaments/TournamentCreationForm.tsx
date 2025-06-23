'use client';

import { useState } from 'react';
import type { Tournament, CreateTournamentRequest, MatchFormat, TournamentFormat } from '@lib/types';
import { useModal } from '@lib/contexts/ModalContext';

interface TournamentCreationFormProps {
    onTournamentCreated: (tournament: Tournament) => void;
    onCancel: () => void;
}

export default function TournamentCreationForm({ onTournamentCreated, onCancel }: TournamentCreationFormProps) {
    const { showAlert } = useModal();
    const [creating, setCreating] = useState(false);

    const [formData, setFormData] = useState<Partial<CreateTournamentRequest>>({
        name: '',
        abbreviation: '',
        startDate: '',
        endDate: '',
        requireRegistrationDeadline: false,
        matchFormat: 'BO1',
        tournamentFormat: 'Ladder',
        phaseMatchFormats: {
            default: 'BO1'
        },
        maxTeams: 16,
        fearlessDraft: false,
        selectedTeams: [],
        timezone: 'UTC',
        matchDays: [''],
        defaultMatchTime: '19:00',
        logo: {
            type: 'url',
            data: 'https://via.placeholder.com/200x200/1f2937/ffffff?text=Tournament',
            size: 0,
            format: 'png'
        }
    });

    const handleCreateTournament = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            // Clean up the form data - remove empty or undefined fields
            const cleanedFormData = { ...formData };
            
            // Remove empty registrationDeadline if not required
            if (!cleanedFormData.requireRegistrationDeadline || !cleanedFormData.registrationDeadline) {
                delete cleanedFormData.registrationDeadline;
            }
            
            // Ensure arrays exist (but can be empty)
            if (!cleanedFormData.matchDays) {
                cleanedFormData.matchDays = [];
            }
            
            if (!cleanedFormData.selectedTeams) {
                cleanedFormData.selectedTeams = [];
            }
            
            // Ensure phaseMatchFormats has at least default
            if (!cleanedFormData.phaseMatchFormats || !cleanedFormData.phaseMatchFormats.default) {
                cleanedFormData.phaseMatchFormats = {
                    ...cleanedFormData.phaseMatchFormats,
                    default: cleanedFormData.matchFormat || 'BO1'
                };
            }

            const response = await fetch('/api/v1/tournaments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(cleanedFormData)
            });

            const data = await response.json();

            if (response.ok) {
                onTournamentCreated(data.tournament);
                setFormData({
                    name: '',
                    abbreviation: '',
                    startDate: '',
                    endDate: '',
                    requireRegistrationDeadline: false,
                    registrationDeadline: '',
                    matchFormat: 'BO1',
                    tournamentFormat: 'Ladder',
                    phaseMatchFormats: {
                        default: 'BO1'
                    },
                    maxTeams: 16,
                    fearlessDraft: false,
                    selectedTeams: [],
                    timezone: 'UTC',
                    matchDays: [],
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

    return (
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
                </div>

                <div>
                    <label className="flex items-center space-x-2 mb-4">
                        <input
                            type="checkbox"
                            checked={formData.requireRegistrationDeadline}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                requireRegistrationDeadline: e.target.checked,
                                registrationDeadline: e.target.checked ? formData.registrationDeadline : ''
                            })}
                            className="rounded"
                        />
                        <span>Teams must register by deadline</span>
                    </label>
                    {formData.requireRegistrationDeadline && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Registration Deadline</label>
                            <input
                                type="datetime-local"
                                value={formData.registrationDeadline}
                                onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                                required={formData.requireRegistrationDeadline}
                            />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            onChange={(e) => {
                                const format = e.target.value as TournamentFormat;
                                setFormData({ 
                                    ...formData, 
                                    tournamentFormat: format,
                                    phaseMatchFormats: {
                                        default: formData.matchFormat || 'BO1'
                                    }
                                });
                            }}
                            className="w-full bg-gray-700 rounded px-3 py-2"
                        >
                            <option value="Ladder">Ladder</option>
                            <option value="Swiss into Ladder">Swiss into Ladder</option>
                            <option value="Round Robin into Ladder">Round Robin into Ladder</option>
                            <option value="Groups">Groups</option>
                        </select>
                    </div>
                </div>

                {/* Phase-specific Match Formats for Advanced Tournaments */}
                {(formData.tournamentFormat === 'Swiss into Ladder' || 
                  formData.tournamentFormat === 'Round Robin into Ladder' || 
                  formData.tournamentFormat === 'Groups') && (
                    <div className="border border-gray-600 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-3">Phase-Specific Match Formats</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Round Robin Phase */}
                            {formData.tournamentFormat === 'Round Robin into Ladder' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Round Robin Phase</label>
                                    <select
                                        value={formData.phaseMatchFormats?.roundRobin || 'BO1'}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            phaseMatchFormats: {
                                                ...formData.phaseMatchFormats,
                                                roundRobin: e.target.value as MatchFormat,
                                                default: formData.matchFormat || 'BO1'
                                            }
                                        })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                    >
                                        <option value="BO1">Best of 1</option>
                                        <option value="BO3">Best of 3</option>
                                        <option value="BO5">Best of 5</option>
                                    </select>
                                </div>
                            )}

                            {/* Swiss Phase */}
                            {formData.tournamentFormat === 'Swiss into Ladder' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Swiss Phase</label>
                                    <select
                                        value={formData.phaseMatchFormats?.swiss || 'BO1'}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            phaseMatchFormats: {
                                                ...formData.phaseMatchFormats,
                                                swiss: e.target.value as MatchFormat,
                                                default: formData.matchFormat || 'BO1'
                                            }
                                        })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                    >
                                        <option value="BO1">Best of 1</option>
                                        <option value="BO3">Best of 3</option>
                                        <option value="BO5">Best of 5</option>
                                    </select>
                                </div>
                            )}

                            {/* Groups Phase */}
                            {formData.tournamentFormat === 'Groups' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Group Stage</label>
                                    <select
                                        value={formData.phaseMatchFormats?.groups || 'BO1'}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            phaseMatchFormats: {
                                                ...formData.phaseMatchFormats,
                                                groups: e.target.value as MatchFormat,
                                                default: formData.matchFormat || 'BO1'
                                            }
                                        })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                    >
                                        <option value="BO1">Best of 1</option>
                                        <option value="BO3">Best of 3</option>
                                        <option value="BO5">Best of 5</option>
                                    </select>
                                </div>
                            )}

                            {/* Ladder/Playoff Phase */}
                            {(formData.tournamentFormat === 'Swiss into Ladder' || 
                              formData.tournamentFormat === 'Round Robin into Ladder' ||
                              formData.tournamentFormat === 'Groups') && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {formData.tournamentFormat === 'Groups' ? 'Playoffs' : 'Ladder Phase'}
                                    </label>
                                    <select
                                        value={formData.phaseMatchFormats?.ladder || 'BO3'}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            phaseMatchFormats: {
                                                ...formData.phaseMatchFormats,
                                                ladder: e.target.value as MatchFormat,
                                                default: formData.matchFormat || 'BO1'
                                            }
                                        })}
                                        className="w-full bg-gray-700 rounded px-3 py-2"
                                    >
                                        <option value="BO1">Best of 1</option>
                                        <option value="BO3">Best of 3</option>
                                        <option value="BO5">Best of 5</option>
                                    </select>
                                </div>
                            )}

                            {/* Semifinals */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Semifinals</label>
                                <select
                                    value={formData.phaseMatchFormats?.semifinals || 'BO3'}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        phaseMatchFormats: {
                                            ...formData.phaseMatchFormats,
                                            semifinals: e.target.value as MatchFormat,
                                            default: formData.matchFormat || 'BO1'
                                        }
                                    })}
                                    className="w-full bg-gray-700 rounded px-3 py-2"
                                >
                                    <option value="BO1">Best of 1</option>
                                    <option value="BO3">Best of 3</option>
                                    <option value="BO5">Best of 5</option>
                                </select>
                            </div>

                            {/* Finals */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Finals</label>
                                <select
                                    value={formData.phaseMatchFormats?.finals || 'BO5'}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        phaseMatchFormats: {
                                            ...formData.phaseMatchFormats,
                                            finals: e.target.value as MatchFormat,
                                            default: formData.matchFormat || 'BO1'
                                        }
                                    })}
                                    className="w-full bg-gray-700 rounded px-3 py-2"
                                >
                                    <option value="BO1">Best of 1</option>
                                    <option value="BO3">Best of 3</option>
                                    <option value="BO5">Best of 5</option>
                                </select>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                            Configure different match formats for each tournament phase. This allows for progressive intensity (e.g., BO1 groups → BO3 playoffs → BO5 finals).
                        </p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-2">Tournament Logo</label>
                    
                    {/* Logo Type Selection */}
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="logoType"
                                checked={formData.logo?.type === 'url'}
                                onChange={() => setFormData({ 
                                    ...formData, 
                                    logo: {
                                        type: 'url',
                                        data: '',
                                        size: 0,
                                        format: 'png'
                                    }
                                })}
                                className="rounded"
                            />
                            <span>Image URL</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="logoType"
                                checked={formData.logo?.type === 'upload'}
                                onChange={() => setFormData({ 
                                    ...formData, 
                                    logo: {
                                        type: 'upload',
                                        data: '',
                                        size: 0,
                                        format: 'png'
                                    }
                                })}
                                className="rounded"
                            />
                            <span>Upload File</span>
                        </label>
                    </div>

                    {/* URL Input */}
                    {formData.logo?.type === 'url' && (
                        <div>
                            <input
                                type="url"
                                value={formData.logo?.data || ''}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    logo: {
                                        type: 'url',
                                        data: e.target.value,
                                        size: 0,
                                        format: 'png'
                                    }
                                })}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                                placeholder="https://example.com/logo.png"
                                required
                            />
                            <p className="text-sm text-gray-400 mt-1">URL to your tournament logo image</p>
                        </div>
                    )}

                    {/* File Upload */}
                    {formData.logo?.type === 'upload' && (
                        <div>
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            const result = event.target?.result as string;
                                            setFormData({ 
                                                ...formData, 
                                                logo: {
                                                    type: 'upload',
                                                    data: result,
                                                    size: file.size,
                                                    format: file.type.includes('png') ? 'png' : 
                                                           file.type.includes('webp') ? 'webp' : 'jpg'
                                                }
                                            });
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                                className="w-full bg-gray-700 rounded px-3 py-2"
                                required
                            />
                            <p className="text-sm text-gray-400 mt-1">Upload PNG, JPG, or WebP image (max 5MB)</p>
                        </div>
                    )}

                    {/* Logo Preview */}
                    {formData.logo?.data && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-400 mb-2">Logo Preview:</p>
                            <img 
                                src={formData.logo.data} 
                                alt="Tournament logo preview" 
                                className="w-16 h-16 object-cover rounded border border-gray-600"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                                onLoad={(e) => {
                                    e.currentTarget.style.display = 'block';
                                }}
                            />
                        </div>
                    )}
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
                        onClick={onCancel}
                        className="cursor-pointer bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}