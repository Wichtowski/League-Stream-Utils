import { useEffect, useRef } from "react";

interface CancellableRequest {
  abortController: AbortController;
  timestamp: number;
}

export const useRequestCancellation = () => {
  const requestsRef = useRef<Map<string, CancellableRequest>>(new Map());

  useEffect(() => {
    const requests = requestsRef.current;
    // Cleanup function to cancel all pending requests when component unmounts
    return () => {
      requests.forEach((request) => {
        request.abortController.abort();
      });
      requests.clear();
    };
  }, []);

  const createCancellableRequest = (id: string): AbortController => {
    // Cancel any existing request with the same ID
    const existing = requestsRef.current.get(id);
    if (existing) {
      existing.abortController.abort();
    }

    const abortController = new AbortController();
    requestsRef.current.set(id, {
      abortController,
      timestamp: Date.now(),
    });

    return abortController;
  };

  const cancelRequest = (id: string): void => {
    const request = requestsRef.current.get(id);
    if (request) {
      request.abortController.abort();
      requestsRef.current.delete(id);
    }
  };

  const cancelAllRequests = (): void => {
    requestsRef.current.forEach((request) => {
      request.abortController.abort();
    });
    requestsRef.current.clear();
  };

  const cleanupOldRequests = (maxAge: number = 30000): void => {
    const now = Date.now();
    requestsRef.current.forEach((request, id) => {
      if (now - request.timestamp > maxAge) {
        request.abortController.abort();
        requestsRef.current.delete(id);
      }
    });
  };

  const getActiveRequests = (): string[] => {
    return Array.from(requestsRef.current.keys());
  };

  return {
    createCancellableRequest,
    cancelRequest,
    cancelAllRequests,
    cleanupOldRequests,
    getActiveRequests,
  };
};
