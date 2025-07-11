import { Middleware } from '@reduxjs/toolkit';

// Track these actions for analytics
const trackedActions = [
  'users/createUser/fulfilled',
  'users/updateUser/fulfilled',
  'users/deleteUser/fulfilled',
  'users/bulkUpdateUsers/fulfilled',
  'users/exportUsers/fulfilled',
  'users/importUsers/fulfilled',
  'permissions/updateUserPermissions/fulfilled',
  'departments/createDepartment/fulfilled',
  'departments/updateDepartment/fulfilled',
  'departments/deleteDepartment/fulfilled',
];

// Analytics service (placeholder - replace with actual implementation)
const analytics = {
  track: (event: string, data: any) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
      // Example: window.gtag('event', event, data);
      // Example: window.mixpanel.track(event, data);
      console.log('Analytics:', event, data);
    }
  },
};

export const analyticsMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Track specific actions
  if (trackedActions.includes(action.type)) {
    const state = store.getState();
    const userId = state.auth?.user?.id || 'anonymous';
    
    analytics.track('user_management_action', {
      action: action.type,
      userId,
      payload: action.payload,
      timestamp: Date.now(),
    });
  }
  
  // Track modal opens
  if (action.type === 'ui/openModal') {
    analytics.track('modal_opened', {
      modal: action.payload.modal,
      data: action.payload.data,
      timestamp: Date.now(),
    });
  }
  
  // Track filter changes
  if (action.type === 'users/setFilters') {
    analytics.track('filters_changed', {
      filters: action.payload,
      timestamp: Date.now(),
    });
  }
  
  // Track exports
  if (action.type === 'users/exportUsers/pending') {
    analytics.track('export_initiated', {
      format: action.meta.arg.format,
      timestamp: Date.now(),
    });
  }
  
  return result;
};