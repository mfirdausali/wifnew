'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

export default function WorkingLoginPage() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Clear any existing cookies
    ['accessToken', 'refreshToken', 'refresh-token', 'access-token'].forEach(name => {
      Cookies.remove(name);
      Cookies.remove(name, { path: '/' });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setLoading(true);
    
    try {
      // Direct API call
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-request-id': `req-${Date.now()}`,
          'x-request-time': new Date().toISOString()
        }
      });
      
      const { user, tokens } = response.data.data;
      const { accessToken, refreshToken } = tokens;
      
      // Set cookies
      Cookies.set('accessToken', accessToken, {
        path: '/',
        expires: 1,
        sameSite: 'lax',
        secure: false
      });
      
      Cookies.set('refreshToken', refreshToken, {
        path: '/',
        expires: 7,
        sameSite: 'lax',
        secure: false
      });
      
      // Determine redirect path based on role
      let redirectPath = '/dashboard';
      switch (user.role) {
        case 'ADMIN':
          redirectPath = '/admin';
          break;
        case 'SALES_MANAGER':
          redirectPath = '/sales';
          break;
        case 'FINANCE_MANAGER':
          redirectPath = '/finance';
          break;
        case 'OPERATIONS_MANAGER':
          redirectPath = '/operations';
          break;
      }
      
      // Redirect using window.location
      window.location.href = redirectPath;
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Login failed');
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Working Login</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>This is a working login page that bypasses all providers.</p>
          <p>Use this while the main login is being fixed.</p>
        </div>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';