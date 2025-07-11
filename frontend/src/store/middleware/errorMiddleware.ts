import { isRejectedWithValue, Middleware } from '@reduxjs/toolkit';
import { addNotification } from '@/store/slices/uiSlice';

export const errorMiddleware: Middleware = (store) => (next) => (action) => {
  // Handle rejected actions
  if (isRejectedWithValue(action)) {
    const error = action.payload as any;
    
    // Extract error message
    let message = 'An unexpected error occurred';
    if (error?.message) {
      message = error.message;
    } else if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.response?.data?.error) {
      message = error.response.data.error;
    }
    
    // Dispatch notification
    store.dispatch(
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      })
    );
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Redux Error:', {
        action: action.type,
        error,
        payload: action.payload,
        meta: action.meta,
      });
    }
  }
  
  return next(action);
};