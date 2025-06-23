'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { usePathname } from "next/navigation";
import { useElectron } from "@/app/lib/contexts/ElectronContext";

export default function Footer() {
  const { activeModule } = useNavigation();
  const { isElectron, useLocalData } = useElectron();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    setIsAuthenticated(!!(token && userData));
  }, []);

  // Don't show footer on the main page
  if (pathname === '/' || pathname === '/auth') {
    return null;
  }

  // Navigation logic
  // - If unauthenticated OR (electron and not using local data): Login + Champions
  // - If authenticated OR (electron with local data): All modules
  // - Electron always shows settings
  const showBasicNav = !isAuthenticated && (!isElectron || !useLocalData);
  const showFullNav = isAuthenticated || (isElectron && useLocalData);

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
              {/* Login - Show if unauthenticated OR (electron and not using local data) */}
              {showBasicNav && (
                <Link href="/auth" className="px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20">
                  Login
                </Link>
              )}
              
              {/* Champions - Always show except when fully authenticated without electron */}
              {(showBasicNav || showFullNav) && (
                <Link
                  href="/modules/champions"
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'champions'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                    : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                    }`}
                >
                  Champions
                </Link>
              )}

              {/* Full navigation - Show if authenticated OR (electron with local data) */}
              {showFullNav && (
                <>
                  <Link
                    href="/modules/pickban"
                    className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${activeModule === 'pickban' || activeModule === 'home'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                      : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                      }`}
                  >
                    Pick & Ban
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

              {/* Settings - Always show for electron, or for web users */}
              {(isElectron || !showBasicNav) && (
                <Link
                  href="/settings"
                  className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg ${pathname === '/settings'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-purple-500/20'
                    : 'bg-gray-700 hover:bg-gray-600 hover:shadow-blue-500/20'
                    }`}
                >
                  Settings
                </Link>
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