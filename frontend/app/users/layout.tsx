'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { ChevronRight, Users, Activity, Shield, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAppSelector } from '@/src/store';

interface UsersLayoutProps {
  children: ReactNode;
}

export default function UsersLayout({ children }: UsersLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Get stats from Redux store
  const { pagination, loading: usersLoading } = useAppSelector(state => state.users);
  const totalUsers = pagination.total;
  const activeUsers = useAppSelector(state => 
    Object.values(state.users.users).filter(user => user.status === 'active').length
  );

  useEffect(() => {
    // Redirect if not admin
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if user is not authorized
  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/admin" className="hover:text-gray-900">
            Admin
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Users</span>
        </nav>

        {/* Page Header with Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">
                Manage system users, roles, permissions, and access levels
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {usersLoading ? '...' : totalUsers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {usersLoading ? '...' : activeUsers}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Departments</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">5</p>
                </div>
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Avg. Access Level</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">3.2</p>
                </div>
                <Settings className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {children}
      </div>
    </DashboardLayout>
  );
}