"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useElectron } from "@lib/contexts/ElectronContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { PageLoader } from "@lib/components/common";
import { PageWrapper } from "@lib/layout/PageWrapper";

export default function PickBanPage(): React.ReactElement {
  const router = useRouter();
  const { isElectron } = useElectron();
  const { setActiveModule } = useNavigation();
  const { user: authUser, isLoading: authLoading } = useAuth();

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

  if (authLoading) {
    return <PageLoader text="Checking authentication..." />;
  }

  if (!authUser) {
    // Redirect to auth if not authenticated
    router.replace("/auth");
    return <PageLoader text="Redirecting to authentication..." />;
  }

  // Show the hub for all users
  return (
    <PageWrapper
      requireAuth={false}
      breadcrumbs={[{ label: "Pick & Ban", href: "/modules/pickban", isActive: true }]}
      title="Pick & Ban Hub"
      subtitle="Choose your Pick & Ban experience. Create sessions for tournaments, practice, or demonstrations."
      contentClassName="text-center"
    >
      {/* Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
        {/* Static Pick & Ban */}
        <div
          className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700 hover:border-blue-500"
          onClick={() => router.push("/modules/pickban/static")}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Static Pick & Ban</h3>
            <p className="text-gray-400 mb-4">
              Create and manage pick & ban sessions without League Client integration. Perfect for tournaments and
              practice.
            </p>
            <div className="text-sm text-blue-400">Click to continue →</div>
          </div>
        </div>

        {/* Demo Game */}
        <div
          className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-colors cursor-pointer border border-gray-700 hover:border-green-500"
          onClick={() => router.push("/modules/pickban/demo")}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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
        <div
          className={`${!isElectron ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-700 cursor-pointer hover:border-purple-500"} bg-gray-800 rounded-xl p-6 transition-colors border border-gray-700`}
          onClick={() => {
            if (isElectron) {
              router.push("/modules/pickban/leagueclient");
            }
          }}
        >
          <div className="text-center">
            <div
              className={`w-16 h-16 ${isElectron ? "bg-purple-600" : "bg-gray-600"} rounded-full mx-auto mb-4 flex items-center justify-center`}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">League Client</h3>
            <p className="text-gray-400 mb-4">
              Connect to League of Legends Client for real-time pick & ban integration.
              {!isElectron && (
                <span className="block text-sm text-yellow-400 mt-2">⚠️ Only available in Electron desktop app</span>
              )}
            </p>
            <div className={`text-sm ${isElectron ? "text-purple-400" : "text-gray-500"}`}>
              {isElectron ? "Click to continue →" : "Not available in web browser"}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
