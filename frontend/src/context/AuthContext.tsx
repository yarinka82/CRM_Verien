

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '@/api/client';

export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthContextValue {
  user: User | null;
  username: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isStaff: boolean;
  userId: number | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await apiFetch('/api/auth/me/');
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      const data = await response.json();
      setUser(data);
    } catch (err) {
      console.error('Error fetching user:', err);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
  
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // При сессионной аутентификации токен не нужен
      // Просто сохраняем пользователя
      setUser(data);
      window.location.href = '/home';

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    username: user?.username || null,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    isStaff: user?.is_staff || false,
    userId: user?.id || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};