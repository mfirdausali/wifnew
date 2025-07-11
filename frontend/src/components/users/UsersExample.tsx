'use client';

import React from 'react';
import { useUsers } from '@/hooks/useUsers';
import { useUI } from '@/hooks/useUI';
import { CreateUserDTO } from '@/types';

/**
 * Example component showing how to use the Redux store for user management
 */
export const UsersExample: React.FC = () => {
  const {
    users,
    loading,
    pagination,
    filters,
    selectedIds,
    setSearch,
    setPage,
    toggleSelection,
    createUser,
    updateUser,
    deleteUser,
  } = useUsers();

  const { openModal, showSuccess, showError } = useUI();

  // Handle create user
  const handleCreateUser = async () => {
    const userData: CreateUserDTO = {
      email: 'newuser@example.com',
      fullName: 'New User',
      firstName: 'New',
      lastName: 'User',
      role: 'sales_manager',
      departmentId: 'dept-1',
    };

    const success = await createUser(userData);
    if (success) {
      showSuccess('User created successfully!');
    } else {
      showError('Failed to create user');
    }
  };

  // Handle update user
  const handleUpdateUser = async (userId: string) => {
    const success = await updateUser(userId, {
      status: 'active',
    });
    
    if (success) {
      showSuccess('User updated successfully!');
    } else {
      showError('Failed to update user');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser(userId);
    
    if (success) {
      showSuccess('User deleted successfully!');
    } else {
      showError('Failed to delete user');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Users Management Example</h1>
      
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search users..."
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded"
        />
      </div>

      {/* Actions */}
      <div className="mb-4 space-x-2">
        <button
          onClick={handleCreateUser}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create User
        </button>
        <button
          onClick={() => openModal('createUser')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Open Create Modal
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mb-4">Loading users...</div>
      )}

      {/* Users list */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Users ({pagination.total})</h2>
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className={`p-3 border rounded ${
                selectedIds.includes(user.id) ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    onChange={() => toggleSelection(user.id)}
                    className="mr-2"
                  />
                  <span className="font-medium">{user.fullName}</span>
                  <span className="text-gray-500 ml-2">({user.email})</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded">
                    {user.role}
                  </span>
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => handleUpdateUser(user.id)}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setPage(pagination.page - 1)}
          disabled={!pagination.hasPrevPage}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <button
          onClick={() => setPage(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};