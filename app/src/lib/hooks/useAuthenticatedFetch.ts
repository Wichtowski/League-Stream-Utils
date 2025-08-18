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
  const { refreshToken } = useAuth();
  const { user } = useAuth();
  const authenticatedFetch = useCallback(
    async (url: string, options: FetchOptions = {}): Promise<Response> => {
      const { skipAuth = false, ...fetchOptions } = options;


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

        if (response.status === 401 && !skipAuth && !user?.isAdmin) {
          const refreshed = await refreshToken();
          
          if (refreshed) {
            response = await fetch(url, defaultOptions);
          }
        }

        return response;
      } catch (error) {
        throw error;
      }
    },
    [refreshToken, user]
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
