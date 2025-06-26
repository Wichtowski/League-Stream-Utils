'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@lib/contexts/AuthContext';
import { LoadingSpinner } from '@components/common';

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
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && requireAuth && !user) {
            // Store the current path for returnTo functionality
            if (typeof window !== 'undefined' && pathname !== '/auth') {
                sessionStorage.setItem('returnTo', pathname);
            }
            router.replace(redirectTo);
        }
    }, [user, isLoading, requireAuth, redirectTo, router, pathname]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <LoadingSpinner fullscreen text={loadingMessage} />
        );
    }

    // Don't render children if auth is required but user is not authenticated
    if (requireAuth && !user) {
        return null;
    }

    return <>{children}</>;
}; 