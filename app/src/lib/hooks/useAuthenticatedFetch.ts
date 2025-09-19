import { useState, useCallback } from "react";
import { useAuth } from "@lib/contexts/AuthContext";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

interface FetchResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useAuthenticatedFetch(): {
  authenticatedFetch: (url: string, options?: FetchOptions) => Promise<Response>;
} {
  const { refreshToken, logout, user } = useAuth();

  const authenticatedFetch = useCallback(
    async (url: string, options: FetchOptions = {}): Promise<Response> => {
      const { skipAuth = false, ...fetchOptions } = options;

      // Don't make requests if user is not authenticated
      if (!user && !skipAuth) {
        throw new Error("User not authenticated");
      }

      try {
        const defaultOptions: RequestInit = {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...fetchOptions.headers
          },
          ...fetchOptions
        };

        let response = await fetch(url, defaultOptions);

        // Try to refresh token on 401, but only if we have a user and not already logged out
        if (response.status === 401 && !skipAuth && user) {
          console.log("401 Unauthorized - attempting token refresh...");
          const refreshed = await refreshToken();

          if (refreshed) {
            console.log("Token refreshed, retrying request...");
            response = await fetch(url, defaultOptions);
          } else {
            // If refresh failed, force logout but don't retry
            console.log("Token refresh failed - logging out...");
            await logout();
            // Return the original 401 response instead of retrying
            return response;
          }

          // If the retried request is still unauthorized after successful refresh, logout
          if (refreshed && response.status === 401) {
            console.log("Still unauthorized after token refresh - logging out...");
            await logout();
          }
        }

        return response;
      } catch (error) {
        throw error;
      }
    },
    [refreshToken, logout, user]
  );

  return { authenticatedFetch };
}

export function useApiRequest<T = unknown>(url: string, options: FetchOptions = {}) {
  const [state, setState] = useState<FetchResult<T>>({
    data: null,
    error: null,
    loading: false
  });

  const { authenticatedFetch } = useAuthenticatedFetch();

  const execute = useCallback(
    async (requestOptions: FetchOptions = {}) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await authenticatedFetch(url, {
          ...options,
          ...requestOptions
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Request failed" }));
          setState({
            data: null,
            error: errorData.error || `HTTP ${response.status}`,
            loading: false
          });
          return {
            data: null,
            error: errorData.error || `HTTP ${response.status}`,
            loading: false
          };
        }

        const data = await response.json();

        setState({
          data,
          error: null,
          loading: false
        });
        return { data, error: null, loading: false };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Network error";
        setState({
          data: null,
          error: errorMessage,
          loading: false
        });
        return { data: null, error: errorMessage, loading: false };
      }
    },
    [url, options, authenticatedFetch]
  );

  return {
    ...state,
    execute
  };
}
