import { useEffect, useState, useRef } from 'react';
import type { EnhancedChampSelectSession } from '@lib/types';
import { MOCK_CHAMP_SELECT_DATA } from '@lib/mocks/champselect';

export type UseChampSelectDataResult = {
    data: EnhancedChampSelectSession | null;
    loading: boolean;
    error: string | null;
};

function getBackendUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('backend');
}

export const useChampSelectData = (): UseChampSelectDataResult => {
    const [data, setData] = useState<EnhancedChampSelectSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const backend = getBackendUrl();

        if (!backend) {
            setData(MOCK_CHAMP_SELECT_DATA);
            setLoading(false);
            return;
        }

        if (backend.startsWith('ws://') || backend.startsWith('wss://')) {
            // WebSocket mode
            const ws = new WebSocket(backend);
            wsRef.current = ws;

            ws.onopen = () => setLoading(false);
            ws.onmessage = (event) => {
                setData(JSON.parse(event.data));
                setError(null);
            };
            ws.onerror = () => setError('WebSocket error');
            ws.onclose = () => setError('WebSocket closed');

            return () => ws.close();
        } else if (backend.startsWith('http://') || backend.startsWith('https://')) {
            // HTTP polling mode
            let stopped = false;
            setLoading(true);

            const poll = async () => {
                try {
                    const res = await fetch(backend);
                    if (!res.ok) throw new Error('HTTP error');
                    setData(await res.json());
                    setError(null);
                } catch (e) {
                    setError('HTTP error');
                } finally {
                    setLoading(false);
                }
            };

            poll();
            const interval = setInterval(poll, 1000);

            return () => {
                stopped = true;
                clearInterval(interval);
            };
        } else {
            setError('Invalid backend URL');
            setLoading(false);
        }
    }, []);

    return { data, loading, error };
}; 