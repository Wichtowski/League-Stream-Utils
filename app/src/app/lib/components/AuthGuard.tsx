'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@lib/contexts/AuthContext';

interface AuthGuardProps {
    children: React.ReactNode;
    redirectTo?: string;
    requireAuth?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
    children, 
    redirectTo = '/auth',
    requireAuth = true 
}) => {
    const { user, isLoading, isTokenValid } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && requireAuth) {
            if (!user || !isTokenValid()) {
                console.log('AuthGuard: Redirecting unauthenticated user to', redirectTo);
                router.replace(redirectTo);
            }
        }
    }, [user, isLoading, isTokenValid, requireAuth, redirectTo, router]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-white">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Don't render children if auth is required but user is not authenticated
    if (requireAuth && (!user || !isTokenValid())) {
        return null;
    }

    return <>{children}</>;
}; 