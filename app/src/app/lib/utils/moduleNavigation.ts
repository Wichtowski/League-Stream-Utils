import type { ReactNode } from 'react';

export type ModuleCategory = 'tournament' | 'prediction' | 'core' | 'integration';

export interface ModuleCard {
    id: string;
    name: string;
    description: string;
    icon: ReactNode | string;
    path: string;
    color: string;
    status: 'available' | 'beta' | 'new';
    category: ModuleCategory;
    adminOnly?: boolean;
}

export const MODULES: ModuleCard[] = [
    {
        id: 'teams',
        name: 'Teams',
        description: 'Create and manage tournament teams with player rosters and information',
        icon: '👥',
        path: '/modules/teams',
        color: 'from-blue-500 to-cyan-500',
        status: 'available',
        category: 'core',
    },
    {
        id: 'tournaments',
        name: 'Tournaments',
        description: 'Create and manage tournaments with brackets, schedules, and settings',
        icon: '🏆',
        path: '/modules/tournaments',
        color: 'from-yellow-500 to-orange-500',
        status: 'available',
        category: 'tournament',
    },
    {
        id: 'adminTournaments',
        name: 'Admin Tournament Manager',
        description: 'Register any team to any tournament with admin privileges and bypass restrictions',
        icon: '🔧',
        path: '/modules/tournaments',
        color: 'from-purple-500 to-pink-500',
        status: 'new',
        category: 'tournament',
        adminOnly: true,
    },
    {
        id: 'pickban',
        name: 'Pick & Ban',
        description: 'Champion draft interface for tournament matches with live updates',
        icon: '⚔️',
        path: '/modules/pickban/static',
        color: 'from-purple-500 to-pink-500',
        status: 'available',
        category: 'core',
    },
    {
        id: 'cameras',
        name: 'Camera Setup',
        description: 'Configure player stream cameras and fallback images for broadcasting',
        icon: '📹',
        path: '/modules/cameras',
        color: 'from-green-500 to-emerald-500',
        status: 'available',
        category: 'core',
    },
    {
        id: 'leagueclient',
        name: 'League Client',
        description: 'Connect to the League of Legends client to get live data',
        icon: '📱',
        path: '/modules/leagueclient',
        color: 'from-teal-500 to-cyan-500',
        status: 'beta',
        category: 'integration',
    },
    {
        id: 'champ-ability',
        name: 'Champions Abilities',
        description: 'Browse League of Legends champions abilities with stats and information',
        icon: '⚡',
        path: '/modules/champ-ability',
        color: 'from-indigo-500 to-purple-500',
        status: 'available',
        category: 'core',
    },
    {
        id: 'predictions',
        name: 'Comentator Predictions',
        description: 'Comentators select a match and make their predictions',
        icon: '🗣️',
        path: '/modules/predictions',
        color: 'from-pink-500 to-yellow-500',
        status: 'new',
        category: 'prediction',
    },
];

export interface ModuleVisibilityParams {
    isElectron: boolean;
    useLocalData: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
}

export function getVisibleModules({ isElectron, useLocalData, isAuthenticated, isAdmin }: ModuleVisibilityParams): ModuleCard[] {
    const isElectronLocal = isElectron && useLocalData;
    const showLeagueClient = isElectron && (isElectronLocal || isAuthenticated);
    const showFullNav = isAuthenticated || isElectronLocal;

    return MODULES.filter((module) => {
        if (module.id === 'leagueclient') {
            return showLeagueClient;
        }
        if (module.id === 'pickban') {
            return showFullNav;
        }
        if (module.id === 'champ-ability') {
            return true;
        }
        if (module.id === 'adminTournaments') {
            return showFullNav && isAdmin;
        }
        // All other modules require full nav
        return showFullNav;
    });
} 