// ============================================================
// Rakshak AI — Socket.IO Context
// Manages real-time WebSocket connection across the app.
// ============================================================

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('[Socket.IO] Connected:', newSocket.id);
      setConnected(true);

      // Join dashboard room
      newSocket.emit('join-dashboard');

      // Join user-specific room if logged in
      if (user?.user_id) {
        newSocket.emit('join-user-room', user.user_id);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('[Socket.IO] Disconnected:', reason);
      setConnected(false);
    });

    // Global event listeners for real-time updates
    newSocket.on('user-data-updated', (payload) => {
      console.log('[Socket.IO] User data updated:', payload.section);
      setLastUpdate(payload);
      // Notify all registered listeners
      const listeners = listenersRef.current.get('user-data-updated') || [];
      listeners.forEach(fn => fn(payload));
    });

    newSocket.on('risk-score-changed', (payload) => {
      console.log('[Socket.IO] Risk score changed:', payload.trust_score);
      setLastUpdate(payload);
      const listeners = listenersRef.current.get('risk-score-changed') || [];
      listeners.forEach(fn => fn(payload));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-join rooms when user changes
  useEffect(() => {
    if (socket && connected && user?.user_id) {
      socket.emit('join-user-room', user.user_id);
    }
  }, [socket, connected, user?.user_id]);

  /**
   * Subscribe to a specific Socket.IO event.
   * Returns an unsubscribe function.
   */
  const subscribe = useCallback((event, callback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, []);
    }
    listenersRef.current.get(event).push(callback);

    return () => {
      const arr = listenersRef.current.get(event) || [];
      const idx = arr.indexOf(callback);
      if (idx >= 0) arr.splice(idx, 1);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, lastUpdate, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
}

export default SocketContext;
