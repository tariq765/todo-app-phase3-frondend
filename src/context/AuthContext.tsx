'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { login as loginApi, register as registerApi, verifyToken } from '@/lib/auth-api';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if there's a token in localStorage on initial load
    const storedToken = localStorage.getItem('auth_token');
    const storedUserId = localStorage.getItem('user_id');

    if (storedToken && storedUserId) {
      setToken(storedToken);
      // In a real app, you might decode the JWT to get user info
      setUser({ id: storedUserId });
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await loginApi({ email, password });

      if (response.data) {
        const { token, user_id, user } = response.data;

        // Store the JWT token and user ID
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_id', user_id);

        setToken(token);
        setUser(user || { id: user_id });

        return true;
      } else {
        console.error('Login error:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await registerApi({ email, password });

      if (response.data) {
        const { token, user_id, user } = response.data;

        // Store the JWT token and user ID
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_id', user_id);

        setToken(token);
        setUser(user || { id: user_id });

        return true;
      } else {
        console.error('Registration error:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    // Remove token and user data from localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');

    setToken(null);
    setUser(null);

    // Direct browser redirect to avoid client-side navigation issues
    window.location.href = '/login';
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};