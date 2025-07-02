'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { AuthGuard } from '@lib/components/AuthGuard';
import { useUser } from '@lib/contexts/AuthContext';
import { useElectron } from '@lib/contexts/ElectronContext';
import { useDownload } from '@lib/contexts/DownloadContext';
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
    }
];

export default function ModulesPage() {
    const router = useRouter();
    const { setActiveModule } = useNavigation();
    const user = useUser();
    const { isElectron, useLocalData } = useElectron();
    const { downloadState } = useDownload();

    useEffect(() => {
        setActiveModule('modules');
    }, [setActiveModule]);

    // Block access if downloads are in progress in Electron
    if (isElectron && downloadState.isDownloading) {
        const getAssetTypeLabel = (assetType?: string) => {
            switch (assetType) {
                case 'champion-data': return 'Champion Data';
                case 'champion-images': return 'Champion Images';
                case 'ability-images': return 'Ability Images';
                case 'item-data': return 'Item Data';
                case 'item-images': return 'Item Images';
                case 'spell-data': return 'Summoner Spell Data';
                case 'spell-images': return 'Summoner Spell Images';
                case 'rune-data': return 'Rune Data';
                case 'rune-images': return 'Rune Images';
                default: return 'Assets';
            }
        };

        const getAssetIcon = (assetType?: string) => {
            switch (assetType) {
                case 'champion-data':
                case 'champion-images':
                case 'ability-images':
                    return '⚔️';
                case 'item-data':
                case 'item-images':
                    return '🛡️';
                case 'spell-data':
                case 'spell-images':
                    return '✨';
                case 'rune-data':
                case 'rune-images':
                    return '🔮';
                default:
                    return '📦';
            }
        };

        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900">
                <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 max-w-lg w-full mx-4 text-center">
                    <div className="mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-600/20 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Downloading Assets</h2>
                        <p className="text-gray-400">
                            Please wait while we download game assets...
                        </p>
                    </div>
                    
                    {downloadState.progress && (
                        <div className="space-y-4">
                            {/* Asset Type */}
                            {downloadState.progress.assetType && (
                                <div className="flex items-center justify-center space-x-2 text-sm text-blue-300">
                                    <span className="text-lg">{getAssetIcon(downloadState.progress.assetType)}</span>
                                    <span>{getAssetTypeLabel(downloadState.progress.assetType)}</span>
                                </div>
                            )}

                            {/* Current Asset */}
                            {downloadState.progress.currentAsset && (
                                <div className="bg-gray-700/50 rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-1">Currently Downloading</div>
                                    <div className="text-sm font-semibold text-white">
                                        {downloadState.progress.currentAsset}
                                    </div>
                                </div>
                            )}

                            {/* Progress Message */}
                            <div className="text-sm text-gray-300">
                                {downloadState.progress.message}
                            </div>
                            
                            {/* Progress Bar */}
                            {downloadState.progress.progress && downloadState.progress.total && (
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>Progress</span>
                                        <span>{downloadState.progress.progress} / {downloadState.progress.total}</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ 
                                                width: `${Math.round((downloadState.progress.progress / downloadState.progress.total) * 100)}%` 
                                            }}
                                        ></div>
                                    </div>
                                    <div className="text-center text-xs text-gray-400 mt-1">
                                        {Math.round((downloadState.progress.progress / downloadState.progress.total) * 100)}% Complete
                                    </div>
                                </div>
                            )}

                            {/* Stage Indicator */}
                            <div className="flex justify-center">
                                <div className="inline-flex items-center space-x-2 bg-gray-700/50 rounded-full px-3 py-1">
                                    <div className={`w-2 h-2 rounded-full ${
                                        downloadState.progress.stage === 'checking' ? 'bg-yellow-400' :
                                        downloadState.progress.stage === 'downloading' ? 'bg-blue-400' :
                                        downloadState.progress.stage === 'complete' ? 'bg-green-400' :
                                        'bg-red-400'
                                    }`}></div>
                                    <span className="text-xs text-gray-300 capitalize">
                                        {downloadState.progress.stage}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Filter modules based on admin status
    const availableModules = modules.filter(module => {
        if (module.id === 'adminTournaments') {
            return user?.isAdmin;
        }
        return true;
    });

    const handleModuleClick = (module: ModuleCard) => {
        router.push(module.path);
    };

    return (
        <AuthGuard>
            <div className="min-h-screen p-8">
                <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 relative">
                    {isElectron && (
                        <div className="absolute top-0 right-0 flex items-center space-x-4">
                            <div className="text-right">
                                <div className="text-sm text-gray-400">
                                    Mode: <span className={useLocalData ? 'text-green-400' : 'text-blue-400'}>
                                        {useLocalData ? 'Local Data' : 'Online'}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {useLocalData ? 'Saving to AppData' : 'Using cloud storage'}
                                </div>
                            </div>
                            <button
                                onClick={() => router.push('/settings')}
                                className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-colors"
                                title="Electron Settings"
                            >
                                <Cog6ToothIcon className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                            </button>
                        </div>
                    )}
                    <h1 className="text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Tournament Modules
                    </h1>
                    <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                        Choose from our comprehensive suite of tournament management tools to organize, stream, and manage your League of Legends tournaments.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {availableModules.map((module) => (
                        <div
                            key={module.id}
                            onClick={() => handleModuleClick(module)}
                            className="cursor-pointer group bg-gray-800/40 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                        >
                            {/* Status Badge */}
                            {module.status !== 'available' && (
                                <div className="flex justify-end mb-2">
                                    <span className={`
                    px-2 py-1 text-xs font-semibold rounded-full
                    ${module.status === 'new' ? 'bg-green-500/20 text-green-400' : ''}
                    ${module.status === 'beta' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                  `}>
                                        {module.status.toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {/* Module Icon */}
                            <div className={`
                w-20 h-20 rounded-2xl bg-gradient-to-br ${module.color} 
                flex items-center justify-center mb-6 mx-auto
                group-hover:scale-110 transition-transform duration-300
              `}>
                                <span className="text-3xl">{module.icon}</span>
                            </div>

                            {/* Module Info */}
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                                    {module.name}
                                </h3>
                                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                                    {module.description}
                                </p>
                            </div>

                            {/* Hover Arrow */}
                            <div className="flex justify-center mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <span className="text-white">→</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Footer Info */}
                <div className="mt-16 text-center">
                    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white mb-2">League of Legends Tournament Manager</h3>
                        <p className="text-gray-400">
                            Professional tournament management platform for League of Legends esports events.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </AuthGuard>
    );
} 