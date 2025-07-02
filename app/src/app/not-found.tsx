"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@lib/contexts/AuthContext';
import { useElectron } from '@lib/contexts/ElectronContext';

const NotFoundPage: React.FC = (): React.ReactElement => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isElectronLoading } = useElectron();

  useEffect(() => {
    if (authLoading || isElectronLoading) return;

    if (user) {
      router.replace('/modules');
    } else {
      router.replace('/auth');
    }
  }, [authLoading, isElectronLoading, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Redirecting...
    </div>
  );
};

export default NotFoundPage;
