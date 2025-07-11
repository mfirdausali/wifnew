import { apiClient, API_ENDPOINTS } from './client';
import { 
  ApiResponse,
  Permission,
  PermissionGroup,
  UserRole,
  UserPermission,
  ValidationResult
} from './types';

export interface UpdateUserPermissionsData {
  permissions: string[];
  reason?: string;
  expiresAt?: Date;
}

export class PermissionService {
  // Get all permissions
  async getPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<ApiResponse<Permission[]>>(
      API_ENDPOINTS.permissions.list
    );
    
    return response.data.data;
  }
  
  // Get permission groups
  async getPermissionGroups(): Promise<PermissionGroup[]> {
    const response = await apiClient.get<ApiResponse<PermissionGroup[]>>(
      API_ENDPOINTS.permissions.groups
    );
    
    return response.data.data;
  }
  
  // Get role permissions
  async getRolePermissions(): Promise<Record<UserRole, Permission[]>> {
    const response = await apiClient.get<ApiResponse<Record<UserRole, Permission[]>>>(
      API_ENDPOINTS.permissions.roles
    );
    
    return response.data.data;
  }
  
  // Get user permissions
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    const response = await apiClient.get<ApiResponse<UserPermission[]>>(
      API_ENDPOINTS.permissions.userPermissions(userId)
    );
    
    return response.data.data;
  }
  
  // Update user permissions
  async updateUserPermissions(
    userId: string,
    data: UpdateUserPermissionsData
  ): Promise<UserPermission[]> {
    const response = await apiClient.put<ApiResponse<UserPermission[]>>(
      API_ENDPOINTS.permissions.updateUserPermissions(userId),
      data
    );
    
    return response.data.data;
  }
  
  // Check user permission
  async checkUserPermission(
    userId: string,
    permission: string
  ): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<{ hasPermission: boolean }>>(
      API_ENDPOINTS.permissions.check,
      { userId, permission }
    );
    
    return response.data.data.hasPermission;
  }
  
  // Get permission dependencies
  async getPermissionDependencies(permissionId: string): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      API_ENDPOINTS.permissions.dependencies(permissionId)
    );
    
    return response.data.data;
  }
  
  // Validate permission set
  async validatePermissions(permissions: string[]): Promise<ValidationResult> {
    const response = await apiClient.post<ApiResponse<ValidationResult>>(
      API_ENDPOINTS.permissions.validate,
      { permissions }
    );
    
    return response.data.data;
  }
}

export const permissionService = new PermissionService();