import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { setupInterceptors } from './interceptors';

// Configuration interface
interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  withCredentials: boolean;
  retryConfig?: {
    retries: number;
    retryDelay: number;
    retryCondition?: (error: any) => boolean;
  };
}

// Default configuration
const defaultConfig: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  withCredentials: true,
  retryConfig: {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      return (
        error.code === 'ECONNABORTED' ||
        error.response?.status >= 500 ||
        !error.response
      );
    },
  },
};

// Create API client factory
export function createApiClient(config: Partial<ApiConfig> = {}): AxiosInstance {
  const finalConfig = { ...defaultConfig, ...config };
  
  const client = axios.create({
    baseURL: finalConfig.baseURL,
    timeout: finalConfig.timeout,
    headers: finalConfig.headers,
    withCredentials: finalConfig.withCredentials,
  });
  
  // Setup interceptors
  setupInterceptors(client, finalConfig.retryConfig);
  
  return client;
}

// Default API client instance
export const apiClient = createApiClient();

// Specialized clients
export const authClient = createApiClient({
  baseURL: `${defaultConfig.baseURL}/auth`,
  timeout: 10000,
});

export const fileClient = createApiClient({
  baseURL: `${defaultConfig.baseURL}/files`,
  timeout: 300000, // 5 minutes for file uploads
  headers: {
    ...defaultConfig.headers,
    'Content-Type': 'multipart/form-data',
  },
});

// API endpoints configuration
export const API_ENDPOINTS = {
  // Users
  users: {
    list: '/users',
    detail: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    bulkUpdate: '/users/bulk-update',
    bulkDelete: '/users/bulk-delete',
    export: '/users/export',
    import: '/users/import',
    updateStatus: (id: string) => `/users/${id}/status`,
    updateRole: (id: string) => `/users/${id}/role`,
    resetPassword: (id: string) => `/users/${id}/reset-password`,
    sessions: (id: string) => `/users/${id}/sessions`,
    activities: (id: string) => `/users/${id}/activities`,
    permissions: (id: string) => `/users/${id}/permissions`,
    checkEmail: '/users/check-email',
    suggestions: '/users/suggestions',
  },
  
  // Permissions
  permissions: {
    list: '/permissions',
    groups: '/permissions/groups',
    roles: '/permissions/roles',
    userPermissions: (userId: string) => `/permissions/users/${userId}`,
    updateUserPermissions: (userId: string) => `/permissions/users/${userId}`,
    check: '/permissions/check',
    validate: '/permissions/validate',
    dependencies: (id: string) => `/permissions/${id}/dependencies`,
  },
  
  // Departments
  departments: {
    list: '/departments',
    tree: '/departments/tree',
    detail: (id: string) => `/departments/${id}`,
    create: '/departments',
    update: (id: string) => `/departments/${id}`,
    delete: (id: string) => `/departments/${id}`,
    members: (id: string) => `/departments/${id}/members`,
    move: (id: string) => `/departments/${id}/move`,
    stats: (id: string) => `/departments/${id}/stats`,
  },
  
  // Activities
  activities: {
    list: '/activities',
    userActivities: (userId: string) => `/activities/users/${userId}`,
    export: '/activities/export',
    stats: '/activities/stats',
    timeline: '/activities/timeline',
  },
  
  // Files
  files: {
    upload: '/upload',
    download: (id: string) => `/download/${id}`,
    avatar: '/upload/avatar',
    delete: (id: string) => `/files/${id}`,
  },
  
  // Auth
  auth: {
    login: '/login',
    logout: '/logout',
    refresh: '/refresh',
    me: '/me',
    updatePassword: '/update-password',
  },
} as const;