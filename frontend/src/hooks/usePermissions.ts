import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchPermissions,
  updateUserPermissions,
  grantPermission,
  revokePermission,
} from '@/store/thunks/permissionThunks';
import {
  selectAllPermissions,
  selectPermissionGroups,
  selectUserPermissions,
  selectUserHasPermission,
  selectPermissionsLoading,
  selectIsPermissionsCacheValid,
  selectPermissionsByCategory,
} from '@/store/selectors/permissionSelectors';
import { UserRole } from '@/types';

export const usePermissions = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const permissions = useAppSelector(selectAllPermissions);
  const groups = useAppSelector(selectPermissionGroups);
  const loading = useAppSelector(selectPermissionsLoading);
  const isCacheValid = useAppSelector(selectIsPermissionsCacheValid);
  const permissionsByCategory = useAppSelector(selectPermissionsByCategory);
  
  // Fetch permissions on mount if cache is invalid
  useEffect(() => {
    if (!isCacheValid) {
      dispatch(fetchPermissions());
    }
  }, [dispatch, isCacheValid]);
  
  // Permission management
  const handleUpdateUserPermissions = useCallback(async (userId: string, permissionIds: string[]) => {
    const result = await dispatch(updateUserPermissions({ userId, permissions: permissionIds }));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  const handleGrantPermission = useCallback(async (userId: string, permissionId: string) => {
    const result = await dispatch(grantPermission({ userId, permissionId }));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  const handleRevokePermission = useCallback(async (userId: string, permissionId: string) => {
    const result = await dispatch(revokePermission({ userId, permissionId }));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  // Refresh permissions
  const refreshPermissions = useCallback(() => {
    dispatch(fetchPermissions());
  }, [dispatch]);
  
  return {
    // Data
    permissions,
    groups,
    loading,
    permissionsByCategory,
    
    // Actions
    updateUserPermissions: handleUpdateUserPermissions,
    grantPermission: handleGrantPermission,
    revokePermission: handleRevokePermission,
    refresh: refreshPermissions,
  };
};

// Hook to check user permissions
export const useUserPermissions = (userId: string) => {
  const dispatch = useAppDispatch();
  const permissions = useAppSelector(state => selectUserPermissions(state, userId));
  
  const hasPermission = useCallback((permissionId: string) => {
    return permissions.some(p => p.id === permissionId);
  }, [permissions]);
  
  const hasAnyPermission = useCallback((permissionIds: string[]) => {
    return permissionIds.some(id => permissions.some(p => p.id === id));
  }, [permissions]);
  
  const hasAllPermissions = useCallback((permissionIds: string[]) => {
    return permissionIds.every(id => permissions.some(p => p.id === id));
  }, [permissions]);
  
  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

// Hook for current user permissions (assuming we have auth state)
export const useCurrentUserPermissions = () => {
  // This would normally get the current user ID from auth state
  // For now, we'll return a placeholder
  const currentUserId = 'current-user-id'; // Replace with actual auth selector
  return useUserPermissions(currentUserId);
};