'use client';

import Link from "next/link";
import { getVisibleModules } from '@lib/navigation';
import { useNavigation } from "@lib/contexts/NavigationContext";
import { usePathname } from "next/navigation";
import { useElectron } from "@lib/contexts/ElectronContext";
import { useAuth } from "@lib/contexts/AuthContext";

export function Footer() {
  const { activeModule } = useNavigation();
  const { isElectron, useLocalData } = useElectron();
  const { user } = useAuth();
  const pathname = usePathname();
  const isAuthenticated = !!user;

  // Don't show footer on main/auth pages or when no module active
  if (activeModule === null || pathname === '/') {
    return null;
  }

  const isAdmin = Boolean(user?.isAdmin);
  const visibleModules = getVisibleModules({
    isElectron,
    useLocalData,
    isAuthenticated,
    isAdmin,
  });
  const isElectronRemote = isElectron && !useLocalData;
  const showBasicNav = !isAuthenticated && (isElectronRemote || !isElectron);

  return (
    <footer className="mt-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-gray-800/40 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-gray-700/50">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LSU</span>
              </div>
              <h3 className="text-lg font-bold text-white">Navigation</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {/* Login */}
              {showBasicNav && (
                <Link 
                  href="/auth" 
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'auth'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                    : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                    }`}
                >
                  Login
                </Link>
              )}
              {visibleModules.map((module) => (
                <Link
                  key={module.id}
                  href={module.path}
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === module.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                    : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                  }`}
                  title={module.name}
                >
                  <span className="mr-1">{module.icon}</span>
                  {module.name}
                </Link>
              ))}
              {isElectron && (
                <Link
                  href="/settings"
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'settings'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                    : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                  }`}
                >
                  Settings
                </Link>
              )}
            </div>
            <div className="text-center text-gray-400 text-sm">
              <p>{new Date().getFullYear()} Oskar Wichtowski. Tournament utilities for stream management.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 