'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronRight, 
  ArrowLeft,
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Building,
  Clock,
  Edit,
  Trash2,
  Key,
  Ban,
  CheckCircle,
  Activity,
  Settings,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/atoms/Badge';
import { Avatar } from '@/components/ui/atoms/Avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { fetchUsers, deleteUser, updateUser } from '@/src/store/thunks/userThunks';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { tokens } from '@/lib/design-tokens';

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  ipAddress: string;
}

export default function UserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAuth();
  
  const userId = params.id as string;
  const isEditMode = searchParams.get('edit') === 'true';
  
  // Redux state
  const user = useAppSelector(state => state.users.users[userId]);
  const loading = useAppSelector(state => state.users.loading.list);
  
  // Local state
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Fetch user if not in store
  useEffect(() => {
    if (!user && userId) {
      dispatch(fetchUsers());
    }
  }, [dispatch, user, userId]);

  // Fetch user activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.get(`/users/${userId}/activities`);
        setActivities(response.data.data);
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setActivitiesLoading(false);
      }
    };

    if (userId) {
      fetchActivities();
    }
  }, [userId]);

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await api.get(`/users/${userId}/permissions`);
        setPermissions(response.data.data);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setPermissionsLoading(false);
      }
    };

    if (userId) {
      fetchPermissions();
    }
  }, [userId]);

  const handleEdit = () => {
    router.push(`/users/${userId}?edit=true`);
  };

  const handleDelete = async () => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account");
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${user?.fullName}? This action cannot be undone.`)) {
      await dispatch(deleteUser(userId)).unwrap();
      router.push('/users');
    }
  };

  const handleResetPassword = async () => {
    if (confirm(`Are you sure you want to reset the password for ${user?.fullName}?`)) {
      try {
        await api.post(`/users/${userId}/reset-password`);
        alert('Password reset email sent successfully');
      } catch (error) {
        console.error('Failed to reset password:', error);
        alert('Failed to reset password');
      }
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = user.status === 'active' ? 'deactivate' : 'activate';
    
    if (confirm(`Are you sure you want to ${action} ${user.fullName}?`)) {
      await dispatch(updateUser({
        id: userId,
        changes: { status: newStatus }
      })).unwrap();
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const roleConfig = {
    admin: { label: 'Administrator', color: tokens.colors.role.admin },
    sales_manager: { label: 'Sales Manager', color: tokens.colors.role.sales },
    finance_manager: { label: 'Finance Manager', color: tokens.colors.role.finance },
    operations_manager: { label: 'Operations Manager', color: tokens.colors.role.operations },
  };

  const statusConfig = {
    active: { label: 'Active', variant: 'success' as const, icon: CheckCircle },
    inactive: { label: 'Inactive', variant: 'secondary' as const, icon: Ban },
    suspended: { label: 'Suspended', variant: 'warning' as const, icon: AlertCircle },
  };

  const accessLevelConfig = {
    1: { label: 'Basic', description: 'View only' },
    2: { label: 'Standard', description: 'View & Edit' },
    3: { label: 'Enhanced', description: 'Full module access' },
    4: { label: 'Manager', description: 'Department control' },
    5: { label: 'Executive', description: 'Full system access' },
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600">
        <Link href="/admin" className="hover:text-gray-900">
          Admin
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/users" className="hover:text-gray-900">
          Users
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{user.fullName}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/users')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            <Avatar
              src={user.avatarUrl}
              alt={user.fullName}
              fallback={user.fullName?.substring(0, 2).toUpperCase()}
              size="lg"
              status={user.status === 'active' ? 'online' : 'offline'}
            />
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge 
                  variant="custom"
                  style={{ 
                    backgroundColor: `${roleConfig[user.role]?.color}20`,
                    color: roleConfig[user.role]?.color,
                    border: `1px solid ${roleConfig[user.role]?.color}40`
                  }}
                >
                  {roleConfig[user.role]?.label}
                </Badge>
                <Badge variant={statusConfig[user.status].variant}>
                  {statusConfig[user.status].label}
                </Badge>
                <Badge variant="outline">
                  Level {user.accessLevel}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetPassword}
                className="gap-2"
              >
                <Key className="w-4 h-4" />
                Reset Password
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              className="gap-2"
            >
              {user.status === 'active' ? (
                <>
                  <Ban className="w-4 h-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Activate
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            
            {userId !== currentUser?.id && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{user.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{user.departmentId || 'Not assigned'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Access Level</p>
                  <p className="font-medium">
                    Level {user.accessLevel} - {accessLevelConfig[user.accessLevel].description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Last Login</p>
                  <p className="font-medium">
                    {user.lastLoginAt 
                      ? new Date(user.lastLoginAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="font-medium">
                    {new Date(user.updatedAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Permissions</CardTitle>
              <CardDescription>
                Permissions granted to this user based on their role and custom assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : permissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissions.map((permission) => (
                    <div key={permission} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{permission}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No custom permissions assigned
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                User actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                      <Activity className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.details}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>{new Date(activity.timestamp).toLocaleString()}</span>
                          <span>IP: {activity.ipAddress}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No activity recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Settings</CardTitle>
              <CardDescription>
                Manage user preferences and configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to the account
                    </p>
                  </div>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600">
                      Receive email updates about account activity
                    </p>
                  </div>
                  <Badge variant="success">Enabled</Badge>
                </div>
                
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">API Access</p>
                    <p className="text-sm text-gray-600">
                      Allow programmatic access to the account
                    </p>
                  </div>
                  <Badge variant="secondary">Disabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}