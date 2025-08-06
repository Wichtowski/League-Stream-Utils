"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useElectron } from "@lib/contexts/ElectronContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { PageLoader } from "@lib/components/common";
import { LCUStatusIndicator } from "@lib/components/LCU";

export default function PickBanPage(): React.ReactElement {
  const router = useRouter();
  const { isElectron } = useElectron();
  const { setActiveModule } = useNavigation();
  const { user: authUser, isLoading: authLoading } = useAuth();

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

  useEffect(() => {
    if (!authLoading && authUser) {
      // Only redirect Electron users automatically
      if (isElectron) {
        // In Electron app, redirect to League Client integration
        router.replace("/modules/pickban/leagueclient");
      }
      // Web users will see the hub page and choose their path
    }
  }, [authLoading, authUser, isElectron, router]);

  if (authLoading) {
    return <PageLoader text="Checking authentication..." />;
  }

  if (!authUser) {
    // Redirect to auth if not authenticated
    router.replace("/auth");
    return <PageLoader text="Redirecting to authentication..." />;
  }

  // For Electron users, show the initialization screen
  if (isElectron) {
    return (
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="max-w-md text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h1 className="text-2xl font-bold mb-2">Initializing Pick & Ban</h1>
                <p className="text-gray-400">
                  Detecting your environment and redirecting you to the appropriate
                  interface...
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4 text-left">
                  <h3 className="font-semibold mb-2">Available Modes:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="text-green-400">
                        League Client Integration (Desktop App)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span className="text-gray-400">
                        Static Pick & Ban (Web Browser)
                      </span>
                    </div>
                  </div>
                </div>

                <LCUStatusIndicator showDetails={true} />
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <p>You will be automatically redirected in a moment...</p>
                <div className="flex gap-4 mt-3">
                  <button
                    onClick={() => router.push("/modules/pickban/static")}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Force Static Mode
                  </button>
                  <button
                    onClick={() => router.push("/modules/pickban/leagueclient")}
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Force LCU Mode
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For web users, show the hub
  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-400 mb-4">
            Pick & Ban Hub
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose your Pick & Ban experience. Create sessions for tournaments, practice, or demonstrations.
          </p>
        </div>

        {/* Hub Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Static Pick & Ban */}
          <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700 hover:border-blue-500"
               onClick={() => router.push("/modules/pickban/static")}>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Static Pick & Ban</h3>
              <p className="text-gray-400 mb-4">
                Create and manage pick & ban sessions without League Client integration. Perfect for tournaments and practice.
              </p>
              <div className="text-sm text-blue-400">Click to continue →</div>
            </div>
          </div>

          {/* Demo Game */}
          <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700 hover:border-green-500"
               onClick={() => router.push("/modules/pickban/demo")}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Demo Game</h3>
              <p className="text-gray-400 mb-4">
                Experience a pre-configured pick & ban session to see how the system works.
              </p>
              <div className="text-sm text-green-400">Click to continue →</div>
            </div>
          </div>

          {/* League Client Integration */}
          <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700 hover:border-purple-500"
               onClick={() => router.push("/modules/pickban/leagueclient")}>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">League Client</h3>
              <p className="text-gray-400 mb-4">
                Connect to League of Legends Client for real-time pick & ban integration.
              </p>
              <div className="text-sm text-purple-400">Click to continue →</div>
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => router.push("/modules/pickban/static")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Create New Session
            </button>
            <button
              onClick={() => router.push("/modules/pickban/demo")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Try Demo
            </button>
            <button
              onClick={() => router.push("/modules")}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Back to Modules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
