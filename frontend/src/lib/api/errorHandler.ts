import { AxiosError } from 'axios';
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

type ErrorCallback = (message: string, error?: ApiErrorResponse) => void;

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
  
  private onError: ErrorCallback | null = null;
  
  setErrorCallback(callback: ErrorCallback): void {
    this.onError = callback;
  }
  
  handle(error: AxiosError<ApiErrorResponse>, showError: boolean = true): void {
    if (error.response) {
      this.handleApiError(error.response.data, error.response.status, showError);
    } else if (error.request) {
      this.handleNetworkError(showError);
    } else {
      this.handleUnknownError(error, showError);
    }
  }
  
  private handleApiError(data: ApiErrorResponse, status: number, showError: boolean): void {
    switch (status) {
      case 400:
        this.handleValidationError(data, showError);
        break;
      case 401:
        this.handleAuthError(data);
        break;
      case 403:
        this.handleForbiddenError(data, showError);
        break;
      case 404:
        this.handleNotFoundError(data, showError);
        break;
      case 409:
        this.handleConflictError(data, showError);
        break;
      case 422:
        this.handleUnprocessableEntity(data, showError);
        break;
      case 429:
        this.handleRateLimitError(data, showError);
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        this.handleServerError(data, showError);
        break;
      default:
        if (showError) {
          this.showError(data.error?.message || 'An unexpected error occurred', data);
        }
    }
  }
  
  private handleValidationError(data: ApiErrorResponse, showError: boolean): void {
    if (!showError) return;
    
    if (data.errors && data.errors.length > 0) {
      // Show first error
      const firstError = data.errors[0];
      this.showError(
        firstError.field
          ? `${firstError.field}: ${firstError.message}`
          : firstError.message,
        data
      );
    } else {
      this.showError(data.error?.message || this.errorMessages.get('VALIDATION_ERROR')!, data);
    }
  }
  
  handleAuthError(data: ApiErrorResponse): void {
    this.showError(data.error?.message || this.errorMessages.get('UNAUTHORIZED')!, data);
    
    // Redirect to login
    setTimeout(() => {
      Router.push('/login');
    }, 1500);
  }
  
  private handleForbiddenError(data: ApiErrorResponse, showError: boolean): void {
    if (showError) {
      this.showError(data.error?.message || this.errorMessages.get('FORBIDDEN')!, data);
    }
  }
  
  private handleNotFoundError(data: ApiErrorResponse, showError: boolean): void {
    if (showError) {
      this.showError(data.error?.message || this.errorMessages.get('NOT_FOUND')!, data);
    }
  }
  
  private handleConflictError(data: ApiErrorResponse, showError: boolean): void {
    if (showError) {
      this.showError(data.error?.message || 'Resource conflict', data);
    }
  }
  
  private handleUnprocessableEntity(data: ApiErrorResponse, showError: boolean): void {
    if (showError) {
      this.showError(data.error?.message || 'Invalid data provided', data);
    }
  }
  
  private handleRateLimitError(data: ApiErrorResponse, showError: boolean): void {
    if (!showError) return;
    
    const retryAfter = data.error?.details?.retryAfter;
    const message = retryAfter
      ? `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      : this.errorMessages.get('RATE_LIMIT')!;
    
    this.showError(message, data);
  }
  
  private handleServerError(data: ApiErrorResponse, showError: boolean): void {
    if (showError) {
      this.showError(data.error?.message || this.errorMessages.get('SERVER_ERROR')!, data);
    }
  }
  
  private handleNetworkError(showError: boolean): void {
    if (showError) {
      this.showError(this.errorMessages.get('NETWORK_ERROR')!);
    }
  }
  
  private handleUnknownError(error: Error, showError: boolean): void {
    console.error('Unknown error:', error);
    if (showError) {
      this.showError('An unexpected error occurred');
    }
  }
  
  private showError(message: string, errorResponse?: ApiErrorResponse): void {
    if (this.onError) {
      this.onError(message, errorResponse);
    } else {
      console.error(message);
    }
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