'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@lib/contexts/AuthContext';
import { useElectron } from '@lib/contexts/ElectronContext';
import { LoadingSpinner } from '@lib/components/common';

interface AuthGuardProps {
    children: React.ReactNode;
    redirectTo?: string;
    requireAuth?: boolean;
    loadingMessage?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
    children, 
    redirectTo = '/auth',
    requireAuth = true,
    loadingMessage = 'Checking authentication...'
}) => {
    const { user, isLoading } = useAuth();
    const { isElectron, isElectronLoading, useLocalData } = useElectron();
    const router = useRouter();
    const pathname = usePathname();

    // In local data mode, we don't need authentication
    const isLocalDataMode = isElectron && useLocalData;
    const authRequired = requireAuth && !isLocalDataMode;

    useEffect(() => {
        if (!isLoading && !isElectronLoading && authRequired && !user) {
            // Store the current path for returnTo functionality
            if (typeof window !== 'undefined' && pathname !== '/auth') {
                sessionStorage.setItem('returnTo', pathname);
            }
            router.replace(redirectTo);
        }
    }, [user, isLoading, isElectronLoading, authRequired, redirectTo, router, pathname]);

    // Show loading while checking auth or Electron status
    if (isLoading || isElectronLoading) {
        return (
            <LoadingSpinner fullscreen text={loadingMessage} />
        );
    }

    // Don't render children if auth is required but user is not authenticated
    if (authRequired && !user) {
        return null;
    }

    return <>{children}</>;
}; 