'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import type { GameConfig } from '@lib/types';

export default function ConfigPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [config, setConfig] = useState<GameConfig>({
        seriesType: 'BO1',
        currentGame: 1,
        totalGames: 1,
        isFearlessDraft: false,
        patchName: '14.24',
        blueTeamName: 'Blue Team',
        redTeamName: 'Red Team',
        tournamentName: '',
        tournamentLogo: '',
        blueTeamLogo: '',
        redTeamLogo: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/auth');
            return;
        }
    }, [router]);

    const loadConfig = useCallback(async () => {
        try {
            const response = await fetch(`/api/v1/pickban/sessions/${sessionId}/config`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.config) {
                    setConfig(data.config);
                }
            } else if (response.status === 401) {
                router.push('/auth');
            }
        } catch (err) {
            console.error('Failed to load config:', err);
        }
    }, [sessionId, router]);

    const saveConfig = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch(`/api/v1/pickban/sessions/${sessionId}/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ config })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/auth');
                    return;
                }
                throw new Error('Failed to save configuration');
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Failed to save configuration');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const startMatch = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/v1/pickban/sessions/${sessionId}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/auth');
                    return;
                }
                throw new Error('Failed to start match');
            }

            // Redirect to the game page
            router.push(`/pickban/game/${sessionId}`);
        } catch (err) {
            setError('Failed to start match');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-red-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Match Configuration
                    </h1>
                </div>

                <div className="text-center mb-8">
                    <div className="inline-block bg-gray-800/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700">
                        <span className="text-gray-300">Session ID:</span>
                        <span className="ml-2 font-mono text-blue-400">{sessionId}</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-600/90 text-white p-4 rounded-lg mb-6 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-600/90 text-white p-4 rounded-lg mb-6 backdrop-blur-sm">
                        Configuration saved successfully!
                    </div>
                )}

                <div className="grid gap-8">
                    {/* Tournament Information */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-6 text-purple-300">Event Information</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Event Name</label>
                                <input
                                    type="text"
                                    value={config.tournamentName || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, tournamentName: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500"
                                    placeholder="e.g., Spring Split Finals"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Event Logo URL (Optional)</label>
                                <input
                                    type="url"
                                    value={config.tournamentLogo || ''}
                                    onChange={(e) => setConfig(prev => ({ ...prev, tournamentLogo: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-purple-500"
                                    placeholder="https://example.com/event-logo.png"
                                />
                            </div>
                        </div>

                        {config.tournamentLogo && (
                            <div className="mt-4 text-center">
                                <div className="inline-block bg-gray-700 rounded-lg p-4">
                                    <Image
                                        src={config.tournamentLogo}
                                        alt="Event Logo Preview"
                                        width={128}
                                        height={64}
                                        className="max-h-16 max-w-32 object-contain"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Game Settings */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                        <h2 className="text-2xl font-semibold mb-6 text-blue-300">Game Settings</h2>

                        <div className={`grid gap-6 ${config.seriesType === 'BO1' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                            <div>
                                <label className="block text-sm font-medium mb-2">Series Type</label>
                                <select
                                    value={config.seriesType}
                                    onChange={(e) => {
                                        const newSeriesType = e.target.value as 'BO1' | 'BO3' | 'BO5';
                                        setConfig(prev => ({
                                            ...prev,
                                            seriesType: newSeriesType,
                                            isFearlessDraft: newSeriesType === 'BO1' ? false : prev.isFearlessDraft
                                        }));
                                    }}
                                    className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500"
                                >
                                    <option value="BO1">Best of 1</option>
                                    <option value="BO3">Best of 3</option>
                                    <option value="BO5">Best of 5</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Patch Version</label>
                                <input
                                    type="text"
                                    value={config.patchName}
                                    onChange={(e) => setConfig(prev => ({ ...prev, patchName: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500"
                                    placeholder="e.g., 14.24"
                                />
                            </div>

                            {config.seriesType !== 'BO1' && (
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        id="fearlessDraft"
                                        checked={config.isFearlessDraft}
                                        onChange={(e) => setConfig(prev => ({ ...prev, isFearlessDraft: e.target.checked }))}
                                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="fearlessDraft" className="text-sm font-medium">
                                        Fearless Draft
                                        <div className="text-xs text-gray-400 mt-1">
                                            Champions can only be picked once per series
                                        </div>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Team Configuration */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Blue Team */}
                        <div className="bg-blue-900/30 backdrop-blur-sm rounded-lg p-6 border border-blue-700/50">
                            <h3 className="text-xl font-semibold mb-4 text-blue-300">Blue Team</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Team Name</label>
                                    <input
                                        type="text"
                                        value={config.blueTeamName || ''}
                                        onChange={(e) => setConfig(prev => ({ ...prev, blueTeamName: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500"
                                        placeholder="Blue Team"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Team Logo URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={config.blueTeamLogo || ''}
                                        onChange={(e) => setConfig(prev => ({ ...prev, blueTeamLogo: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-blue-500"
                                        placeholder="https://example.com/blue-logo.png"
                                    />
                                </div>

                                {config.blueTeamLogo && (
                                    <div className="text-center">
                                        <div className="inline-block bg-gray-700 rounded-lg p-2">
                                            <Image
                                                src={config.blueTeamLogo}
                                                alt="Blue Team Logo"
                                                width={64}
                                                height={64}
                                                className="max-h-16 max-w-16 object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Red Team */}
                        <div className="bg-red-900/30 backdrop-blur-sm rounded-lg p-6 border border-red-700/50">
                            <h3 className="text-xl font-semibold mb-4 text-red-300">Red Team</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Team Name</label>
                                    <input
                                        type="text"
                                        value={config.redTeamName || ''}
                                        onChange={(e) => setConfig(prev => ({ ...prev, redTeamName: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-red-500"
                                        placeholder="Red Team"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Team Logo URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={config.redTeamLogo || ''}
                                        onChange={(e) => setConfig(prev => ({ ...prev, redTeamLogo: e.target.value }))}
                                        className="w-full px-3 py-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-red-500"
                                        placeholder="https://example.com/red-logo.png"
                                    />
                                </div>

                                {config.redTeamLogo && (
                                    <div className="text-center">
                                        <div className="inline-block bg-gray-700 rounded-lg p-2">
                                            <Image
                                                src={config.redTeamLogo}
                                                alt="Red Team Logo"
                                                width={64}
                                                height={64}
                                                className="max-h-16 max-w-16 object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={saveConfig}
                            disabled={loading}
                            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                        >
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>

                        <button
                            onClick={startMatch}
                            disabled={loading}
                            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                        >
                            {loading ? 'Starting...' : 'Start Match'}
                        </button>

                        <button
                            onClick={() => router.push('/pickban')}
                            className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Back to Sessions
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 