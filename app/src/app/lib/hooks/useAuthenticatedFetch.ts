import { useAuth } from '@lib/contexts/AuthContext';
import { useElectron } from '@lib/contexts/ElectronContext';
import { useCallback } from 'react';

interface AuthenticatedFetchOptions extends RequestInit {
    skipAuthCheck?: boolean;
}

export const useAuthenticatedFetch = () => {
    const { isTokenValid, clearAuthAndRedirect } = useAuth();
    const { isElectron, useLocalData } = useElectron();

    const authenticatedFetch = useCallback(async (
        url: string,
        options: AuthenticatedFetchOptions = {}
    ): Promise<Response> => {
        const { skipAuthCheck = false, ...fetchOptions } = options;

        // Skip authentication checks for Electron local data mode
        const isElectronLocalMode = isElectron && useLocalData;

        if (!isElectronLocalMode) {
            // Check token validity before making the request
            if (!skipAuthCheck && !isTokenValid()) {
                console.log('Token invalid or expired, redirecting to auth');
                clearAuthAndRedirect();
                throw new Error('Authentication required');
            }
        }

        // Add appropriate headers based on mode
        const token = localStorage.getItem('token');
        const headers = {
            ...fetchOptions.headers,
            ...(isElectronLocalMode
                ? { 'x-electron-local-mode': 'true' }
                : token && { 'Authorization': `Bearer ${token}` }
            )
        };

        const response = await fetch(url, {
            ...fetchOptions,
            headers
        });

        // Handle 401 responses by redirecting to auth (skip for Electron local mode)
        if (response.status === 401 && !isElectronLocalMode) {
            console.log('Received 401, token likely expired, redirecting to auth');
            clearAuthAndRedirect();
            throw new Error('Authentication expired');
        }

        return response;
    }, [isTokenValid, clearAuthAndRedirect, isElectron, useLocalData]);

    return { authenticatedFetch };
}; 