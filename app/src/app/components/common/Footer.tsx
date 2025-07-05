'use client';

import Link from "next/link";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { usePathname } from "next/navigation";
import { useElectron } from "@/app/lib/contexts/ElectronContext";
import { useAuth } from "@/app/lib/contexts/AuthContext";

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

  // Navigation display rules
  // 1. Electron (local data): show everything except Login
  // 2. Electron (remote data) unauthenticated: Login, Champions, Settings
  // 3. Electron (remote data) authenticated: show everything
  // 4. Web app unauthenticated: Login, Champions
  // 5. Web app authenticated: All (except League Client, Login, Settings)

  // Evaluate environment helpers
  const isElectronLocal = isElectron && useLocalData;
  const isElectronRemote = isElectron && !useLocalData;

  // League Client link visibility
  const showLeagueClient = isElectron && (isElectronLocal || isAuthenticated);

  // Basic navigation (Login button visibility)
  const showBasicNav = !isAuthenticated && (isElectronRemote || !isElectron);

  // Full navigation (Modules, Pick & Ban, Cameras, etc.)
  const showFullNav = isAuthenticated || isElectronLocal; // Web authenticated or Electron local

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
              
              {/* Champions link is always visible. Modules link requires full nav. */}

              {/* Champions */}
              <Link
                href="/modules/champ-ability"
                className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'champ-ability'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                  : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                  }`}
              >
                Champions
              </Link>

              {/* Modules - only when full navigation is allowed */}
              {showFullNav && (
                  <Link
                    href="/modules"
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'modules'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                      : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                      }`}
                  >
                    Modules
                  </Link>
              )}

              {/* Full navigation */}
              {showFullNav && (
                <>
                  <Link
                    href="/modules/pickban/static"
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'pickban/static'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                      : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                      }`}
                  >
                    {isElectron ? 'Static Pick & Ban' : 'Pick & Ban'}
                  </Link>
                  <Link
                    href="/modules/cameras"
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'cameras'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                      : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                      }`}
                  >
                    Camera Setup
                  </Link>
                  <Link
                    href="/modules/teams"
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'teams'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                      : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                      }`}
                  >
                    Teams
                  </Link>
                  <Link
                    href="/modules/tournaments"
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'tournaments'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                      : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                      }`}
                  >
                    Tournaments
                  </Link>
                </>
              )}

              {/* Electron-specific links */}
              {isElectron && (
                <>
                  {showLeagueClient && (
                  <Link
                    href="/modules/leagueclient"
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'leagueclient'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                      : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                      }`}
                  >
                    League Client
                  </Link>
                  )}
                  <Link
                    href="/settings"
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'settings'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                      : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                      }`}
                  >
                    Settings
                  </Link>
                </>
              )}

            </div>
            <div className="text-center text-gray-400 text-sm">
              <p>2025 Oskar Wichtowski. Tournament utilities for stream management.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 