'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { AuthGuard } from '@lib/components/AuthGuard';
import { useUser } from '@lib/contexts/AuthContext';
import { useElectron } from '@lib/contexts/ElectronContext';
import { useHighPerformanceDownload } from '@lib/contexts/HighPerformanceDownloadContext';
import { AssetDownloadProgress } from '@components/common';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

interface ModuleCard {
    id: string;
    name: string;
    description: string;
    icon: string;
    path: string;
    color: string;
    status: 'available' | 'beta' | 'new';
}

const modules: ModuleCard[] = [
    {
        id: 'teams',
        name: 'Teams',
        description: 'Create and manage tournament teams with player rosters and information',
        icon: '👥',
        path: '/modules/teams',
        color: 'from-blue-500 to-cyan-500',
        status: 'available'
    },
    {
        id: 'tournaments',
        name: 'Tournaments',
        description: 'Create and manage tournaments with brackets, schedules, and settings',
        icon: '🏆',
        path: '/modules/tournaments',
        color: 'from-yellow-500 to-orange-500',
        status: 'available'
    },
    {
        id: 'pickban',
        name: 'Pick & Ban',
        description: 'Champion draft interface for tournament matches with live updates',
        icon: '⚔️',
        path: '/modules/pickban',
        color: 'from-purple-500 to-pink-500',
        status: 'available'
    },
    {
        id: 'cameras',
        name: 'Camera Setup',
        description: 'Configure player stream cameras and fallback images for broadcasting',
        icon: '📹',
        path: '/modules/cameras',
        color: 'from-green-500 to-emerald-500',
        status: 'available'
    },
    {
        id: 'leagueclient',
        name: 'League Client',
        description: 'Connect to the League of Legends client to get live data',
        icon: '📱',
        path: '/modules/pickban/leagueclient',
        color: 'from-teal-500 to-cyan-500',
        status: 'beta'
    },
    {
        id: 'champ-ability',
        name: 'Champions Abilities',
        description: 'Browse League of Legends champions abilities with stats and information',
        icon: '⚡',
        path: '/modules/champ-ability',
        color: 'from-indigo-500 to-purple-500',
        status: 'available'
    },
    {
        id: 'adminTournaments',
        name: 'Admin Tournament Manager',
        description: 'Register any team to any tournament with admin privileges and bypass restrictions',
        icon: '🔧',
        path: '/modules/tournaments',
        color: 'from-purple-500 to-pink-500',
        status: 'new'
    },
    {
        id: 'predictions',
        name: 'Comentator Predictions',
        description: 'Comentators select a match and make their predictions',
        icon: '🗣️',
        path: '/modules/predictions',
        color: 'from-pink-500 to-yellow-500',
        status: 'new'
    }
];

export default function ModulesPage() {
    const router = useRouter();
    const { setActiveModule } = useNavigation();
    const user = useUser();
    const { isElectron, useLocalData } = useElectron();
    const { downloadState: highPerfDownloadState, cancelDownload } = useHighPerformanceDownload();

    useEffect(() => {
        setActiveModule('modules');
    }, [setActiveModule]);

    // Block access if downloads are in progress in Electron
    if (isElectron && highPerfDownloadState.isDownloading && highPerfDownloadState.progress) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <AssetDownloadProgress
                    progress={highPerfDownloadState.progress}
                    onCancel={cancelDownload}
                />
            </div>
        );
    }

    const handleModuleClick = (module: ModuleCard) => {
        router.push(module.path);
    };

    return (
        <AuthGuard loadingMessage="Loading modules...">
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className={`flex ${isElectron ? 'justify-between' : 'justify-center'} items-center mb-6`}>
                        {isElectron && (
                            <div></div>
                        )}
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">Modules</h1>
                                <p className="text-gray-400">
                                    Welcome back, {user?.username || 'User'}! Choose a module to get started.
                                </p>
                            </div>
                            {isElectron && (
                                <div className="flex items-center space-x-2">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-400">
                                            Mode: <span className={useLocalData ? 'text-green-400' : 'text-blue-400'}>
                                                {useLocalData ? 'Local Data' : 'Online'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                    onClick={() => router.push('/settings')}
                                        className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-colors"
                                        title="Settings"
                                    >
                                        <Cog6ToothIcon className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Module Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modules.map((module) => (
                            <div
                                key={module.id}
                                onClick={() => handleModuleClick(module)}
                                className="group cursor-pointer bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${module.color} rounded-lg flex items-center justify-center text-2xl`}>
                                        {module.icon}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {module.status === 'beta' && (
                                            <span className="bg-yellow-600 text-yellow-100 px-2 py-1 rounded text-xs font-semibold">
                                                BETA
                                            </span>
                                        )}
                                        {module.status === 'new' && (
                                            <span className="bg-green-600 text-green-100 px-2 py-1 rounded text-xs font-semibold">
                                                NEW
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                    {module.name}
                                </h3>
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    {module.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
} 