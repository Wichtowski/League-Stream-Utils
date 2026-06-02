import { useEffect, useRef, useCallback } from 'react';
import { usedraftStore } from './store';

interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export function usedraftSocket(sessionId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);
  const store = usedraftStore;

  const connect = useCallback(() => {
    if (!sessionId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}/api/v1/draft/${sessionId}/ws`;

    store.getState().setStatus('connecting');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      store.getState().setStatus('connected');
      store.getState().setError(null);
      reconnectRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        handleMessage(msg);
      } catch {
        // malformed message
      }
    };

    ws.onclose = () => {
      store.getState().setStatus('idle');
      if (reconnectRef.current < 5) {
        const delay = Math.min(1000 * 2 ** reconnectRef.current, 10_000);
        reconnectRef.current++;
        setTimeout(connect, delay);
      } else {
        store.getState().setError('Connection lost');
      }
    };

    ws.onerror = () => {
      store.getState().setStatus('error');
    };
  }, [sessionId]);

  function handleMessage(msg: WSMessage) {
    const s = store.getState();
    switch (msg.type) {
      case 'state':
        if (msg.phase) s.setPhase(msg.phase as any);
        if (msg.team) s.setTeam(msg.team as any);
        if (typeof msg.turnNumber === 'number') s.setTurn(msg.turnNumber);
        if (msg.timer) s.setTimer(msg.timer as any);
        if (Array.isArray(msg.actions)) s.setActions(msg.actions as any);
        break;
      case 'action':
        if (msg.action) s.addAction(msg.action as any);
        if (msg.phase) s.setPhase(msg.phase as any);
        if (msg.team) s.setTeam(msg.team as any);
        if (typeof msg.turnNumber === 'number') s.setTurn(msg.turnNumber);
        if (msg.timer) s.setTimer(msg.timer as any);
        break;
      case 'timer':
        if (msg.timer) s.setTimer(msg.timer as any);
        break;
      case 'completed':
        s.setPhase('completed');
        s.setTimer({ remaining: 0, totalTime: 0, isActive: false });
        break;
    }
  }

  const send = useCallback((msg: WSMessage) => {
    wsRef.current?.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { send };
}
