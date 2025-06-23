import Link from 'next/link';
import {
    TrophyIcon,
    UserGroupIcon,
    CameraIcon,
    Cog6ToothIcon,
    ComputerDesktopIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@lib/contexts/AuthContext';

export default function QuickAccessTools() {
    const { user } = useAuth();
    const tools = [
        {
            name: 'Create Tournament',
            href: '/modules/tournaments',
            icon: TrophyIcon,
            description: 'Set up a new tournament'
        },
        {
            name: 'Manage Teams',
            href: '/modules/teams',
            icon: UserGroupIcon,
            description: 'Add and configure teams'
        },
        {
            name: 'Camera Setup',
            href: '/modules/cameras',
            icon: CameraIcon,
            description: 'Configure team cameras'
        },
        {
            name: 'League Client',
            href: '/modules/pickban/leagueclient',
            icon: RocketLaunchIcon,
            description: 'Connect to live League client'
        },

        ...(typeof window !== 'undefined' && (window.electronAPI?.isElectron || user?.isAdmin) ? [{
            name: 'Settings',
            href: '/settings',
            icon: Cog6ToothIcon,
            description: 'Configure Riot API, OBS & more'
        }] : [])
    ];

    // Add desktop-specific tool if in Electron
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
        tools.push({
            name: 'Desktop Features',
            href: '/settings?tab=electron',
            icon: ComputerDesktopIcon,
            description: 'Desktop app features & settings'
        });
    }

    return (
        <div className="bg-gray-800/40 backdrop-blur-md rounded-xl p-6 mb-8 border border-gray-700/50">
            <h2 className="text-xl font-semibold mb-4 text-white">Tournament Management</h2>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${user?.isAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-4'}`}>
                {tools.map((tool) => (
                    <Link
                        key={tool.name}
                        href={tool.href}
                        className="group bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50 hover:border-yellow-500/50 rounded-lg p-4 transition-all duration-300"
                    >
                        <div className="flex items-center gap-3">
                            <div className="text-yellow-400 text-xl">
                                <tool.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white">{tool.name}</h3>
                                <p className="text-gray-400 text-sm">{tool.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
} 
