import { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

/**
 * Hook for checking user permissions
 */
export const usePermissionCheck = () => {
  const { currentUser } = useSelector((state: RootState) => state.auth);
  const userPermissions = currentUser?.permissions || [];

  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!currentUser) return false;
      
      // Admin has all permissions
      if (currentUser.role === 'admin') return true;
      
      return userPermissions.includes(permission);
    },
    [currentUser, userPermissions]
  );

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!currentUser) return false;
      
      // Admin has all permissions
      if (currentUser.role === 'admin') return true;
      
      return permissions.some(permission => userPermissions.includes(permission));
    },
    [currentUser, userPermissions]
  );

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (!currentUser) return false;
      
      // Admin has all permissions
      if (currentUser.role === 'admin') return true;
      
      return permissions.every(permission => userPermissions.includes(permission));
    },
    [currentUser, userPermissions]
  );

  /**
   * Check if user has minimum access level
   */
  const hasAccessLevel = useCallback(
    (minLevel: number): boolean => {
      if (!currentUser) return false;
      
      return currentUser.accessLevel >= minLevel;
    },
    [currentUser]
  );

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!currentUser) return false;
      
      return currentUser.role === role;
    },
    [currentUser]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      if (!currentUser) return false;
      
      return roles.includes(currentUser.role);
    },
    [currentUser]
  );

  /**
   * Check department permission
   */
  const hasDepartmentPermission = useCallback(
    (departmentId: string, permissionType: 'view' | 'edit' | 'manage'): boolean => {
      if (!currentUser) return false;
      
      // Admin has all permissions
      if (currentUser.role === 'admin') return true;
      
      // Check if user belongs to department
      if (permissionType === 'view' && currentUser.departmentId === departmentId) {
        return true;
      }
      
      // Check specific department permission
      return hasPermission(`department.${permissionType}`);
    },
    [currentUser, hasPermission]
  );

  /**
   * Get filtered permissions based on condition
   */
  const getFilteredPermissions = useCallback(
    (filter: (permission: string) => boolean): string[] => {
      return userPermissions.filter(filter);
    },
    [userPermissions]
  );

  /**
   * Check if action requires 2FA
   */
  const requires2FA = useCallback(
    (permission: string): boolean => {
      // This would typically check against permission metadata
      // For now, we'll check high-risk permissions
      const highRiskPermissions = [
        'permission.grant',
        'permission.revoke',
        'users.delete',
        'users.bulk_update',
        'system.config',
      ];
      
      return highRiskPermissions.includes(permission);
    },
    []
  );

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasAccessLevel,
    hasRole,
    hasAnyRole,
    hasDepartmentPermission,
    getFilteredPermissions,
    requires2FA,
    userPermissions,
    currentUser,
  };
};

/**
 * Hook for permission-based visibility
 */
export const usePermissionVisibility = (
  permissions: string | string[],
  options: {
    requireAll?: boolean;
    checkAccessLevel?: boolean;
    minAccessLevel?: number;
  } = {}
) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasAccessLevel } = usePermissionCheck();
  
  const isVisible = useMemo(() => {
    const permArray = Array.isArray(permissions) ? permissions : [permissions];
    
    let hasRequiredPermissions = false;
    
    if (options.requireAll) {
      hasRequiredPermissions = hasAllPermissions(permArray);
    } else {
      hasRequiredPermissions = permArray.length === 1 
        ? hasPermission(permArray[0]) 
        : hasAnyPermission(permArray);
    }
    
    if (!hasRequiredPermissions) return false;
    
    if (options.checkAccessLevel && options.minAccessLevel) {
      return hasAccessLevel(options.minAccessLevel);
    }
    
    return true;
  }, [permissions, options, hasPermission, hasAnyPermission, hasAllPermissions, hasAccessLevel]);
  
  return isVisible;
};