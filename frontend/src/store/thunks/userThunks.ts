import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { 
  User, 
  CreateUserDTO, 
  UpdateUserDTO, 
  ExportOptions, 
  ImportOptions,
  ApiResponse,
  PaginationMeta 
} from '@/types';
import { userService, ListUsersParams, BulkUpdateData } from '@/lib/api';

// Fetch users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { pagination, filters, sorting } = state.users;
    
    const params: ListUsersParams = {
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sorting.field,
      sortOrder: sorting.order as 'asc' | 'desc',
      search: filters.search,
      roles: filters.roles as any[],
      departments: filters.departments,
      statuses: filters.statuses as any[],
      accessLevels: filters.accessLevels,
    };
    
    return await userService.listUsers(params);
  }
);

// Create user
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserDTO) => {
    return await userService.createUser(userData);
  }
);

// Update user
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, changes }: { id: string; changes: UpdateUserDTO }) => {
    return await userService.updateUser(id, changes);
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: string) => {
    await userService.deleteUser(id);
    return id;
  }
);

// Bulk update users
export const bulkUpdateUsers = createAsyncThunk(
  'users/bulkUpdateUsers',
  async ({ userIds, changes }: { userIds: string[]; changes: Partial<User> }) => {
    const bulkData: BulkUpdateData = {
      userIds,
      changes,
    };
    return await userService.bulkUpdateUsers(bulkData);
  }
);

// Export users
export const exportUsers = createAsyncThunk(
  'users/exportUsers',
  async (options: ExportOptions) => {
    const blob = await userService.exportUsers(options);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users_export_${Date.now()}.${options.format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  }
);

// Import users
export const importUsers = createAsyncThunk(
  'users/importUsers',
  async ({ file, options }: { file: File; options: ImportOptions }) => {
    return await userService.importUsers(file, options);
  }
);

// Reset user password
export const resetUserPassword = createAsyncThunk(
  'users/resetPassword',
  async ({ userId, method = 'email' }: { userId: string; method?: 'email' | 'manual' | 'temporary' }) => {
    return await userService.resetUserPassword(userId, method);
  }
);

// Update user status
export const updateUserStatus = createAsyncThunk(
  'users/updateStatus',
  async ({ userId, status, reason }: { userId: string; status: 'active' | 'inactive' | 'suspended'; reason?: string }) => {
    return await userService.updateUserStatus(userId, status, reason);
  }
);

// Fetch user sessions
export const fetchUserSessions = createAsyncThunk(
  'users/fetchSessions',
  async (userId: string) => {
    return await userService.getUserSessions(userId);
  }
);