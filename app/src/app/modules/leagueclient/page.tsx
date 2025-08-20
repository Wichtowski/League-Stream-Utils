"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { useElectron } from "@/libElectron/contexts/ElectronContext";

export default function LeagueClientPage(): React.ReactElement {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { user: _user, isLoading: _authLoading } = useAuth();
  const { isElectron } = useElectron();

  useEffect(() => {
    setActiveModule("leagueclient");
  }, [setActiveModule]);

  // Redirect to modules if not in Electron
  useEffect(() => {
    if (!isElectron) {
      router.push("/modules");
    }
  }, [isElectron, router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-4">League Client Integration</h1>
          <p className="text-gray-300 text-lg">
            Connect to the League of Legends client for real-time data and overlays
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Champion Select */}
          <div
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 cursor-pointer transition-colors border border-gray-700 hover:border-blue-500"
            onClick={() => router.push("/modules/leagueclient/champselect")}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Champion Select</h3>
              <p className="text-gray-400 mb-4">
                Real-time champion selection overlay with picks, bans, and team composition
              </p>
              <div className="text-sm text-blue-400">Click to open overlay</div>
            </div>
          </div>

          {/* Live Game */}
          <div
            className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 cursor-pointer transition-colors border border-gray-700 hover:border-green-500"
            onClick={() => router.push("/modules/leagueclient/game")}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Game</h3>
              <p className="text-gray-400 mb-4">
                In-game overlay with player stats, objectives, items, and real-time game data
              </p>
              <div className="text-sm text-green-400">Click to open overlay</div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">Champion Select</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Start a League of Legends game</li>
                <li>• Wait for champion select to begin</li>
                <li>• Open the champion select overlay</li>
                <li>• View real-time picks and bans</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">Live Game</h3>
              <ul className="text-gray-300 space-y-1">
                <li>• Join or spectate a League of Legends game</li>
                <li>• Wait for the game to load</li>
                <li>• Open the live game overlay</li>
                <li>• Monitor player stats and objectives</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
