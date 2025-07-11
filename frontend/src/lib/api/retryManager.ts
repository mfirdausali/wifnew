import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

export interface RetryConfig {
  retries?: number;
  retryDelay?: number;
  retryCondition?: (error: AxiosError) => boolean;
  onRetry?: (retryCount: number, error: AxiosError) => void;
}

interface RetryState {
  retryCount: number;
  lastError?: AxiosError;
}

export class RetryManager {
  private config: Required<RetryConfig>;
  private retryStates: WeakMap<InternalAxiosRequestConfig, RetryState> = new WeakMap();
  
  constructor(config: RetryConfig = {}) {
    this.config = {
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      retryCondition: config.retryCondition || this.defaultRetryCondition,
      onRetry: config.onRetry || (() => {}),
    };
  }
  
  private defaultRetryCondition(error: AxiosError): boolean {
    // Retry on network errors
    if (!error.response) {
      return true;
    }
    
    // Retry on 5xx errors
    if (error.response.status >= 500) {
      return true;
    }
    
    // Retry on specific 4xx errors
    if (error.response.status === 429 || error.response.status === 408) {
      return true;
    }
    
    return false;
  }
  
  shouldRetry(error: AxiosError): boolean {
    if (!error.config) {
      return false;
    }
    
    // Check if retries are disabled for this request
    const customConfig = error.config as any;
    if (customConfig.retry === false) {
      return false;
    }
    
    // Get retry state
    const state = this.retryStates.get(error.config) || { retryCount: 0 };
    
    // Check if we've exceeded max retries
    const maxRetries = customConfig.retryCount || this.config.retries;
    if (state.retryCount >= maxRetries) {
      return false;
    }
    
    // Check retry condition
    return this.config.retryCondition(error);
  }
  
  async retry(error: AxiosError, client: AxiosInstance): Promise<any> {
    if (!error.config) {
      throw error;
    }
    
    // Get or create retry state
    let state = this.retryStates.get(error.config);
    if (!state) {
      state = { retryCount: 0 };
      this.retryStates.set(error.config, state);
    }
    
    // Increment retry count
    state.retryCount++;
    state.lastError = error;
    
    // Calculate delay
    const delay = this.calculateDelay(state.retryCount, error);
    
    // Call onRetry callback
    this.config.onRetry(state.retryCount, error);
    
    // Wait before retrying
    await this.sleep(delay);
    
    // Retry the request
    try {
      const response = await client.request(error.config);
      
      // Clean up retry state on success
      this.retryStates.delete(error.config);
      
      return response;
    } catch (retryError) {
      // Update error in state
      if (this.retryStates.has(error.config)) {
        const state = this.retryStates.get(error.config)!;
        state.lastError = retryError as AxiosError;
      }
      
      throw retryError;
    }
  }
  
  private calculateDelay(retryCount: number, error: AxiosError): number {
    // Check for Retry-After header
    if (error.response?.headers['retry-after']) {
      const retryAfter = error.response.headers['retry-after'];
      if (!isNaN(Number(retryAfter))) {
        return Number(retryAfter) * 1000;
      }
    }
    
    // Exponential backoff with jitter
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 1000;
    
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  clearRetryState(config: InternalAxiosRequestConfig): void {
    this.retryStates.delete(config);
  }
  
  getRetryState(config: InternalAxiosRequestConfig): RetryState | undefined {
    return this.retryStates.get(config);
  }
}