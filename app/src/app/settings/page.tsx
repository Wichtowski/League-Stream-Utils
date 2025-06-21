'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ElectronSettings from '@components/settings/ElectronSettings';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isElectron, setIsElectron] = useState(false);

    useEffect(() => {
        const electronCheck = typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
        setIsElectron(electronCheck);

        // Redirect non-admin users in browser mode
        if (typeof window !== 'undefined' && !electronCheck && !user?.isAdmin) {
            router.push('/modules');
        }
    }, [user, router]);

    // Show loading state while checking
    if (typeof window === 'undefined') {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    // Redirect non-admin users in browser mode
    if (!isElectron && !user?.isAdmin) {
        return <div className="flex justify-center items-center min-h-screen">Redirecting...</div>;
    }

    return <ElectronSettings />;
} 