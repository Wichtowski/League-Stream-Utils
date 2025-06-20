'use client';

import { useState, useEffect } from 'react';
import AuthTabs from '@components/auth/AuthTabs';
import MessageDisplay from '@components/auth/MessageDisplay';
import LoginForm from '@components/auth/LoginForm';
import RegisterForm from '@components/auth/RegisterForm';
import ContactInfo from '@components/auth/ContactInfo';
import { useNavigation } from '@lib/contexts/NavigationContext';

export default function AuthPage() {
  const { setActiveModule } = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setActiveModule('auth');
  }, [setActiveModule]);

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

  return (
    <div className="min-h-screen text-white flex items-center justify-center">
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