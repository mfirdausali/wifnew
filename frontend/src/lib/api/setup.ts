import { errorHandler } from './errorHandler';
import { store } from '@/store';
import { addNotification } from '@/store/slices/uiSlice';

// Setup error handler to use Redux notifications
export function setupApiErrorHandler() {
  errorHandler.setErrorCallback((message, errorResponse) => {
    store.dispatch(
      addNotification({
        type: 'error',
        title: 'Error',
        message,
      })
    );
  });
}

// Export for use in app initialization
export default setupApiErrorHandler;