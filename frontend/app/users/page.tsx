'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserTable } from '@/components/ui/tables/UserTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  UserPlus, 
  Search, 
  Filter,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { 
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers
} from '@/src/store/thunks/userThunks';
import {
  setSearch,
  setFilters,
  clearFilters,
  setPage,
  setLimit,
  clearSelection
} from '@/src/store/slices/usersSlice';
import type { User } from '@/components/ui/tables/UserTable';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAuth();
  
  // Redux state
  const {
    users,
    userIds,
    pagination,
    filters,
    loading,
    errors,
    selectedUserIds
  } = useAppSelector(state => state.users);

  // Local state
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Transform users data for the table
  const usersList: User[] = userIds.map(id => {
    const user = users[id];
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as User['role'],
      department: user.departmentId, // This should be mapped to department name
      accessLevel: user.accessLevel as User['accessLevel'],
      status: user.status as User['status'],
      isOnline: false, // This should come from real-time data
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      permissions: user.permissions
    };
  });

  // Fetch users on mount and when filters change
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch, pagination.page, pagination.limit, filters]);

  // Handlers
  const handleSearch = useCallback((value: string) => {
    dispatch(setSearch(value));
  }, [dispatch]);

  const handleFilterChange = useCallback((type: string, value: any) => {
    dispatch(setFilters({ [type]: value }));
  }, [dispatch]);

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchUsers());
    setRefreshing(false);
  }, [dispatch]);

  const handleViewUser = useCallback((user: User) => {
    router.push(`/users/${user.id}`);
  }, [router]);

  const handleEditUser = useCallback((user: User) => {
    router.push(`/users/${user.id}?edit=true`);
  }, [router]);

  const handleDeleteUser = useCallback(async (user: User) => {
    if (user.id === currentUser?.id) {
      alert("You cannot delete your own account");
      return;
    }
    await dispatch(deleteUser(user.id)).unwrap();
  }, [dispatch, currentUser]);

  const handleResetPassword = useCallback(async (user: User) => {
    // Implement password reset logic
    console.log('Reset password for:', user.id);
  }, []);

  const handleToggleStatus = useCallback(async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await dispatch(updateUser({
      id: user.id,
      changes: { status: newStatus }
    })).unwrap();
  }, [dispatch]);

  const handleBulkExport = useCallback(async (userIds: string[], format: string) => {
    // Implement export logic
    console.log('Export users:', userIds, 'in format:', format);
  }, []);

  const handleBulkUpdateRole = useCallback(async (userIds: string[]) => {
    // Implement bulk role update logic
    console.log('Update roles for:', userIds);
  }, []);

  const handleBulkToggleStatus = useCallback(async (userIds: string[], status: 'active' | 'inactive') => {
    await dispatch(bulkUpdateUsers({
      userIds,
      changes: { status }
    })).unwrap();
  }, [dispatch]);

  const handleCreateUser = useCallback(() => {
    router.push('/users/new');
  }, [router]);

  const handleImportUsers = useCallback(() => {
    // Implement import logic
    console.log('Import users');
  }, []);

  const hasPermission = useCallback((permission: string) => {
    // Implement permission checking logic
    return currentUser?.role === 'ADMIN';
  }, [currentUser]);

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(filters.roles.length > 0 || 
              filters.departments.length > 0 || 
              filters.statuses.length > 0 || 
              filters.accessLevels.length > 0) && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                {filters.roles.length + 
                 filters.departments.length + 
                 filters.statuses.length + 
                 filters.accessLevels.length}
              </span>
            )}
          </Button>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              onClick={handleImportUsers}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>

            <Button
              variant="outline"
              onClick={() => handleBulkExport(userIds, 'csv')}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>

            <Button
              onClick={handleCreateUser}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create User
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                value={filters.roles[0] || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('roles', value === 'all' ? [] : [value])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="sales_manager">Sales Manager</SelectItem>
                  <SelectItem value="finance_manager">Finance Manager</SelectItem>
                  <SelectItem value="operations_manager">Operations Manager</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.statuses[0] || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('statuses', value === 'all' ? [] : [value])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.accessLevels[0]?.toString() || 'all'}
                onValueChange={(value) => 
                  handleFilterChange('accessLevels', value === 'all' ? [] : [parseInt(value)])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Access Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Access Levels</SelectItem>
                  <SelectItem value="1">Level 1 - Basic</SelectItem>
                  <SelectItem value="2">Level 2 - Standard</SelectItem>
                  <SelectItem value="3">Level 3 - Enhanced</SelectItem>
                  <SelectItem value="4">Level 4 - Manager</SelectItem>
                  <SelectItem value="5">Level 5 - Executive</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="text-gray-600"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedUserIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-900">
                {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(clearSelection())}
              >
                Clear Selection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkExport(selectedUserIds, 'csv')}
              >
                Export Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkUpdateRole(selectedUserIds)}
              >
                Update Roles
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleStatus(selectedUserIds, 'active')}
              >
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkToggleStatus(selectedUserIds, 'inactive')}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <UserTable
          users={usersList}
          onViewUser={handleViewUser}
          onEditUser={handleEditUser}
          onDeleteUser={handleDeleteUser}
          onResetPassword={handleResetPassword}
          onToggleStatus={handleToggleStatus}
          onBulkExport={handleBulkExport}
          onBulkUpdateRole={handleBulkUpdateRole}
          onBulkToggleStatus={handleBulkToggleStatus}
          hasPermission={hasPermission}
          loading={loading.list}
          error={errors.list}
          page={pagination.page}
          pageSize={pagination.limit}
          totalItems={pagination.total}
          onPageChange={(page) => dispatch(setPage(page))}
          onPageSizeChange={(size) => dispatch(setLimit(size))}
        />
      </div>
    </div>
  );
}