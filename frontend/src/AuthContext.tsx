
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from './apiClient';

interface AuthContextValue {
  username: string | null;
  isStaff: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/auth/me/')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUsername(data?.username ?? null);
        setIsStaff(Boolean(data?.is_staff));
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    await apiFetch('/api/auth/me/'); // ensures a CSRF cookie exists first
    const res = await apiFetch('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || 'Не вдалося увійти.');
    }
    const data = await res.json();
    setUsername(data.username);
    setIsStaff(Boolean(data.is_staff));
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout/', { method: 'POST' });
    setUsername(null);
    setIsStaff(false);
  };

  return (
    <AuthContext.Provider value={{ username, isStaff, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}