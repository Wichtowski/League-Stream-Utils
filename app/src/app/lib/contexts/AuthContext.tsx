'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@lib/types/auth';
import { useElectron } from './ElectronContext';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isElectron, isElectronLoading, useLocalData } = useElectron();

    const clearAuthData = () => {
        setUser(null);
    };

    const refreshToken = async (): Promise<boolean> => {
        try {
            const response = await fetch('/api/v1/auth/refresh', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                return true;
            } else {
                clearAuthData();
                return false;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            clearAuthData();
            return false;
        }
    };

    const checkAuth = async () => {
        // Wait for Electron detection to complete
        if (isElectronLoading) {
            return;
        }

        // If running in Electron with local data mode, automatically login as admin
        if (isElectron && useLocalData) {
            setUser({
                id: 'electron-admin',
                username: 'Local Admin',
                isAdmin: true,
                email: 'admin@local',
                password: '',
                sessionsCreatedToday: 0,
                lastSessionDate: new Date(),
                createdAt: new Date()
            });
            setIsLoading(false);
            return;
        }

        // Try to validate existing session with a protected endpoint
        try {
            const response = await fetch('/api/v1/auth/me', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else if (response.status === 401) {
                // Try to refresh token
                const refreshed = await refreshToken();
                if (refreshed) {
                    // Retry getting user info
                    const retryResponse = await fetch('/api/v1/auth/me', {
                        method: 'GET',
                        credentials: 'include'
                    });
                    
                    if (retryResponse.ok) {
                        const data = await retryResponse.json();
                        setUser(data.user);
                    }
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
            clearAuthData();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, message: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error occurred' };
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/v1/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuthData();
            if (typeof window !== 'undefined') {
                window.location.href = '/auth';
            }
        }
    };

    useEffect(() => {
        checkAuth();
    }, [isElectronLoading, isElectron, useLocalData]);

    const value = {
        user,
        isLoading,
        login,
        logout,
        checkAuth,
        refreshToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function useUser() {
    const { user } = useAuth();
    return user;
} 