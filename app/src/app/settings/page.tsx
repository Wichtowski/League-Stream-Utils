'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ElectronSettings } from '@lib/components/electron/settings';
import { LoadingSpinner } from '@lib/components/common';
import { PageWrapper } from '@lib/layout/PageWrapper';
import { useNavigation } from '@lib/contexts/NavigationContext';

export default function SettingsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isElectron, setIsElectron] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const { setActiveModule } = useNavigation();

    useEffect(() => {
        setActiveModule('settings');
    }, [setActiveModule]);

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
        return (
            <PageWrapper requireAuth={false}>
                <LoadingSpinner fullscreen text="Loading..." />
            </PageWrapper>
        );
    }

    // Redirect non-admin users in browser mode
    if (!isElectron && !user?.isAdmin) {
        return (
            <PageWrapper requireAuth={false}>
                <div className="flex justify-center items-center min-h-screen">Redirecting...</div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper requireAuth={false}>
            <ElectronSettings />
        </PageWrapper>
    );
}
