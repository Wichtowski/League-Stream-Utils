'use client';

import { useAuth } from '@lib/contexts/AuthContext';

interface AuthWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, fallback = null }) => {
    const { user, isLoading } = useAuth();

    // Still loading, show nothing
    if (isLoading) {
        return null;
    }

    // Not authenticated, show fallback or nothing
    if (!user) {
        return <>{fallback}</>;
    }

    // Authenticated, show children
    return <>{children}</>;
};
