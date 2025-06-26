'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ElectronSettings from '@/app/components/common/electron/settings';
import { LoadingSpinner } from '@components/common';

export default function SettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isElectron, setIsElectron] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const electronCheck = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
        setIsElectron(electronCheck);
        setIsInitialized(true);

        // Redirect non-admin users in browser mode
        if (typeof window !== 'undefined' && !electronCheck && !authLoading && !user?.isAdmin) {
            router.push('/modules');
        }
    }, [user, router, authLoading]);

    // Show loading state while initializing or auth is loading
    if (!isInitialized || authLoading) {
        return <LoadingSpinner fullscreen text="Loading..." />;
    }

    // Redirect non-admin users in browser mode
    if (!isElectron && !user?.isAdmin) {
        return <div className="flex justify-center items-center min-h-screen">Redirecting...</div>;
    }

    return <ElectronSettings />;
} 