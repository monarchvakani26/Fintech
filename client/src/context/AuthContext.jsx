// ============================================================
// Rakshak AI - Auth Context
// Global authentication state management
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('rakshak_token');
    const savedUser = localStorage.getItem('rakshak_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // Invalid user data
      }
      // Verify token validity
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('rakshak_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Token invalid - clear
          localStorage.removeItem('rakshak_token');
          localStorage.removeItem('rakshak_user');
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password, deviceFingerprint) => {
    const response = await api.post('/auth/login', { email, password, deviceFingerprint });
    const { token: newToken, user: newUser } = response.data;
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('rakshak_token', newToken);
    localStorage.setItem('rakshak_user', JSON.stringify(newUser));
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('rakshak_token');
    localStorage.removeItem('rakshak_user');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('rakshak_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('rakshak_user', JSON.stringify(res.data.user));
      }
    } catch {
      // Ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export default AuthContext;
