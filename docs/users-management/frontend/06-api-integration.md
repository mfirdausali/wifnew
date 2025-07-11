# Users Management - API Integration Detailed Specification

## Overview
This document provides comprehensive specifications for API integration in the Users Management feature, including API clients, interceptors, error handling, request/response transformations, and real-time updates.

## Table of Contents
1. [API Client Configuration](#api-client-configuration)
2. [Authentication & Interceptors](#authentication--interceptors)
3. [User API Service](#user-api-service)
4. [Permission API Service](#permission-api-service)
5. [Department API Service](#department-api-service)
6. [Activity API Service](#activity-api-service)
7. [File Upload Service](#file-upload-service)
8. [WebSocket Integration](#websocket-integration)
9. [Error Handling](#error-handling)
10. [Request/Response Transformations](#requestresponse-transformations)

---

## 1. API Client Configuration

### 1.1 Base Axios Instance
```typescript
// services/api/client.ts
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
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
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
  },
  
  // Permissions
  permissions: {
    list: '/permissions',
    groups: '/permissions/groups',
    roles: '/permissions/roles',
    userPermissions: (userId: string) => `/permissions/users/${userId}`,
    updateUserPermissions: (userId: string) => `/permissions/users/${userId}`,
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
  },
  
  // Activities
  activities: {
    list: '/activities',
    userActivities: (userId: string) => `/activities/users/${userId}`,
    export: '/activities/export',
  },
  
  // Files
  files: {
    upload: '/upload',
    download: (id: string) => `/download/${id}`,
    avatar: '/upload/avatar',
  },
} as const;
```

### 1.2 Request Configuration Helpers
```typescript
// services/api/config.ts
export interface RequestOptions extends AxiosRequestConfig {
  skipAuth?: boolean;
  cache?: boolean;
  cacheTime?: number;
  retry?: boolean;
  retryCount?: number;
  transform?: boolean;
  showError?: boolean;
}

export const defaultRequestOptions: RequestOptions = {
  skipAuth: false,
  cache: false,
  cacheTime: 5 * 60 * 1000, // 5 minutes
  retry: true,
  retryCount: 3,
  transform: true,
  showError: true,
};

// Request builder
export class RequestBuilder {
  private config: AxiosRequestConfig = {};
  private options: RequestOptions = { ...defaultRequestOptions };
  
  method(method: string): this {
    this.config.method = method;
    return this;
  }
  
  url(url: string): this {
    this.config.url = url;
    return this;
  }
  
  data(data: any): this {
    this.config.data = data;
    return this;
  }
  
  params(params: Record<string, any>): this {
    this.config.params = params;
    return this;
  }
  
  headers(headers: Record<string, string>): this {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }
  
  option(key: keyof RequestOptions, value: any): this {
    this.options[key] = value;
    return this;
  }
  
  build(): [AxiosRequestConfig, RequestOptions] {
    return [this.config, this.options];
  }
}

// Request factory
export const request = {
  get: (url: string) => new RequestBuilder().method('GET').url(url),
  post: (url: string, data?: any) => new RequestBuilder().method('POST').url(url).data(data),
  put: (url: string, data?: any) => new RequestBuilder().method('PUT').url(url).data(data),
  patch: (url: string, data?: any) => new RequestBuilder().method('PATCH').url(url).data(data),
  delete: (url: string) => new RequestBuilder().method('DELETE').url(url),
};
```

---

## 2. Authentication & Interceptors

### 2.1 Authentication Service
```typescript
// services/api/auth.ts
import { apiClient } from './client';
import { TokenManager } from './tokenManager';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export class AuthService {
  private tokenManager: TokenManager;
  private refreshPromise: Promise<AuthTokens> | null = null;
  
  constructor() {
    this.tokenManager = new TokenManager();
  }
  
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await apiClient.post<AuthTokens>('/auth/login', credentials);
    const tokens = response.data;
    
    this.tokenManager.setTokens(tokens);
    
    if (credentials.rememberMe) {
      this.tokenManager.enablePersistence();
    }
    
    return tokens;
  }
  
  async logout(): Promise<void> {
    try {
      const refreshToken = this.tokenManager.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } finally {
      this.tokenManager.clearTokens();
    }
  }
  
  async refreshTokens(): Promise<AuthTokens> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    const refreshToken = this.tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    this.refreshPromise = apiClient
      .post<AuthTokens>('/auth/refresh', { refreshToken })
      .then((response) => {
        const tokens = response.data;
        this.tokenManager.setTokens(tokens);
        this.refreshPromise = null;
        return tokens;
      })
      .catch((error) => {
        this.refreshPromise = null;
        this.tokenManager.clearTokens();
        throw error;
      });
    
    return this.refreshPromise;
  }
  
  isAuthenticated(): boolean {
    return this.tokenManager.hasValidToken();
  }
  
  getAccessToken(): string | null {
    return this.tokenManager.getAccessToken();
  }
}

export const authService = new AuthService();
```

### 2.2 Token Manager
```typescript
// services/api/tokenManager.ts
interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';
  private static EXPIRES_AT_KEY = 'expires_at';
  private static PERSISTENCE_KEY = 'auth_persistence';
  
  private storage: Storage = sessionStorage;
  
  constructor() {
    // Check if persistence is enabled
    if (localStorage.getItem(TokenManager.PERSISTENCE_KEY) === 'true') {
      this.storage = localStorage;
    }
  }
  
  setTokens(tokens: AuthTokens): void {
    const expiresAt = Date.now() + tokens.expiresIn * 1000;
    
    this.storage.setItem(TokenManager.ACCESS_TOKEN_KEY, tokens.accessToken);
    this.storage.setItem(TokenManager.REFRESH_TOKEN_KEY, tokens.refreshToken);
    this.storage.setItem(TokenManager.EXPIRES_AT_KEY, expiresAt.toString());
  }
  
  getAccessToken(): string | null {
    return this.storage.getItem(TokenManager.ACCESS_TOKEN_KEY);
  }
  
  getRefreshToken(): string | null {
    return this.storage.getItem(TokenManager.REFRESH_TOKEN_KEY);
  }
  
  hasValidToken(): boolean {
    const accessToken = this.getAccessToken();
    const expiresAt = this.storage.getItem(TokenManager.EXPIRES_AT_KEY);
    
    if (!accessToken || !expiresAt) {
      return false;
    }
    
    // Check if token is expired (with 1 minute buffer)
    return Date.now() < parseInt(expiresAt) - 60000;
  }
  
  clearTokens(): void {
    this.storage.removeItem(TokenManager.ACCESS_TOKEN_KEY);
    this.storage.removeItem(TokenManager.REFRESH_TOKEN_KEY);
    this.storage.removeItem(TokenManager.EXPIRES_AT_KEY);
    
    // Clear from both storages to be safe
    sessionStorage.removeItem(TokenManager.ACCESS_TOKEN_KEY);
    localStorage.removeItem(TokenManager.ACCESS_TOKEN_KEY);
  }
  
  enablePersistence(): void {
    localStorage.setItem(TokenManager.PERSISTENCE_KEY, 'true');
    
    // Move tokens to localStorage
    const tokens = this.getStoredTokens();
    if (tokens) {
      this.storage = localStorage;
      this.setTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: Math.max(0, (tokens.expiresAt - Date.now()) / 1000),
      });
    }
  }
  
  disablePersistence(): void {
    localStorage.removeItem(TokenManager.PERSISTENCE_KEY);
    
    // Move tokens to sessionStorage
    const tokens = this.getStoredTokens();
    if (tokens) {
      this.storage = sessionStorage;
      this.setTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: Math.max(0, (tokens.expiresAt - Date.now()) / 1000),
      });
    }
  }
  
  private getStoredTokens(): StoredTokens | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();
    const expiresAt = this.storage.getItem(TokenManager.EXPIRES_AT_KEY);
    
    if (!accessToken || !refreshToken || !expiresAt) {
      return null;
    }
    
    return {
      accessToken,
      refreshToken,
      expiresAt: parseInt(expiresAt),
    };
  }
}
```

### 2.3 Interceptors Setup
```typescript
// services/api/interceptors.ts
import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authService } from './auth';
import { ErrorHandler } from './errorHandler';
import { CacheManager } from './cacheManager';
import { RetryManager } from './retryManager';

export function setupInterceptors(
  client: AxiosInstance,
  retryConfig?: RetryConfig
): void {
  const errorHandler = new ErrorHandler();
  const cacheManager = new CacheManager();
  const retryManager = new RetryManager(retryConfig);
  
  // Request interceptor
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      // Add auth token
      if (!config.headers['skipAuth']) {
        const token = authService.getAccessToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      // Add request ID for tracking
      config.headers['X-Request-ID'] = generateRequestId();
      
      // Add timestamp
      config.headers['X-Request-Time'] = Date.now().toString();
      
      // Check cache
      if (config.method === 'GET' && config.headers['cache']) {
        const cachedResponse = cacheManager.get(config.url!, config.params);
        if (cachedResponse) {
          // Return cached response by rejecting with special flag
          return Promise.reject({
            __CACHED_RESPONSE__: true,
            data: cachedResponse,
            config,
          });
        }
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      // Calculate request duration
      const requestTime = parseInt(response.config.headers['X-Request-Time']);
      const duration = Date.now() - requestTime;
      response.headers['X-Response-Time'] = duration.toString();
      
      // Cache successful GET responses
      if (
        response.config.method === 'GET' &&
        response.config.headers['cache'] &&
        response.status === 200
      ) {
        const cacheTime = response.config.headers['cacheTime'] || 5 * 60 * 1000;
        cacheManager.set(
          response.config.url!,
          response.config.params,
          response.data,
          cacheTime
        );
      }
      
      // Log successful requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `✓ ${response.config.method} ${response.config.url}`,
          `(${duration}ms)`
        );
      }
      
      return response;
    },
    async (error: AxiosError) => {
      // Handle cached response
      if (error.__CACHED_RESPONSE__) {
        return { data: error.data, config: error.config, cached: true };
      }
      
      // Handle 401 Unauthorized
      if (error.response?.status === 401 && !error.config?.headers['skipAuth']) {
        try {
          // Try to refresh token
          await authService.refreshTokens();
          
          // Retry original request
          const originalRequest = error.config!;
          originalRequest.headers['Authorization'] = 
            `Bearer ${authService.getAccessToken()}`;
          
          return client(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          errorHandler.handleAuthError(refreshError);
          return Promise.reject(refreshError);
        }
      }
      
      // Handle retries
      if (error.config && retryManager.shouldRetry(error)) {
        return retryManager.retry(error, client);
      }
      
      // Handle other errors
      errorHandler.handle(error);
      
      return Promise.reject(error);
    }
  );
}

// Helper functions
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

---

## 3. User API Service

### 3.1 User Service Interface
```typescript
// services/api/users.ts
import { apiClient, API_ENDPOINTS } from './client';
import { PaginatedResponse, ApiResponse } from './types';
import { transformUser, transformUserInput } from './transformers';

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

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  accessLevel: number;
  position: string;
  departmentId: string;
  managerId?: string;
  employmentDate?: Date;
  employmentType?: EmploymentType;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  position?: string;
  departmentId?: string;
  managerId?: string;
  phone?: string;
  timezone?: string;
  language?: string;
}

export interface BulkUpdateData {
  userIds: string[];
  changes: Partial<UpdateUserData> & {
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
      meta: response.data.meta,
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
  async createUser(data: CreateUserData): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      API_ENDPOINTS.users.create,
      transformUserInput(data)
    );
    
    return transformUser(response.data.data);
  }
  
  // Update user
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
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
      '/users/check-email',
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
      '/users/suggestions',
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
```

### 3.2 User API Hooks
```typescript
// hooks/api/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, ListUsersParams } from '@/services/api/users';
import { useAppDispatch } from '@/store';
import { addNotification } from '@/store/slices/uiSlice';

// Query keys
export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (params: ListUsersParams) => [...userQueryKeys.lists(), params] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...userQueryKeys.details(), id] as const,
  sessions: (id: string) => [...userQueryKeys.all, 'sessions', id] as const,
  suggestions: (query: string) => [...userQueryKeys.all, 'suggestions', query] as const,
};

// List users hook
export function useUsers(params: ListUsersParams = {}) {
  return useQuery({
    queryKey: userQueryKeys.list(params),
    queryFn: () => userService.listUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get single user hook
export function useUser(id: string, options?: { include?: string[] }) {
  return useQuery({
    queryKey: userQueryKeys.detail(id),
    queryFn: () => userService.getUser(id, options?.include),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: userService.createUser,
    onSuccess: (user) => {
      // Invalidate user list
      queryClient.invalidateQueries(userQueryKeys.lists());
      
      // Show success notification
      dispatch(
        addNotification({
          type: 'success',
          title: 'User Created',
          message: `${user.fullName} has been created successfully`,
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Failed to Create User',
          message: error.response?.data?.message || 'An error occurred',
        })
      );
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      userService.updateUser(id, data),
    onSuccess: (user, { id }) => {
      // Update cache
      queryClient.setQueryData(userQueryKeys.detail(id), user);
      queryClient.invalidateQueries(userQueryKeys.lists());
      
      dispatch(
        addNotification({
          type: 'success',
          title: 'User Updated',
          message: `${user.fullName} has been updated successfully`,
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Failed to Update User',
          message: error.response?.data?.message || 'An error occurred',
        })
      );
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: ({ id, reassignTo }: { id: string; reassignTo?: string }) =>
      userService.deleteUser(id, reassignTo),
    onSuccess: (_, { id }) => {
      // Remove from cache
      queryClient.removeQueries(userQueryKeys.detail(id));
      queryClient.invalidateQueries(userQueryKeys.lists());
      
      dispatch(
        addNotification({
          type: 'success',
          title: 'User Deleted',
          message: 'User has been deleted successfully',
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Failed to Delete User',
          message: error.response?.data?.message || 'An error occurred',
        })
      );
    },
  });
}

// Bulk update mutation
export function useBulkUpdateUsers() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: userService.bulkUpdateUsers,
    onSuccess: (users) => {
      // Update individual user caches
      users.forEach((user) => {
        queryClient.setQueryData(userQueryKeys.detail(user.id), user);
      });
      
      // Invalidate lists
      queryClient.invalidateQueries(userQueryKeys.lists());
      
      dispatch(
        addNotification({
          type: 'success',
          title: 'Bulk Update Complete',
          message: `${users.length} users updated successfully`,
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Bulk Update Failed',
          message: error.response?.data?.message || 'An error occurred',
        })
      );
    },
  });
}

// Email availability check
export function useCheckEmailAvailability() {
  return useMutation({
    mutationFn: ({ email, excludeUserId }: { email: string; excludeUserId?: string }) =>
      userService.checkEmailAvailability(email, excludeUserId),
  });
}

// User suggestions hook
export function useUserSuggestions(query: string, options?: any) {
  return useQuery({
    queryKey: userQueryKeys.suggestions(query),
    queryFn: () => userService.getUserSuggestions(query, options),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    debounce: 300, // Custom debounce option
  });
}

// Export users mutation
export function useExportUsers() {
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: userService.exportUsers,
    onSuccess: (blob, options) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users_export_${Date.now()}.${options.format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      dispatch(
        addNotification({
          type: 'success',
          title: 'Export Complete',
          message: 'Users exported successfully',
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Export Failed',
          message: error.response?.data?.message || 'An error occurred',
        })
      );
    },
  });
}

// Import users mutation
export function useImportUsers() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  
  return useMutation({
    mutationFn: ({ file, options }: { file: File; options: ImportOptions }) =>
      userService.importUsers(file, options),
    onSuccess: (result) => {
      // Invalidate user lists
      queryClient.invalidateQueries(userQueryKeys.lists());
      
      dispatch(
        addNotification({
          type: 'success',
          title: 'Import Complete',
          message: `Successfully imported ${result.imported} users`,
        })
      );
    },
    onError: (error: any) => {
      dispatch(
        addNotification({
          type: 'error',
          title: 'Import Failed',
          message: error.response?.data?.message || 'An error occurred',
        })
      );
    },
  });
}
```

---

## 4. Permission API Service

### 4.1 Permission Service
```typescript
// services/api/permissions.ts
import { apiClient, API_ENDPOINTS } from './client';
import { ApiResponse } from './types';

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
      '/permissions/check',
      { userId, permission }
    );
    
    return response.data.data.hasPermission;
  }
  
  // Get permission dependencies
  async getPermissionDependencies(permissionId: string): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>(
      `/permissions/${permissionId}/dependencies`
    );
    
    return response.data.data;
  }
  
  // Validate permission set
  async validatePermissions(permissions: string[]): Promise<ValidationResult> {
    const response = await apiClient.post<ApiResponse<ValidationResult>>(
      '/permissions/validate',
      { permissions }
    );
    
    return response.data.data;
  }
}

export const permissionService = new PermissionService();
```

### 4.2 Permission Hooks
```typescript
// hooks/api/usePermissions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionService } from '@/services/api/permissions';

export const permissionQueryKeys = {
  all: ['permissions'] as const,
  list: () => [...permissionQueryKeys.all, 'list'] as const,
  groups: () => [...permissionQueryKeys.all, 'groups'] as const,
  roles: () => [...permissionQueryKeys.all, 'roles'] as const,
  userPermissions: (userId: string) => 
    [...permissionQueryKeys.all, 'user', userId] as const,
};

export function usePermissions() {
  return useQuery({
    queryKey: permissionQueryKeys.list(),
    queryFn: permissionService.getPermissions,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function usePermissionGroups() {
  return useQuery({
    queryKey: permissionQueryKeys.groups(),
    queryFn: permissionService.getPermissionGroups,
    staleTime: 15 * 60 * 1000,
  });
}

export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: permissionQueryKeys.userPermissions(userId),
    queryFn: () => permissionService.getUserPermissions(userId),
    enabled: !!userId,
  });
}

export function useUpdateUserPermissions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserPermissionsData }) =>
      permissionService.updateUserPermissions(userId, data),
    onSuccess: (permissions, { userId }) => {
      queryClient.setQueryData(
        permissionQueryKeys.userPermissions(userId),
        permissions
      );
    },
  });
}

export function useCheckPermission(userId: string, permission: string) {
  return useQuery({
    queryKey: ['permissions', 'check', userId, permission],
    queryFn: () => permissionService.checkUserPermission(userId, permission),
    enabled: !!userId && !!permission,
  });
}
```

---

## 5. Department API Service

### 5.1 Department Service
```typescript
// services/api/departments.ts
import { apiClient, API_ENDPOINTS } from './client';
import { ApiResponse } from './types';

export interface CreateDepartmentData {
  name: string;
  description?: string;
  parentId?: string;
  managerIds?: string[];
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  parentId?: string;
  managerIds?: string[];
}

export class DepartmentService {
  // Get all departments
  async getDepartments(): Promise<Department[]> {
    const response = await apiClient.get<ApiResponse<Department[]>>(
      API_ENDPOINTS.departments.list
    );
    
    return response.data.data;
  }
  
  // Get department tree
  async getDepartmentTree(): Promise<DepartmentNode[]> {
    const response = await apiClient.get<ApiResponse<DepartmentNode[]>>(
      API_ENDPOINTS.departments.tree
    );
    
    return response.data.data;
  }
  
  // Get single department
  async getDepartment(id: string): Promise<Department> {
    const response = await apiClient.get<ApiResponse<Department>>(
      API_ENDPOINTS.departments.detail(id)
    );
    
    return response.data.data;
  }
  
  // Create department
  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    const response = await apiClient.post<ApiResponse<Department>>(
      API_ENDPOINTS.departments.create,
      data
    );
    
    return response.data.data;
  }
  
  // Update department
  async updateDepartment(
    id: string,
    data: UpdateDepartmentData
  ): Promise<Department> {
    const response = await apiClient.put<ApiResponse<Department>>(
      API_ENDPOINTS.departments.update(id),
      data
    );
    
    return response.data.data;
  }
  
  // Delete department
  async deleteDepartment(
    id: string,
    options?: { reassignTo?: string; deleteMembers?: boolean }
  ): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.departments.delete(id), {
      params: options,
    });
  }
  
  // Get department members
  async getDepartmentMembers(
    id: string,
    includeSubdepartments: boolean = false
  ): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>(
      API_ENDPOINTS.departments.members(id),
      {
        params: { includeSubdepartments },
      }
    );
    
    return response.data.data;
  }
  
  // Move department
  async moveDepartment(
    id: string,
    newParentId: string | null
  ): Promise<Department> {
    const response = await apiClient.post<ApiResponse<Department>>(
      `/departments/${id}/move`,
      { newParentId }
    );
    
    return response.data.data;
  }
  
  // Get department statistics
  async getDepartmentStats(id: string): Promise<DepartmentStats> {
    const response = await apiClient.get<ApiResponse<DepartmentStats>>(
      `/departments/${id}/stats`
    );
    
    return response.data.data;
  }
}

export const departmentService = new DepartmentService();
```

### 5.2 Department Hooks
```typescript
// hooks/api/useDepartments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentService } from '@/services/api/departments';

export const departmentQueryKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentQueryKeys.all, 'list'] as const,
  list: () => [...departmentQueryKeys.lists()] as const,
  tree: () => [...departmentQueryKeys.all, 'tree'] as const,
  details: () => [...departmentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentQueryKeys.details(), id] as const,
  members: (id: string) => [...departmentQueryKeys.all, 'members', id] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentQueryKeys.list(),
    queryFn: departmentService.getDepartments,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useDepartmentTree() {
  return useQuery({
    queryKey: departmentQueryKeys.tree(),
    queryFn: departmentService.getDepartmentTree,
    staleTime: 30 * 60 * 1000,
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentQueryKeys.detail(id),
    queryFn: () => departmentService.getDepartment(id),
    enabled: !!id,
  });
}

export function useDepartmentMembers(id: string, includeSubdepartments = false) {
  return useQuery({
    queryKey: [...departmentQueryKeys.members(id), { includeSubdepartments }],
    queryFn: () => departmentService.getDepartmentMembers(id, includeSubdepartments),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: departmentService.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries(departmentQueryKeys.all);
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentData }) =>
      departmentService.updateDepartment(id, data),
    onSuccess: (department, { id }) => {
      queryClient.setQueryData(departmentQueryKeys.detail(id), department);
      queryClient.invalidateQueries(departmentQueryKeys.lists());
      queryClient.invalidateQueries(departmentQueryKeys.tree());
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, options }: { id: string; options?: any }) =>
      departmentService.deleteDepartment(id, options),
    onSuccess: (_, { id }) => {
      queryClient.removeQueries(departmentQueryKeys.detail(id));
      queryClient.invalidateQueries(departmentQueryKeys.all);
    },
  });
}
```

---

## 6. Activity API Service

### 6.1 Activity Service
```typescript
// services/api/activities.ts
import { apiClient, API_ENDPOINTS } from './client';
import { ApiResponse, PaginatedResponse } from './types';

export interface ListActivitiesParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: ActivityAction[];
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}

export class ActivityService {
  // List activities
  async listActivities(
    params: ListActivitiesParams = {}
  ): Promise<PaginatedResponse<ActivityLog>> {
    const response = await apiClient.get<PaginatedResponse<ActivityLog>>(
      API_ENDPOINTS.activities.list,
      { params }
    );
    
    return response.data;
  }
  
  // Get user activities
  async getUserActivities(
    userId: string,
    params?: Omit<ListActivitiesParams, 'userId'>
  ): Promise<PaginatedResponse<ActivityLog>> {
    const response = await apiClient.get<PaginatedResponse<ActivityLog>>(
      API_ENDPOINTS.activities.userActivities(userId),
      { params }
    );
    
    return response.data;
  }
  
  // Export activities
  async exportActivities(
    params: ListActivitiesParams & { format: ExportFormat }
  ): Promise<Blob> {
    const response = await apiClient.post(
      API_ENDPOINTS.activities.export,
      params,
      {
        responseType: 'blob',
      }
    );
    
    return response.data;
  }
  
  // Get activity statistics
  async getActivityStats(params?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ActivityStats> {
    const response = await apiClient.get<ApiResponse<ActivityStats>>(
      '/activities/stats',
      { params }
    );
    
    return response.data.data;
  }
  
  // Get activity timeline
  async getActivityTimeline(params?: {
    userId?: string;
    days?: number;
  }): Promise<ActivityTimeline[]> {
    const response = await apiClient.get<ApiResponse<ActivityTimeline[]>>(
      '/activities/timeline',
      { params }
    );
    
    return response.data.data;
  }
}

export const activityService = new ActivityService();
```

### 6.2 Activity Hooks
```typescript
// hooks/api/useActivities.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { activityService, ListActivitiesParams } from '@/services/api/activities';

export const activityQueryKeys = {
  all: ['activities'] as const,
  lists: () => [...activityQueryKeys.all, 'list'] as const,
  list: (params: ListActivitiesParams) => [...activityQueryKeys.lists(), params] as const,
  userActivities: (userId: string) => 
    [...activityQueryKeys.all, 'user', userId] as const,
  stats: (params?: any) => [...activityQueryKeys.all, 'stats', params] as const,
  timeline: (params?: any) => [...activityQueryKeys.all, 'timeline', params] as const,
};

export function useActivities(params: ListActivitiesParams = {}) {
  return useQuery({
    queryKey: activityQueryKeys.list(params),
    queryFn: () => activityService.listActivities(params),
  });
}

export function useInfiniteActivities(params: ListActivitiesParams = {}) {
  return useInfiniteQuery({
    queryKey: activityQueryKeys.list(params),
    queryFn: ({ pageParam = 1 }) =>
      activityService.listActivities({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.pagination.hasNextPage
        ? lastPage.meta.pagination.page + 1
        : undefined,
  });
}

export function useUserActivities(userId: string, params?: any) {
  return useQuery({
    queryKey: [...activityQueryKeys.userActivities(userId), params],
    queryFn: () => activityService.getUserActivities(userId, params),
    enabled: !!userId,
  });
}

export function useActivityStats(params?: any) {
  return useQuery({
    queryKey: activityQueryKeys.stats(params),
    queryFn: () => activityService.getActivityStats(params),
  });
}

export function useActivityTimeline(params?: any) {
  return useQuery({
    queryKey: activityQueryKeys.timeline(params),
    queryFn: () => activityService.getActivityTimeline(params),
  });
}
```

---

## 7. File Upload Service

### 7.1 File Upload Service
```typescript
// services/api/files.ts
import { fileClient, API_ENDPOINTS } from './client';
import { ApiResponse } from './types';

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  maxSize?: number;
  allowedTypes?: string[];
}

export interface FileUploadResponse {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
}

export class FileService {
  // Upload file
  async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<FileUploadResponse> {
    // Validate file
    if (options.maxSize && file.size > options.maxSize) {
      throw new Error(`File size exceeds maximum of ${options.maxSize} bytes`);
    }
    
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fileClient.post<ApiResponse<FileUploadResponse>>(
      API_ENDPOINTS.files.upload,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            options.onProgress(progress);
          }
        },
      }
    );
    
    return response.data.data;
  }
  
  // Upload avatar
  async uploadAvatar(
    file: File,
    userId: string,
    options: UploadOptions = {}
  ): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', userId);
    
    const response = await fileClient.post<ApiResponse<FileUploadResponse>>(
      API_ENDPOINTS.files.avatar,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (options.onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            options.onProgress(progress);
          }
        },
      }
    );
    
    return response.data.data;
  }
  
  // Download file
  async downloadFile(id: string, filename?: string): Promise<void> {
    const response = await fileClient.get(
      API_ENDPOINTS.files.download(id),
      {
        responseType: 'blob',
      }
    );
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `download_${id}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
  
  // Upload multiple files
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<FileUploadResponse[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }
  
  // Delete file
  async deleteFile(id: string): Promise<void> {
    await fileClient.delete(`/files/${id}`);
  }
}

export const fileService = new FileService();
```

### 7.2 File Upload Hooks
```typescript
// hooks/api/useFileUpload.ts
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fileService, UploadOptions } from '@/services/api/files';

export function useFileUpload(options: UploadOptions = {}) {
  const [progress, setProgress] = useState(0);
  
  const mutation = useMutation({
    mutationFn: (file: File) =>
      fileService.uploadFile(file, {
        ...options,
        onProgress: setProgress,
      }),
    onSuccess: () => {
      setProgress(0);
    },
    onError: () => {
      setProgress(0);
    },
  });
  
  return {
    ...mutation,
    progress,
  };
}

export function useAvatarUpload(userId: string) {
  const [progress, setProgress] = useState(0);
  
  const mutation = useMutation({
    mutationFn: (file: File) =>
      fileService.uploadAvatar(file, userId, {
        onProgress: setProgress,
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
    onSuccess: () => {
      setProgress(0);
    },
    onError: () => {
      setProgress(0);
    },
  });
  
  return {
    ...mutation,
    progress,
  };
}

export function useMultipleFileUpload(options: UploadOptions = {}) {
  const [progress, setProgress] = useState<Record<string, number>>({});
  
  const mutation = useMutation({
    mutationFn: (files: File[]) => {
      const uploadPromises = files.map((file, index) =>
        fileService.uploadFile(file, {
          ...options,
          onProgress: (p) => {
            setProgress((prev) => ({ ...prev, [index]: p }));
          },
        })
      );
      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      setProgress({});
    },
    onError: () => {
      setProgress({});
    },
  });
  
  return {
    ...mutation,
    progress,
  };
}
```

---

## 8. WebSocket Integration

### 8.1 WebSocket Client
```typescript
// services/websocket/client.ts
import { io, Socket } from 'socket.io-client';
import { authService } from '../api/auth';

export interface WebSocketConfig {
  url: string;
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
  transports: string[];
}

export class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private rooms: Set<string> = new Set();
  
  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: process.env.NEXT_PUBLIC_WS_URL || '',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      ...config,
    };
  }
  
  connect(): void {
    if (this.socket?.connected) return;
    
    const token = authService.getAccessToken();
    if (!token) {
      console.error('No authentication token available');
      return;
    }
    
    this.socket = io(this.config.url, {
      auth: { token },
      transports: this.config.transports,
      reconnection: this.config.reconnection,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
    });
    
    this.setupEventListeners();
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.rejoinRooms();
      this.emit('connection:established');
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('connection:lost', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('connection:error', error);
    });
    
    // Reconnection events
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.emit('connection:reconnected', attemptNumber);
    });
    
    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      this.emit('connection:reconnect_error', error);
    });
    
    // Custom events
    this.socket.onAny((event, ...args) => {
      this.emit(event, ...args);
    });
  }
  
  private rejoinRooms(): void {
    if (!this.socket) return;
    
    this.rooms.forEach((room) => {
      this.socket!.emit('join', room);
    });
  }
  
  // Event handling
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }
  
  off(event: string, handler?: Function): void {
    if (!this.eventHandlers.has(event)) return;
    
    if (handler) {
      this.eventHandlers.get(event)!.delete(handler);
    } else {
      this.eventHandlers.delete(event);
    }
  }
  
  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }
  
  // Room management
  joinRoom(room: string): void {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }
    
    this.socket.emit('join', room);
    this.rooms.add(room);
  }
  
  leaveRoom(room: string): void {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return;
    }
    
    this.socket.emit('leave', room);
    this.rooms.delete(room);
  }
  
  // Send message
  send(event: string, data: any, callback?: Function): void {
    if (!this.socket?.connected) {
      console.error('WebSocket not connected');
      return;
    }
    
    if (callback) {
      this.socket.emit(event, data, callback);
    } else {
      this.socket.emit(event, data);
    }
  }
  
  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  // Get socket ID
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
```

### 8.2 WebSocket Hooks
```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { wsClient } from '@/services/websocket/client';
import { useAuth } from '@/hooks/useAuth';

export function useWebSocket() {
  const { isAuthenticated } = useAuth();
  const isConnected = useRef(false);
  
  useEffect(() => {
    if (isAuthenticated && !isConnected.current) {
      wsClient.connect();
      isConnected.current = true;
    }
    
    return () => {
      if (isConnected.current) {
        wsClient.disconnect();
        isConnected.current = false;
      }
    };
  }, [isAuthenticated]);
  
  const on = useCallback((event: string, handler: Function) => {
    wsClient.on(event, handler);
    
    return () => wsClient.off(event, handler);
  }, []);
  
  const emit = useCallback((event: string, data: any, callback?: Function) => {
    wsClient.send(event, data, callback);
  }, []);
  
  const joinRoom = useCallback((room: string) => {
    wsClient.joinRoom(room);
  }, []);
  
  const leaveRoom = useCallback((room: string) => {
    wsClient.leaveRoom(room);
  }, []);
  
  return {
    on,
    emit,
    joinRoom,
    leaveRoom,
    isConnected: wsClient.isConnected(),
    socketId: wsClient.getSocketId(),
  };
}

// Specialized hooks
export function useUserActivityStream(userId?: string) {
  const { on, joinRoom, leaveRoom } = useWebSocket();
  
  useEffect(() => {
    if (!userId) return;
    
    const room = `user:${userId}:activity`;
    joinRoom(room);
    
    return () => leaveRoom(room);
  }, [userId, joinRoom, leaveRoom]);
  
  return { on };
}

export function useRealtimeUserUpdates() {
  const { on, joinRoom, leaveRoom } = useWebSocket();
  
  useEffect(() => {
    joinRoom('users:updates');
    
    return () => leaveRoom('users:updates');
  }, [joinRoom, leaveRoom]);
  
  return { on };
}
```

---

## 9. Error Handling

### 9.1 Error Handler
```typescript
// services/api/errorHandler.ts
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import Router from 'next/router';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  timestamp?: string;
}

export interface ApiErrorResponse {
  error: ApiError;
  errors?: ApiError[];
  statusCode: number;
  path: string;
  method: string;
  requestId: string;
}

export class ErrorHandler {
  private errorMessages: Map<string, string> = new Map([
    ['NETWORK_ERROR', 'Network error. Please check your connection.'],
    ['TIMEOUT', 'Request timed out. Please try again.'],
    ['UNAUTHORIZED', 'You are not authorized to perform this action.'],
    ['FORBIDDEN', 'Access denied.'],
    ['NOT_FOUND', 'Resource not found.'],
    ['VALIDATION_ERROR', 'Please check your input and try again.'],
    ['SERVER_ERROR', 'Server error. Please try again later.'],
    ['RATE_LIMIT', 'Too many requests. Please slow down.'],
  ]);
  
  handle(error: AxiosError<ApiErrorResponse>): void {
    if (error.response) {
      this.handleApiError(error.response.data, error.response.status);
    } else if (error.request) {
      this.handleNetworkError();
    } else {
      this.handleUnknownError(error);
    }
  }
  
  private handleApiError(data: ApiErrorResponse, status: number): void {
    switch (status) {
      case 400:
        this.handleValidationError(data);
        break;
      case 401:
        this.handleAuthError(data);
        break;
      case 403:
        this.handleForbiddenError(data);
        break;
      case 404:
        this.handleNotFoundError(data);
        break;
      case 409:
        this.handleConflictError(data);
        break;
      case 422:
        this.handleUnprocessableEntity(data);
        break;
      case 429:
        this.handleRateLimitError(data);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        this.handleServerError(data);
        break;
      default:
        this.showError(data.error?.message || 'An unexpected error occurred');
    }
  }
  
  private handleValidationError(data: ApiErrorResponse): void {
    if (data.errors && data.errors.length > 0) {
      // Show first error
      const firstError = data.errors[0];
      this.showError(
        firstError.field
          ? `${firstError.field}: ${firstError.message}`
          : firstError.message
      );
    } else {
      this.showError(data.error?.message || this.errorMessages.get('VALIDATION_ERROR')!);
    }
  }
  
  handleAuthError(data: ApiErrorResponse): void {
    this.showError(data.error?.message || this.errorMessages.get('UNAUTHORIZED')!);
    
    // Redirect to login
    setTimeout(() => {
      Router.push('/login');
    }, 1500);
  }
  
  private handleForbiddenError(data: ApiErrorResponse): void {
    this.showError(data.error?.message || this.errorMessages.get('FORBIDDEN')!);
  }
  
  private handleNotFoundError(data: ApiErrorResponse): void {
    this.showError(data.error?.message || this.errorMessages.get('NOT_FOUND')!);
  }
  
  private handleConflictError(data: ApiErrorResponse): void {
    this.showError(data.error?.message || 'Resource conflict');
  }
  
  private handleUnprocessableEntity(data: ApiErrorResponse): void {
    this.showError(data.error?.message || 'Invalid data provided');
  }
  
  private handleRateLimitError(data: ApiErrorResponse): void {
    const retryAfter = data.error?.details?.retryAfter;
    const message = retryAfter
      ? `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      : this.errorMessages.get('RATE_LIMIT')!;
    
    this.showError(message);
  }
  
  private handleServerError(data: ApiErrorResponse): void {
    this.showError(data.error?.message || this.errorMessages.get('SERVER_ERROR')!);
  }
  
  private handleNetworkError(): void {
    this.showError(this.errorMessages.get('NETWORK_ERROR')!);
  }
  
  private handleUnknownError(error: Error): void {
    console.error('Unknown error:', error);
    this.showError('An unexpected error occurred');
  }
  
  private showError(message: string): void {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
    });
  }
  
  // Custom error handling
  registerErrorMessage(code: string, message: string): void {
    this.errorMessages.set(code, message);
  }
  
  getErrorMessage(code: string): string {
    return this.errorMessages.get(code) || 'An error occurred';
  }
}

export const errorHandler = new ErrorHandler();
```

---

## 10. Request/Response Transformations

### 10.1 User Transformers
```typescript
// services/api/transformers/user.ts
import { camelCase, snakeCase, mapKeys } from 'lodash';

// Transform API response to frontend format
export function transformUser(apiUser: any): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.first_name,
    lastName: apiUser.last_name,
    middleName: apiUser.middle_name,
    fullName: apiUser.full_name,
    position: apiUser.position,
    departmentId: apiUser.department_id,
    department: apiUser.department ? transformDepartment(apiUser.department) : undefined,
    managerId: apiUser.manager_id,
    manager: apiUser.manager ? transformUser(apiUser.manager) : undefined,
    role: apiUser.role,
    accessLevel: apiUser.access_level,
    status: apiUser.status,
    avatarUrl: apiUser.avatar_url,
    phone: apiUser.phone,
    timezone: apiUser.timezone,
    language: apiUser.language,
    employmentDate: apiUser.employment_date ? new Date(apiUser.employment_date) : undefined,
    employmentType: apiUser.employment_type,
    lastLoginAt: apiUser.last_login_at ? new Date(apiUser.last_login_at) : undefined,
    createdAt: new Date(apiUser.created_at),
    updatedAt: new Date(apiUser.updated_at),
  };
}

// Transform frontend data to API format
export function transformUserInput(userData: any): any {
  const transformed = mapKeys(userData, (_, key) => snakeCase(key));
  
  // Handle date transformations
  if (userData.employmentDate) {
    transformed.employment_date = userData.employmentDate.toISOString();
  }
  
  return transformed;
}

// Transform department
export function transformDepartment(apiDept: any): Department {
  return {
    id: apiDept.id,
    name: apiDept.name,
    description: apiDept.description,
    parentId: apiDept.parent_id,
    managerIds: apiDept.manager_ids || [],
    memberCount: apiDept.member_count || 0,
    path: apiDept.path || [],
    level: apiDept.level || 0,
    createdAt: new Date(apiDept.created_at),
    updatedAt: new Date(apiDept.updated_at),
  };
}
```

### 10.2 Generic Transformers
```typescript
// services/api/transformers/generic.ts
export function transformPaginationMeta(meta: any): PaginationMeta {
  return {
    page: meta.page || 1,
    limit: meta.limit || 25,
    total: meta.total || 0,
    totalPages: meta.total_pages || Math.ceil(meta.total / meta.limit),
    hasNextPage: meta.has_next_page || false,
    hasPrevPage: meta.has_prev_page || false,
  };
}

export function transformFilters(filters: any): any {
  const transformed: any = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    
    if (Array.isArray(value) && value.length === 0) return;
    
    if (key === 'dateRange' && typeof value === 'object') {
      if (value.start) transformed.start_date = value.start;
      if (value.end) transformed.end_date = value.end;
    } else {
      transformed[snakeCase(key)] = value;
    }
  });
  
  return transformed;
}

export function transformSorting(sorting: any): any {
  return {
    sort_by: snakeCase(sorting.field),
    sort_order: sorting.order,
  };
}
```

### 10.3 Response Interceptor
```typescript
// services/api/transformers/interceptor.ts
export function setupTransformInterceptor(client: AxiosInstance): void {
  // Response transformer
  client.interceptors.response.use(
    (response) => {
      // Transform paginated responses
      if (response.data?.meta?.pagination) {
        response.data.meta.pagination = transformPaginationMeta(
          response.data.meta.pagination
        );
      }
      
      // Transform timestamps
      if (response.data?.data) {
        response.data.data = transformTimestamps(response.data.data);
      }
      
      return response;
    },
    (error) => Promise.reject(error)
  );
  
  // Request transformer
  client.interceptors.request.use(
    (config) => {
      // Transform request params
      if (config.params) {
        config.params = transformRequestParams(config.params);
      }
      
      // Transform request data
      if (config.data && typeof config.data === 'object') {
        config.data = transformRequestData(config.data);
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
}

function transformTimestamps(data: any): any {
  if (Array.isArray(data)) {
    return data.map(transformTimestamps);
  }
  
  if (data && typeof data === 'object') {
    const transformed = { ...data };
    
    // Transform known timestamp fields
    const timestampFields = [
      'created_at',
      'updated_at',
      'deleted_at',
      'last_login_at',
      'email_verified_at',
      'suspension_end_date',
    ];
    
    timestampFields.forEach((field) => {
      if (transformed[field]) {
        transformed[camelCase(field)] = new Date(transformed[field]);
      }
    });
    
    return transformed;
  }
  
  return data;
}
```

---

## Usage Examples

### Basic API Usage
```tsx
import { userService } from '@/services/api/users';

// In a component
async function loadUsers() {
  try {
    const response = await userService.listUsers({
      page: 1,
      limit: 25,
      roles: ['admin', 'sales_manager'],
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    
    console.log('Users:', response.data);
    console.log('Total:', response.meta.pagination.total);
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}
```

### Using React Query Hooks
```tsx
import { useUsers, useCreateUser } from '@/hooks/api/useUsers';

function UsersList() {
  const { data, isLoading, error } = useUsers({
    page: 1,
    limit: 25,
  });
  
  const createUser = useCreateUser();
  
  const handleCreateUser = async (userData: CreateUserData) => {
    try {
      await createUser.mutateAsync(userData);
      // Success handled by hook
    } catch (error) {
      // Error handled by hook
    }
  };
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div>
      {data?.data.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### WebSocket Integration
```tsx
import { useWebSocket, useRealtimeUserUpdates } from '@/hooks/useWebSocket';

function RealtimeUserList() {
  const { data, refetch } = useUsers();
  const { on } = useRealtimeUserUpdates();
  
  useEffect(() => {
    const unsubscribe = on('user:created', (user: User) => {
      console.log('New user created:', user);
      refetch();
    });
    
    const unsubscribeUpdate = on('user:updated', (user: User) => {
      console.log('User updated:', user);
      refetch();
    });
    
    return () => {
      unsubscribe();
      unsubscribeUpdate();
    };
  }, [on, refetch]);
  
  return <UserTable users={data?.data || []} />;
}
```

---

This completes the comprehensive API integration specification for the Users Management feature. The implementation provides a robust, type-safe API layer with excellent error handling, real-time updates, and developer experience.