'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SALES_MANAGER' | 'FINANCE_MANAGER' | 'OPERATIONS_MANAGER';
  emailVerified: boolean;
  profilePicture?: string;
  phoneNumber?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  phoneNumber?: string;
  department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API client for authenticated requests
const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor
authApi.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['x-request-id'] = `req-${Date.now()}`;
    config.headers['x-request-time'] = new Date().toISOString();
    return config;
  },
  (error) => Promise.reject(error)
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      if (!accessToken) {
        setLoading(false);
        return;
      }

      const response = await authApi.get('/auth/profile');
      if (response.data.data.user) {
        setUser(response.data.data.user);
      } else {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Starting login via API route...');
      
      // Use Next.js API route which sets cookies server-side
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed');
      }

      const { user } = data.data;
      console.log('[AuthContext] Login successful, user:', user.email, 'role:', user.role);
      
      setUser(user);
      
      // Determine redirect path based on role
      const redirectPath = {
        'ADMIN': '/admin',
        'SALES_MANAGER': '/sales',
        'FINANCE_MANAGER': '/finance',
        'OPERATIONS_MANAGER': '/operations'
      }[user.role] || '/dashboard';
      
      console.log('[AuthContext] Redirecting to:', redirectPath);
      
      // Simple redirect - cookies are already set server-side
      router.push(redirectPath);
      
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      throw error.message || 'Login failed';
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const registerResponse = await authApi.post('/auth/register', data);
      console.log('[AuthContext] Registration successful');
      
      // Login after registration
      await login(data.email, data.password);
    } catch (error: any) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const logout = async () => {
    try {
      await authApi.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      setUser(null);
      router.push('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authApi.get('/auth/profile');
      if (response.data.data.user) {
        setUser(response.data.data.user);
      } else {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}