'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { AuthGuard } from '@lib/components/AuthGuard';
import { useUser } from '@lib/contexts/AuthContext';
import { useElectron } from '@lib/contexts/ElectronContext';
import { useHighPerformanceDownload } from '@lib/contexts/HighPerformanceDownloadContext';
import { LoadingSpinner, AssetDownloadProgress } from '@components/common';
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

// Dynamic imports for module components
const TeamsPage = dynamic(
  () => import('./teams/page'),
  { 
    loading: () => <LoadingSpinner text="Loading teams..." />,
    ssr: false 
  }
);

const TournamentsPage = dynamic(
  () => import('./tournaments/page'),
  { 
    loading: () => <LoadingSpinner text="Loading tournaments..." />,
    ssr: false 
  }
);

const PickbanPage = dynamic(
  () => import('./pickban/page'),
  { 
    loading: () => <LoadingSpinner text="Loading pick & ban..." />,
    ssr: false 
  }
);

const CamerasPage = dynamic(
  () => import('./cameras/page'),
  { 
    loading: () => <LoadingSpinner text="Loading cameras..." />,
    ssr: false 
  }
);

const ChampAbilityPage = dynamic(
  () => import('./champ-ability/page'),
  { 
    loading: () => <LoadingSpinner text="Loading champion abilities..." />,
    ssr: false 
  }
);

export default function ModulesPage() {
    const router = useRouter();
    const { setActiveModule } = useNavigation();
    const user = useUser();
    const { isElectron, useLocalData } = useElectron();
    const { downloadState: highPerfDownloadState, cancelDownload } = useHighPerformanceDownload();
    const [activeModule, setActiveModuleState] = useState<string | null>(null);

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
        setActiveModuleState(module.id);
    };

    // Render dynamic components based on active module
    if (activeModule === 'teams') {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => setActiveModuleState(null)}
                            className="mr-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            ← Back to Modules
                        </button>
                        <h1 className="text-2xl font-bold text-white">Teams</h1>
                    </div>
                    <Suspense fallback={<LoadingSpinner text="Loading teams..." />}>
                        <TeamsPage />
                    </Suspense>
                </div>
            </div>
        );
    }

    if (activeModule === 'tournaments') {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => setActiveModuleState(null)}
                            className="mr-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            ← Back to Modules
                        </button>
                        <h1 className="text-2xl font-bold text-white">Tournaments</h1>
                    </div>
                    <Suspense fallback={<LoadingSpinner text="Loading tournaments..." />}>
                        <TournamentsPage />
                    </Suspense>
                </div>
            </div>
        );
    }

    if (activeModule === 'pickban') {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => setActiveModuleState(null)}
                            className="mr-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            ← Back to Modules
                        </button>
                        <h1 className="text-2xl font-bold text-white">Pick & Ban</h1>
                    </div>
                    <Suspense fallback={<LoadingSpinner text="Loading pick & ban..." />}>
                        <PickbanPage />
                    </Suspense>
                </div>
            </div>
        );
    }

    if (activeModule === 'cameras') {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => setActiveModuleState(null)}
                            className="mr-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            ← Back to Modules
                        </button>
                        <h1 className="text-2xl font-bold text-white">Cameras</h1>
                    </div>
                    <Suspense fallback={<LoadingSpinner text="Loading cameras..." />}>
                        <CamerasPage />
                    </Suspense>
                </div>
            </div>
        );
    }

    if (activeModule === 'champ-ability') {
        return (
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center mb-6">
                        <button
                            onClick={() => setActiveModuleState(null)}
                            className="mr-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            ← Back to Modules
                        </button>
                        <h1 className="text-2xl font-bold text-white">Champion Abilities</h1>
                    </div>
                    <Suspense fallback={<LoadingSpinner text="Loading champion abilities..." />}>
                        <ChampAbilityPage />
                    </Suspense>
                </div>
            </div>
        );
    }

    return (
        <AuthGuard loadingMessage="Loading modules...">
            <div className="min-h-screen p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="flex justify-between items-center mb-6">
                            <div></div>
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">Modules</h1>
                                <p className="text-gray-400">
                                    Welcome back, {user?.username || 'User'}! Choose a module to get started.
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                {isElectron && (
                                    <div className="text-right">
                                        <div className="text-sm text-gray-400">
                                            Mode: <span className={useLocalData ? 'text-green-400' : 'text-blue-400'}>
                                                {useLocalData ? 'Local Data' : 'Online'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => router.push('/settings')}
                                    className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-colors"
                                    title="Settings"
                                >
                                    <Cog6ToothIcon className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                                </button>
                            </div>
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