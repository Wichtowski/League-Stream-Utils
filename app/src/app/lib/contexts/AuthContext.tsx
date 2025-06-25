'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@lib/types/auth';
import { useElectron } from './ElectronContext';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    isTokenValid: () => boolean;
    clearAuthAndRedirect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Utility function to check if token is expired
const isTokenExpired = (token: string): boolean => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
    } catch (error) {
        console.error('Error checking token expiration:', error);
        return true; // If we can't decode, consider it expired
    }
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isElectron, isElectronLoading, useLocalData } = useElectron();

    const clearAuthData = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const clearAuthAndRedirect = () => {
        clearAuthData();
        // Force redirect using window.location to ensure it works
        if (typeof window !== 'undefined') {
            window.location.href = '/auth';
        }
    };

    const isTokenValid = (): boolean => {
        // In Electron local data mode, always return true since we use automatic admin auth
        if (isElectron && useLocalData) {
            return true;
        }

        const token = localStorage.getItem('token');
        if (!token) return false;
        
        if (isTokenExpired(token)) {
            clearAuthData();
            return false;
        }
        
        return true;
    };

    const checkAuth = async () => {
        // Wait for Electron detection to complete
        if (isElectronLoading) {
            return;
        }

        // If running in Electron with local data mode, automatically login as admin
        if (isElectron && useLocalData) {
            // Clear any existing cloud tokens when switching to local mode
            localStorage.removeItem('token');
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

        // Not in local mode - clear user if no valid token
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        // Check if token is expired
        if (isTokenExpired(token)) {
            console.log('Token expired, clearing auth data');
            clearAuthData();
            setIsLoading(false);
            return;
        }

        try {
            // Decode JWT token to get user info
            const payload = JSON.parse(atob(token.split('.')[1]));
            setUser({
                id: payload.userId,
                username: payload.username,
                isAdmin: payload.isAdmin,
                email: '',
                password: '',
                sessionsCreatedToday: 0,
                lastSessionDate: new Date(),
                createdAt: new Date()
            });
        } catch (_error) {
            console.error('Invalid token:', _error);
            clearAuthData();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                setUser({
                    id: data.user.id,
                    username: data.user.username,
                    isAdmin: data.user.isAdmin,
                    email: data.user.email || '',
                    password: '',
                    sessionsCreatedToday: data.user.sessionsCreatedToday || 0,
                    lastSessionDate: data.user.lastSessionDate ? new Date(data.user.lastSessionDate) : new Date(),
                    createdAt: data.user.createdAt ? new Date(data.user.createdAt) : new Date()
                });
                return true;
            } else {
                console.error('Login failed:', data.error);
                return false;
            }
        } catch (_error) {
            console.error('Login error:', _error);
            return false;
        }
    };

    const logout = () => {
        clearAuthAndRedirect();
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
        isTokenValid,
        clearAuthAndRedirect
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