'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthTabs from '@/app/auth/components/AuthTabs';
import MessageDisplay from '@/app/auth/components/MessageDisplay';
import LoginForm from '@/app/auth/components/LoginForm';
import RegisterForm from '@/app/auth/components/RegisterForm';
import ContactInfo from '@/app/auth/components/ContactInfo';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { useElectron } from '@lib/contexts/ElectronContext';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

export default function AuthPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();
  const { user, isLoading } = useAuth();
  const { isElectron, useLocalData } = useElectron();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setActiveModule('auth');
    
    // Redirect to modules if already authenticated
    if (!isLoading && user) {
      // Check if there's a returnTo path stored
      const returnTo = localStorage.getItem('returnTo');
      if (returnTo && returnTo !== '/auth') {
        localStorage.removeItem('returnTo'); // Clean up
        router.push(returnTo);
      } else {
        router.push('/modules');
      }
    }
  }, [setActiveModule, user, isLoading, router]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLoginSuccess = () => {
    clearMessages();
  };

  const handleRegisterSuccess = (message: string) => {
    setSuccess(message);
    setError('');
  };

  const switchToLogin = () => {
    setIsLogin(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen text-white flex items-center justify-center relative">
      {/* Electron Mode Indicator */}
      {isElectron && (
        <div className="absolute top-6 right-6 flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">
              Mode: <span className={useLocalData ? 'text-green-400' : 'text-blue-400'}>
                {useLocalData ? 'Local Data' : 'Online'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {useLocalData ? 'Saving to AppData' : 'Using cloud storage'}
            </div>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-colors"
            title="Electron Settings"
          >
            <Cog6ToothIcon className="w-5 h-5 text-gray-400 hover:text-gray-300" />
          </button>
        </div>
      )}

      <div className="max-w-md w-full mx-auto bg-gray-800 rounded-lg p-8 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">
          League Stream Utils
        </h1>

        <AuthTabs
          isLogin={isLogin}
          onTabChange={setIsLogin}
          onClearMessages={clearMessages}
        />

        <MessageDisplay error={error} success={success} />

        {isLogin ? (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onError={setError}
          />
        ) : (
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onError={setError}
            onSwitchToLogin={switchToLogin}
          />
        )}

        <ContactInfo />
      </div>
    </div>
  );
} 