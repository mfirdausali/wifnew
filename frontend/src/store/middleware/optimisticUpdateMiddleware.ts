import { Middleware } from '@reduxjs/toolkit';
import { 
  addOptimisticUpdate, 
  removeOptimisticUpdate,
  updateUser as updateUserAction,
  removeUser as removeUserAction,
} from '@/store/slices/usersSlice';

export const optimisticUpdateMiddleware: Middleware = (store) => (next) => (action) => {
  // Handle optimistic updates for pending actions
  if (action.type.endsWith('/pending')) {
    const [slice, thunk] = action.type.split('/');
    
    if (slice === 'users' && action.meta?.arg) {
      const optimisticId = `optimistic_${Date.now()}`;
      
      switch (thunk) {
        case 'updateUser': {
          // Apply optimistic update
          store.dispatch(updateUserAction({
            id: action.meta.arg.id,
            changes: action.meta.arg.changes,
          }));
          
          // Track optimistic update
          store.dispatch(addOptimisticUpdate({
            id: optimisticId,
            type: 'update',
            data: action.meta.arg.changes,
          }));
          
          // Store optimistic ID in action meta for cleanup
          action.meta.optimisticId = optimisticId;
          break;
        }
        
        case 'deleteUser': {
          // Apply optimistic deletion
          store.dispatch(removeUserAction(action.meta.arg));
          
          // Track optimistic update
          store.dispatch(addOptimisticUpdate({
            id: optimisticId,
            type: 'delete',
            data: { id: action.meta.arg },
          }));
          
          action.meta.optimisticId = optimisticId;
          break;
        }
        
        case 'bulkUpdateUsers': {
          const { userIds, changes } = action.meta.arg;
          
          // Apply optimistic updates for each user
          userIds.forEach((userId: string) => {
            store.dispatch(updateUserAction({
              id: userId,
              changes,
            }));
          });
          
          // Track optimistic update
          store.dispatch(addOptimisticUpdate({
            id: optimisticId,
            type: 'update',
            data: { userIds, changes },
          }));
          
          action.meta.optimisticId = optimisticId;
          break;
        }
      }
    }
  }
  
  // Cleanup optimistic updates on success/failure
  if (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')) {
    if (action.meta?.optimisticId) {
      store.dispatch(removeOptimisticUpdate(action.meta.optimisticId));
    }
    
    // On rejection, we might need to revert the optimistic update
    if (action.type.endsWith('/rejected')) {
      const [slice, thunk] = action.type.split('/');
      
      if (slice === 'users') {
        // Trigger a refetch to restore the correct state
        // This is handled by the component watching for errors
      }
    }
  }
  
  return next(action);
};