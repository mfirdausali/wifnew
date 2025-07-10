'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to role-specific dashboard
      switch (user.role) {
        case 'ADMIN':
          router.push('/admin');
          break;
        case 'SALES':
          router.push('/sales');
          break;
        case 'FINANCE':
          router.push('/finance');
          break;
        case 'OPERATIONS':
          router.push('/operations');
          break;
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Dashboard</CardTitle>
          <CardDescription>
            Redirecting to your role-specific dashboard...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please wait while we redirect you to the appropriate dashboard.</p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}