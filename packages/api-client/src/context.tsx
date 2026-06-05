import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

import { ApiClient } from "./api";
import type { ClientContext } from "./client";

const ApiContext = createContext<ApiClient | null>(null);

interface ApiProviderProps {
  children: ReactNode;
  onUnauthorized?: () => void;
  getHeaders?: () => Record<string, string>;
}

export function ApiProvider({ children, onUnauthorized, getHeaders }: ApiProviderProps) {
  const client = useMemo(() => {
    const ctx: ClientContext = { onUnauthorized, getHeaders };

    return new ApiClient(ctx);
  }, [onUnauthorized, getHeaders]);

  return <ApiContext value={client}>{children}</ApiContext>;
}

export function useApiClient(): ApiClient {
  const client = useContext(ApiContext);
  if (!client) {
    throw new Error("useApiClient must be used within an <ApiProvider>");
  }

  return client;
}
