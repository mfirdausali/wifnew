import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authService } from './auth';
import { ErrorHandler, errorHandler } from './errorHandler';
import { CacheManager } from './cacheManager';
import { RetryManager, RetryConfig } from './retryManager';

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  cache?: boolean;
  cacheTime?: number;
  retry?: boolean;
  retryCount?: number;
  showError?: boolean;
  _retry?: boolean;
}

interface CachedResponse {
  __CACHED_RESPONSE__: boolean;
  data: any;
  config: InternalAxiosRequestConfig;
}

export function setupInterceptors(
  client: AxiosInstance,
  retryConfig?: RetryConfig
): void {
  const cacheManager = new CacheManager();
  const retryManager = new RetryManager(retryConfig);
  
  // Request interceptor
  client.interceptors.request.use(
    async (config: ExtendedAxiosRequestConfig) => {
      // Add auth token
      if (!config.skipAuth) {
        const token = authService.getAccessToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
      
      // Add request ID for tracking
      config.headers['X-Request-ID'] = generateRequestId();
      
      // Add timestamp
      config.headers['X-Request-Time'] = Date.now().toString();
      
      // Check cache for GET requests
      if (config.method?.toLowerCase() === 'get' && config.cache) {
        const cachedResponse = cacheManager.get(config.url!, config.params);
        if (cachedResponse) {
          // Return cached response by rejecting with special flag
          return Promise.reject({
            __CACHED_RESPONSE__: true,
            data: cachedResponse,
            config,
          } as CachedResponse);
        }
      }
      
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Response interceptor
  client.interceptors.response.use(
    (response) => {
      const config = response.config as ExtendedAxiosRequestConfig;
      
      // Calculate request duration
      const requestTime = parseInt(config.headers['X-Request-Time'] as string);
      const duration = Date.now() - requestTime;
      response.headers['X-Response-Time'] = duration.toString();
      
      // Cache successful GET responses
      if (
        config.method?.toLowerCase() === 'get' &&
        config.cache &&
        response.status === 200
      ) {
        const cacheTime = config.cacheTime || 5 * 60 * 1000;
        cacheManager.set(
          config.url!,
          config.params,
          response.data,
          cacheTime
        );
      }
      
      // Log successful requests in development
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `✓ ${config.method?.toUpperCase()} ${config.url}`,
          `(${duration}ms)`
        );
      }
      
      return response;
    },
    async (error: AxiosError | CachedResponse) => {
      // Handle cached response
      if ('__CACHED_RESPONSE__' in error && error.__CACHED_RESPONSE__) {
        return { 
          data: error.data, 
          config: error.config, 
          cached: true,
          status: 200,
          statusText: 'OK',
          headers: {}
        };
      }
      
      const axiosError = error as AxiosError;
      const config = axiosError.config as ExtendedAxiosRequestConfig;
      
      // Handle 401 Unauthorized
      if (axiosError.response?.status === 401 && !config?.skipAuth && !config?._retry) {
        try {
          config._retry = true;
          
          // Try to refresh token
          await authService.refreshTokens();
          
          // Retry original request
          config.headers['Authorization'] = 
            `Bearer ${authService.getAccessToken()}`;
          
          return client(config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          errorHandler.handleAuthError(axiosError.response.data as any);
          return Promise.reject(refreshError);
        }
      }
      
      // Handle retries
      if (config && config.retry !== false && retryManager.shouldRetry(axiosError)) {
        try {
          return await retryManager.retry(axiosError, client);
        } catch (retryError) {
          // Retry failed, handle error normally
          const finalError = retryError as AxiosError;
          const showError = config.showError !== false;
          errorHandler.handle(finalError, showError);
          return Promise.reject(finalError);
        }
      }
      
      // Handle other errors
      const showError = config?.showError !== false;
      errorHandler.handle(axiosError, showError);
      
      return Promise.reject(axiosError);
    }
  );
}

// Helper functions
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}