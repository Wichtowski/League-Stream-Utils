'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@lib/contexts/NavigationContext';

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
        id: 'streamControl',
        name: 'Stream Control',
        description: 'Live stream interface for displaying player cameras during matches',
        icon: '📺',
        path: '/modules/cameras/stream',
        color: 'from-red-500 to-rose-500',
        status: 'available'
    },
    {
        id: 'allCameras',
        name: 'All Cameras',
        description: 'View all player cameras simultaneously in a multi-feed grid layout',
        icon: '📱',
        path: '/modules/cameras/all',
        color: 'from-teal-500 to-cyan-500',
        status: 'available'
    },
    {
        id: 'champions',
        name: 'Champions',
        description: 'Browse League of Legends champions with stats and information',
        icon: '⚡',
        path: '/modules/champions',
        color: 'from-indigo-500 to-purple-500',
        status: 'available'
    }
];

export default function ModulesPage() {
    const router = useRouter();
    const { setActiveModule } = useNavigation();
    const [_, setIsAuthenticated] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        setActiveModule('modules');

        // Check authentication
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/auth');
            return;
        }

        setIsAuthenticated(true);
        setAuthChecked(true);
    }, [router, setActiveModule]);

    const handleModuleClick = (module: ModuleCard) => {
        router.push(module.path);
    };

    if (!authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-white">Checking authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Tournament Modules
                    </h1>
                    <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                        Choose from our comprehensive suite of tournament management tools to organize, stream, and manage your League of Legends tournaments.
                    </p>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {modules.map((module) => (
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

                {/* Quick Actions */}
                <div className="mt-16 text-center">
                    <h2 className="text-3xl font-bold text-white mb-8">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <button
                            onClick={() => router.push('/modules/teams')}
                            className="cursor-pointer p-6 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-105"
                        >
                            <div className="text-2xl mb-2">🚀</div>
                            <h3 className="font-semibold text-white mb-2">Start Tournament</h3>
                            <p className="text-gray-400 text-sm">Create teams and begin your tournament</p>
                        </button>

                        <button
                            onClick={() => router.push('/modules/pickban')}
                            className="cursor-pointer p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
                        >
                            <div className="text-2xl mb-2">⚔️</div>
                            <h3 className="font-semibold text-white mb-2">Quick Draft</h3>
                            <p className="text-gray-400 text-sm">Start a champion draft session</p>
                        </button>

                        <button
                            onClick={() => router.push('/modules/cameras/stream')}
                            className="cursor-pointer p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
                        >
                            <div className="text-2xl mb-2">📹</div>
                            <h3 className="font-semibold text-white mb-2">Stream Control</h3>
                            <p className="text-gray-400 text-sm">Manage live stream cameras and player feeds</p>
                        </button>
                    </div>
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
    );
} 