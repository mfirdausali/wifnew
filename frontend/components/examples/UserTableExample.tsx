'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { UserTable } from '../ui/tables';
import { Button } from '../ui/atoms/Button';
import { PlusIcon, RefreshIcon } from 'lucide-react';
import type { User } from '../ui/tables/UserTable';

// Mock data generator
const generateMockUsers = (count: number): User[] => {
  const roles = ['admin', 'sales_manager', 'finance_manager', 'operations_manager', 'employee'] as const;
  const departments = ['Sales', 'Finance', 'Operations', 'HR', 'IT', 'Marketing'];
  const statuses = ['active', 'inactive', 'suspended', 'pending'] as const;

  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    email: `user${i + 1}@company.com`,
    fullName: `User ${i + 1}`,
    firstName: `User`,
    lastName: `${i + 1}`,
    avatar: i % 3 === 0 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}` : undefined,
    initials: `U${i + 1}`,
    role: roles[i % roles.length],
    department: departments[i % departments.length],
    accessLevel: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    status: statuses[i % statuses.length],
    statusReason: i % 4 === 3 ? 'Account under review' : undefined,
    isOnline: i % 2 === 0,
    lastLoginAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    permissions: [],
  }));
};

export function UserTableExample() {
  // Generate a large dataset for testing
  const allUsers = useMemo(() => generateMockUsers(10000), []);
  
  // State
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState(allUsers.slice(0, 100)); // Start with first 100
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<string>('fullName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Calculate paginated data
  const filteredUsers = useMemo(() => {
    let result = [...allUsers];
    
    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }
    
    if (filters.role) {
      result = result.filter(user => user.role === filters.role);
    }
    
    if (filters.status) {
      result = result.filter(user => user.status === filters.status);
    }
    
    if (filters.accessLevel) {
      result = result.filter(user => user.accessLevel === parseInt(filters.accessLevel));
    }
    
    return result;
  }, [allUsers, filters]);

  const totalItems = filteredUsers.length;

  // Handlers
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setUsers(generateMockUsers(100));
    setLoading(false);
  }, []);

  const handleViewUser = useCallback((user: User) => {
    console.log('View user:', user);
    alert(`Viewing details for ${user.fullName}`);
  }, []);

  const handleEditUser = useCallback((user: User) => {
    console.log('Edit user:', user);
    alert(`Editing ${user.fullName}`);
  }, []);

  const handleDeleteUser = useCallback(async (user: User) => {
    console.log('Delete user:', user);
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUsers(prev => prev.filter(u => u.id !== user.id));
    setLoading(false);
  }, []);

  const handleResetPassword = useCallback((user: User) => {
    console.log('Reset password for:', user);
    alert(`Password reset email sent to ${user.email}`);
  }, []);

  const handleToggleStatus = useCallback(async (user: User) => {
    console.log('Toggle status for:', user);
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUsers(prev => prev.map(u => 
      u.id === user.id 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } as User
        : u
    ));
    setLoading(false);
  }, []);

  const handleBulkExport = useCallback((userIds: string[], format: string) => {
    console.log('Export users:', userIds, 'Format:', format);
    alert(`Exporting ${userIds.length} users as ${format}`);
  }, []);

  const handleBulkUpdateRole = useCallback((userIds: string[]) => {
    console.log('Update role for users:', userIds);
    alert(`Opening role update modal for ${userIds.length} users`);
  }, []);

  const handleBulkToggleStatus = useCallback(async (userIds: string[], status: 'active' | 'inactive') => {
    console.log('Toggle status for users:', userIds, 'to:', status);
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUsers(prev => prev.map(u => 
      userIds.includes(u.id) 
        ? { ...u, status } as User
        : u
    ));
    setSelectedUsers([]);
    setLoading(false);
  }, []);

  const handleSort = useCallback((column: string, order: 'asc' | 'desc') => {
    setSortBy(column);
    setSortOrder(order);
  }, []);

  // Mock permission check
  const hasPermission = useCallback((permission: string) => {
    // In a real app, this would check actual user permissions
    return true;
  }, []);

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={RefreshIcon}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => alert('Add new user')}
          >
            Add User
          </Button>
        </div>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        loading={loading}
        
        // Selection
        selectedRows={selectedUsers}
        onSelectionChange={setSelectedUsers}
        
        // Sorting
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        
        // Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        
        // Filtering
        activeFilters={filters}
        onFilterChange={setFilters}
        
        // Actions
        onViewUser={handleViewUser}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onResetPassword={handleResetPassword}
        onToggleStatus={handleToggleStatus}
        onBulkExport={handleBulkExport}
        onBulkUpdateRole={handleBulkUpdateRole}
        onBulkToggleStatus={handleBulkToggleStatus}
        
        // Permissions
        hasPermission={hasPermission}
        
        // Other options
        onRefresh={handleRefresh}
        virtual={users.length > 100} // Enable virtual scrolling for large datasets
        containerHeight={600}
      />

      {/* Demo Controls */}
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Controls</h3>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setUsers(allUsers.slice(0, 10))}
          >
            Load 10 users
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setUsers(allUsers.slice(0, 100))}
          >
            Load 100 users
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setUsers(allUsers.slice(0, 1000))}
          >
            Load 1,000 users
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setUsers(allUsers)}
          >
            Load all 10,000 users (virtual scroll)
          </Button>
        </div>
      </div>
    </div>
  );
}