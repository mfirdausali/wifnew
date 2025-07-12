'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';
import { clearAllAuthCookies, debugCookies } from '@/utils/auth';

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

// Create a simple API client to avoid circular dependencies
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
      // Handle both response formats
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
      console.log('[AuthContext] Starting login for:', email);
      const response = await authApi.post('/auth/login', { email, password });
      const { user, tokens } = response.data.data;
      const { accessToken, refreshToken } = tokens;
      
      console.log('[AuthContext] Login successful, user:', user.email, 'role:', user.role);
      console.log('[AuthContext] Setting cookies...');
      
      // Clear any old cookies first
      clearAllAuthCookies();
      
      // Set new cookies with explicit options
      const cookieOptions = {
        path: '/',
        sameSite: 'lax' as const,
        secure: false, // Set to false for localhost
        domain: undefined // Let browser handle domain
      };

      Cookies.set('accessToken', accessToken, { 
        ...cookieOptions,
        expires: 1 // 1 day
      });
      
      Cookies.set('refreshToken', refreshToken, { 
        ...cookieOptions,
        expires: 7 // 7 days
      });
      
      // CRITICAL: Verify cookies are set
      const verifyToken = Cookies.get('accessToken');
      if (!verifyToken) {
        throw new Error('Failed to set authentication cookies');
      }
      
      console.log('[AuthContext] Cookies verified as set');
      
      setUser(user);
      
      // Determine redirect path based on role
      const redirectPath = {
        'ADMIN': '/admin',
        'SALES_MANAGER': '/sales',
        'FINANCE_MANAGER': '/finance',
        'OPERATIONS_MANAGER': '/operations'
      }[user.role] || '/dashboard';
      
      console.log('[AuthContext] Redirecting to:', redirectPath);
      
      // GOOGLE SENIOR ENGINEER SOLUTION: Use form submission to ensure cookies are sent
      // This guarantees the browser sends cookies with the navigation request
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = redirectPath;
      form.style.display = 'none';
      document.body.appendChild(form);
      form.submit();
      
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (data: RegisterData) => {
    try {
      // First register the user
      const registerResponse = await authApi.post('/auth/register', data);
      console.log('[AuthContext] Registration successful');
      
      // Backend doesn't return tokens on register, so login immediately
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
      clearAllAuthCookies();
      setUser(null);
      // Use form submission for logout redirect too
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = '/login';
      form.style.display = 'none';
      document.body.appendChild(form);
      form.submit();
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