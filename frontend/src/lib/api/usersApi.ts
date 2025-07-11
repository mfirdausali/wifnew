import { apiClient, API_ENDPOINTS } from './client';
import { 
  PaginatedResponse, 
  ApiResponse,
  User,
  UserRole,
  UserStatus,
  CreateUserDTO,
  UpdateUserDTO,
  UserSession,
  UserSuggestion,
  ExportOptions,
  ImportOptions,
  ImportResult,
  ExportFormat
} from './types';
import { transformUser, transformUserInput } from './transformers/user';

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  roles?: UserRole[];
  departments?: string[];
  statuses?: UserStatus[];
  accessLevels?: number[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  include?: string[];
}

export interface BulkUpdateData {
  userIds: string[];
  changes: Partial<UpdateUserDTO> & {
    status?: UserStatus;
    role?: UserRole;
    accessLevel?: number;
  };
}

export class UserService {
  // List users with pagination
  async listUsers(params: ListUsersParams = {}): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<ApiResponse<User[]>>(
      API_ENDPOINTS.users.list,
      { params }
    );
    
    return {
      data: response.data.data.map(transformUser),
      meta: response.data.meta!,
    };
  }
  
  // Get single user
  async getUser(id: string, include?: string[]): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(
      API_ENDPOINTS.users.detail(id),
      { params: { include } }
    );
    
    return transformUser(response.data.data);
  }
  
  // Create user
  async createUser(data: CreateUserDTO): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      API_ENDPOINTS.users.create,
      transformUserInput(data)
    );
    
    return transformUser(response.data.data);
  }
  
  // Update user
  async updateUser(id: string, data: UpdateUserDTO): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>(
      API_ENDPOINTS.users.update(id),
      transformUserInput(data)
    );
    
    return transformUser(response.data.data);
  }
  
  // Delete user
  async deleteUser(id: string, reassignTo?: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.users.delete(id), {
      params: { reassignTo },
    });
  }
  
  // Bulk update users
  async bulkUpdateUsers(data: BulkUpdateData): Promise<User[]> {
    const response = await apiClient.post<ApiResponse<User[]>>(
      API_ENDPOINTS.users.bulkUpdate,
      {
        userIds: data.userIds,
        changes: transformUserInput(data.changes),
      }
    );
    
    return response.data.data.map(transformUser);
  }
  
  // Bulk delete users
  async bulkDeleteUsers(userIds: string[], reassignTo?: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.users.bulkDelete, {
      userIds,
      reassignTo,
    });
  }
  
  // Update user status
  async updateUserStatus(
    id: string,
    status: UserStatus,
    reason?: string,
    suspensionEndDate?: Date
  ): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      API_ENDPOINTS.users.updateStatus(id),
      {
        status,
        reason,
        suspensionEndDate,
      }
    );
    
    return transformUser(response.data.data);
  }
  
  // Update user role
  async updateUserRole(
    id: string,
    role: UserRole,
    accessLevel: number
  ): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(
      API_ENDPOINTS.users.updateRole(id),
      {
        role,
        accessLevel,
      }
    );
    
    return transformUser(response.data.data);
  }
  
  // Reset user password
  async resetUserPassword(
    id: string,
    method: 'email' | 'manual' | 'temporary',
    newPassword?: string
  ): Promise<{ message: string; temporaryPassword?: string }> {
    const response = await apiClient.post<ApiResponse<any>>(
      API_ENDPOINTS.users.resetPassword(id),
      {
        method,
        newPassword,
      }
    );
    
    return response.data.data;
  }
  
  // Get user sessions
  async getUserSessions(id: string): Promise<UserSession[]> {
    const response = await apiClient.get<ApiResponse<UserSession[]>>(
      API_ENDPOINTS.users.sessions(id)
    );
    
    return response.data.data;
  }
  
  // Terminate user session
  async terminateUserSession(userId: string, sessionId: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.users.sessions(userId)}/${sessionId}`);
  }
  
  // Export users
  async exportUsers(options: ExportOptions): Promise<Blob> {
    const response = await apiClient.post(
      API_ENDPOINTS.users.export,
      options,
      {
        responseType: 'blob',
        headers: {
          'Accept': getMimeType(options.format),
        },
      }
    );
    
    return response.data;
  }
  
  // Import users
  async importUsers(
    file: File,
    options: ImportOptions
  ): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    const response = await apiClient.post<ApiResponse<ImportResult>>(
      API_ENDPOINTS.users.import,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.data;
  }
  
  // Check email availability
  async checkEmailAvailability(email: string, excludeUserId?: string): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<{ available: boolean }>>(
      API_ENDPOINTS.users.checkEmail,
      { email, excludeUserId }
    );
    
    return response.data.data.available;
  }
  
  // Get user suggestions (for autocomplete)
  async getUserSuggestions(
    query: string,
    options?: {
      limit?: number;
      roles?: UserRole[];
      departments?: string[];
      exclude?: string[];
    }
  ): Promise<UserSuggestion[]> {
    const response = await apiClient.get<ApiResponse<UserSuggestion[]>>(
      API_ENDPOINTS.users.suggestions,
      {
        params: {
          q: query,
          ...options,
        },
      }
    );
    
    return response.data.data;
  }
}

// Helper function to get MIME type
function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'csv':
      return 'text/csv';
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'json':
      return 'application/json';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

// Singleton instance
export const userService = new UserService();