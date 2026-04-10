// ============================================================
// Rakshak AI - WebSocket Hook
// Auto-reconnecting WebSocket for live threat feed
// ============================================================

import { useEffect, useRef } from 'react';

export function useWebSocket(onMessage) {
  const ws = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    let reconnectTimer = null;

    const connect = () => {
      try {
        ws.current = new WebSocket('ws://localhost:5000');
        ws.current.onmessage = (e) => {
          try { onMessageRef.current(JSON.parse(e.data)); } catch {}
        };
        ws.current.onclose = () => {
          reconnectTimer = setTimeout(connect, 3000);
        };
        ws.current.onerror = () => {
          ws.current?.close();
        };
      } catch {}
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws.current?.close();
    };
  }, []);
}
