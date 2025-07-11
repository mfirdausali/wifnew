import api from '../api';
import { 
  User, 
  CreateUserDTO, 
  UpdateUserDTO, 
  ExportOptions, 
  ImportOptions,
  ImportResult,
  ApiResponse,
  PaginationMeta 
} from '@/src/types';

export interface ListUsersParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  roles?: string[];
  departments?: string[];
  statuses?: string[];
  accessLevels?: number[];
}

export interface BulkUpdateData {
  userIds: string[];
  changes: Partial<User>;
}

export const userService = {
  // List users
  async listUsers(params: ListUsersParams): Promise<ApiResponse<User[]>> {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get single user
  async getUser(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },

  // Create user
  async createUser(data: CreateUserDTO): Promise<User> {
    const response = await api.post('/users', data);
    return response.data.data;
  },

  // Update user
  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    const response = await api.patch(`/users/${id}`, data);
    return response.data.data;
  },

  // Delete user
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  // Bulk update users
  async bulkUpdateUsers(data: BulkUpdateData): Promise<User[]> {
    const response = await api.patch('/users/bulk', data);
    return response.data.data;
  },

  // Export users
  async exportUsers(options: ExportOptions): Promise<Blob> {
    const response = await api.post('/users/export', options, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Import users
  async importUsers(file: File, options: ImportOptions): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    const response = await api.post('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  },

  // Reset user password
  async resetUserPassword(userId: string, method: 'email' | 'manual' | 'temporary' = 'email'): Promise<any> {
    const response = await api.post(`/users/${userId}/reset-password`, { method });
    return response.data.data;
  },

  // Update user status
  async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended', reason?: string): Promise<User> {
    const response = await api.patch(`/users/${userId}/status`, { status, reason });
    return response.data.data;
  },

  // Get user sessions
  async getUserSessions(userId: string): Promise<any[]> {
    const response = await api.get(`/users/${userId}/sessions`);
    return response.data.data;
  },

  // Get user activities
  async getUserActivities(userId: string): Promise<any[]> {
    const response = await api.get(`/users/${userId}/activities`);
    return response.data.data;
  },

  // Get user permissions
  async getUserPermissions(userId: string): Promise<string[]> {
    const response = await api.get(`/users/${userId}/permissions`);
    return response.data.data;
  }
};