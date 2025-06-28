'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useElectron } from '@lib/contexts/ElectronContext';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { PageLoader } from '@components/common';

export default function PickBanPage() {
  const router = useRouter();
  const { isElectron } = useElectron();
  const { setActiveModule } = useNavigation();
  const { user: authUser, isLoading: authLoading } = useAuth();

  useEffect(() => {
    setActiveModule('pickban');
  }, [setActiveModule]);

  useEffect(() => {
    if (!authLoading && authUser) {
      // Redirect based on environment
      if (isElectron) {
        // In Electron app, redirect to League Client integration
        router.replace('/modules/pickban/leagueclient');
      } else {
        // In web browser, redirect to static pick & ban
        router.replace('/modules/pickban/static');
      }
    }
  }, [authLoading, authUser, isElectron, router]);

  if (authLoading) {
    return <PageLoader text="Checking authentication..." />;
  }

  if (!authUser) {
    // Redirect to auth if not authenticated
    router.replace('/auth');
    return <PageLoader text="Redirecting to authentication..." />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Initializing Pick & Ban</h1>
          <p className="text-gray-400">
            Detecting your environment and redirecting you to the appropriate interface...
          </p>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 text-left">
          <h3 className="font-semibold mb-2">Available Modes:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isElectron ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span className={isElectron ? 'text-green-400' : 'text-gray-400'}>
                League Client Integration (Desktop App)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${!isElectron ? 'bg-green-400' : 'bg-gray-400'}`}></div>
              <span className={!isElectron ? 'text-green-400' : 'text-gray-400'}>
                Static Pick & Ban (Web Browser)
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>You will be automatically redirected in a moment...</p>
          <div className="flex gap-4 mt-3">
            <button
              onClick={() => router.push('/modules/pickban/static')}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Force Static Mode
            </button>
            {isElectron && (
              <button
                onClick={() => router.push('/modules/pickban/leagueclient')}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Force LCU Mode
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
