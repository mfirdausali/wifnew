// Export API client and configuration
export { apiClient, authClient, fileClient, API_ENDPOINTS } from './client';
export { request, RequestBuilder, defaultRequestOptions } from './config';
export type { RequestOptions } from './config';

// Export services
export { authService } from './auth';
export { userService } from './usersApi';
export { permissionService } from './permissionsApi';
export { departmentService } from './departmentsApi';
export { activityService } from './activityApi';
export { fileService } from './filesApi';

// Export types
export * from './types';
export type { ListUsersParams, BulkUpdateData } from './usersApi';
export type { UpdateUserPermissionsData } from './permissionsApi';
export type { UpdateDepartmentData } from './departmentsApi';
export type { ListActivitiesParams } from './activityApi';
export type { UploadOptions } from './filesApi';

// Export error handler
export { errorHandler } from './errorHandler';
export type { ApiError, ApiErrorResponse } from './errorHandler';

// Export token manager
export { TokenManager } from './tokenManager';

// Export transformers
export * from './transformers/user';
export * from './transformers/generic';

// Export setup
export { setupApiErrorHandler } from './setup';

// Re-export commonly used types from main types file
export type { 
  User,
  UserRole,
  UserStatus,
  Department,
  Permission,
  ActivityLog
} from '@/types';