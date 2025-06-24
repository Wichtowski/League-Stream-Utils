'use client';

import { useState, useEffect } from 'react';
import { Cog6ToothIcon, CloudIcon, DocumentDuplicateIcon, ShieldCheckIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useModal } from '@lib/contexts/ModalContext';
import { riotAPI } from '@lib/services/riot-api';
import { refreshChampionsCache } from '@lib/champions';
import tournamentTemplates, { type TournamentTemplate } from '@lib/services/tournament-templates';
import ElectronDataModeSelector from './dataModeSelector';

interface RiotAPISettings {
    apiKey: string;
    defaultRegion: string;
    cacheEnabled: boolean;
    rateLimitEnabled: boolean;
}

interface CacheStats {
    champions: { count: number; lastUpdated: string };
    players: { count: number; memoryUsage: string };
    matches: { count: number; memoryUsage: string };
}

export default function ElectronSettings() {
    const { showAlert } = useModal();
    const [activeTab, setActiveTab] = useState('data-mode');
    const [isElectron, setIsElectron] = useState(false);
    const [loading, setLoading] = useState(false);

    // Riot API settings
    const [riotSettings, setRiotSettings] = useState<RiotAPISettings>({
        apiKey: '',
        defaultRegion: 'euw1',
        cacheEnabled: true,
        rateLimitEnabled: true
    });

    // State management
    const [cacheStats, setCacheStats] = useState<CacheStats>({
        champions: { count: 0, lastUpdated: 'Never' },
        players: { count: 0, memoryUsage: '0 MB' },
        matches: { count: 0, memoryUsage: '0 MB' }
    });

    const [templates, setTemplates] = useState<TournamentTemplate[]>([]);
    const [championsVersion, setChampionsVersion] = useState('');

    useEffect(() => {
        setIsElectron(typeof window !== 'undefined' && !!window.electronAPI?.isElectron);

        // Set up Electron event listeners
        if (window.electronAPI) {
            window.electronAPI.onUpdateChampions(() => {
                handleUpdateChampions();
            });

            window.electronAPI.onChampionsCacheCleared(() => {
                setCacheStats(prev => ({
                    ...prev,
                    champions: { count: 0, lastUpdated: 'Never' }
                }));
            });
        }

        // Load initial data
        loadCacheStats();
        loadTemplates();

        return () => {
            // Cleanup
            if (window.electronAPI) {
                window.electronAPI.removeAllListeners('update-champions');
                window.electronAPI.removeAllListeners('champions-cache-cleared');
            }
        };
    }, []);

    const loadCacheStats = async () => {
        try {
            const stats = riotAPI.getCacheStats();
            const version = await riotAPI.getLatestGameVersion();

            setCacheStats({
                champions: {
                    count: stats.keys,
                    lastUpdated: new Date().toLocaleString()
                },
                players: {
                    count: stats.hits,
                    memoryUsage: `${Math.round(stats.keys * 0.1)} MB`
                },
                matches: {
                    count: stats.misses,
                    memoryUsage: `${Math.round(stats.keys * 0.05)} MB`
                }
            });
            setChampionsVersion(version);
        } catch (error) {
            console.error('Failed to load cache stats:', error);
        }
    };

    const loadTemplates = async () => {
        try {
            const templateList = await tournamentTemplates.getAllTemplates();
            setTemplates(templateList);
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    };

    const handleUpdateChampions = async () => {
        setLoading(true);
        try {
            await refreshChampionsCache();
            await loadCacheStats();
            await showAlert({ type: 'success', message: 'Champions database updated successfully!' });
        } catch (error) {
            console.error('Failed to update champions:', error);
            await showAlert({ type: 'error', message: 'Failed to update champions database. Please check your API key and internet connection.' });
        } finally {
            setLoading(false);
        }
    };

    const handleClearCache = async () => {
        riotAPI.clearCache();
        setCacheStats({
            champions: { count: 0, lastUpdated: 'Never' },
            players: { count: 0, memoryUsage: '0 MB' },
            matches: { count: 0, memoryUsage: '0 MB' }
        });
        await showAlert({ type: 'success', message: 'Cache cleared successfully!' });
    };

    const handleExportTemplate = async (templateId: string): Promise<void> => {
        try {
            const blob = await tournamentTemplates.exportTemplate(templateId);
            if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tournament-template-${templateId}.json`;
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Failed to export template:', error);
            await showAlert({ type: 'error', message: 'Failed to export template.' });
        }
    };

    const tabs = [
        { id: 'data-mode', name: 'Data Storage', icon: ComputerDesktopIcon },
        { id: 'riot-api', name: 'Riot API', icon: ShieldCheckIcon },
        { id: 'templates', name: 'Tournament Templates', icon: DocumentDuplicateIcon },
        { id: 'cache', name: 'Cache Management', icon: CloudIcon }
    ];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Cog6ToothIcon className="w-8 h-8 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Tournament Management Settings</h1>
                    {isElectron && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Desktop App
                        </span>
                    )}
                </div>
                <p className="text-gray-600">
                    Configure Riot API integration, tournament templates for professional esports production.
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Data Storage Mode */}
            {activeTab === 'data-mode' && (
                <div className="space-y-6">
                    <ElectronDataModeSelector />
                </div>
            )}

            {/* Riot API Settings */}
            {activeTab === 'riot-api' && (
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Riot API Configuration</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    value={riotSettings.apiKey}
                                    onChange={(e) => setRiotSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Get your API key from{' '}
                                    <a href="https://developer.riotgames.com" target="_blank" rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline">
                                        Riot Developer Portal
                                    </a>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Default Region
                                </label>
                                <select
                                    value={riotSettings.defaultRegion}
                                    onChange={(e) => setRiotSettings(prev => ({ ...prev, defaultRegion: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="euw1">Europe West</option>
                                    <option value="na1">North America</option>
                                    <option value="eun1">Europe Nordic & East</option>
                                    <option value="kr">Korea</option>
                                    <option value="jp1">Japan</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={riotSettings.cacheEnabled}
                                    onChange={(e) => setRiotSettings(prev => ({ ...prev, cacheEnabled: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                    Enable caching (recommended for better performance)
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={riotSettings.rateLimitEnabled}
                                    onChange={(e) => setRiotSettings(prev => ({ ...prev, rateLimitEnabled: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-900">
                                    Enable automatic rate limiting
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleUpdateChampions}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Update Champions Database'}
                            </button>

                            <button
                                onClick={handleClearCache}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Clear Cache
                            </button>
                        </div>

                        {championsVersion && (
                            <div className="mt-4 p-3 bg-green-50 rounded-md">
                                <p className="text-sm text-green-800">
                                    <strong>Current Game Version:</strong> {championsVersion}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tournament Templates */}
            {activeTab === 'templates' && (
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-medium text-gray-900">Tournament Templates</h3>
                            <button
                                onClick={loadTemplates}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((template) => (
                                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h4>
                                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>

                                    <div className="space-y-2 text-xs text-gray-500">
                                        <div>Format: {template.format}</div>
                                        <div>Max Teams: {template.maxTeams}</div>
                                        <div>Fearless Draft: {template.fearlessDraft ? 'Yes' : 'No'}</div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => handleExportTemplate(template.id)}
                                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                                        >
                                            Export
                                        </button>
                                        <button className="text-green-600 hover:text-green-800 text-xs font-medium">
                                            Use Template
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Cache Management */}
            {activeTab === 'cache' && (
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-6">Cache Statistics</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-900 mb-2">Champions Cache</h4>
                                <p className="text-2xl font-bold text-blue-600">{cacheStats.champions.count}</p>
                                <p className="text-xs text-blue-700">Last updated: {cacheStats.champions.lastUpdated}</p>
                            </div>

                            <div className="bg-green-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-green-900 mb-2">Player Cache</h4>
                                <p className="text-2xl font-bold text-green-600">{cacheStats.players.count}</p>
                                <p className="text-xs text-green-700">Memory: {cacheStats.players.memoryUsage}</p>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg">
                                <h4 className="text-sm font-medium text-purple-900 mb-2">Match Cache</h4>
                                <p className="text-2xl font-bold text-purple-600">{cacheStats.matches.count}</p>
                                <p className="text-xs text-purple-700">Memory: {cacheStats.matches.memoryUsage}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={loadCacheStats}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Refresh Stats
                            </button>

                            <button
                                onClick={handleClearCache}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                                Clear All Cache
                            </button>
                        </div>

                        {isElectron && (
                            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Desktop Features</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• Persistent local champion database</li>
                                    <li>• Local tournament template storage</li>
                                    <li>• Asset file management</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
} 