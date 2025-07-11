import React, { ComponentType, FC } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissionCheck } from '../../hooks/usePermissionCheck';
import { Box, Typography, Button } from '@mui/material';
import { Lock } from 'lucide-react';

export interface PermissionGuardProps {
  permissions?: string | string[];
  requireAll?: boolean;
  minAccessLevel?: number;
  roles?: string | string[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Component that guards its children based on permissions
 */
export const PermissionGuard: FC<PermissionGuardProps & { children: React.ReactNode }> = ({
  permissions,
  requireAll = false,
  minAccessLevel,
  roles,
  fallback,
  redirectTo,
  children,
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasAccessLevel,
    hasRole,
    hasAnyRole,
    currentUser 
  } = usePermissionCheck();

  // Check authentication first
  if (!currentUser) {
    return redirectTo ? <Navigate to={redirectTo} replace /> : null;
  }

  // Check roles if specified
  if (roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const hasRequiredRole = roleArray.length === 1 
      ? hasRole(roleArray[0]) 
      : hasAnyRole(roleArray);
    
    if (!hasRequiredRole) {
      return fallback ? <>{fallback}</> : <AccessDenied />;
    }
  }

  // Check permissions if specified
  if (permissions) {
    const permArray = Array.isArray(permissions) ? permissions : [permissions];
    let hasRequiredPermissions = false;

    if (requireAll) {
      hasRequiredPermissions = hasAllPermissions(permArray);
    } else {
      hasRequiredPermissions = permArray.length === 1 
        ? hasPermission(permArray[0]) 
        : hasAnyPermission(permArray);
    }

    if (!hasRequiredPermissions) {
      return fallback ? <>{fallback}</> : <AccessDenied />;
    }
  }

  // Check access level if specified
  if (minAccessLevel !== undefined && !hasAccessLevel(minAccessLevel)) {
    return fallback ? <>{fallback}</> : <AccessDenied />;
  }

  return <>{children}</>;
};

/**
 * Default access denied component
 */
const AccessDenied: FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      textAlign: 'center',
      p: 4,
    }}
  >
    <Lock size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
    <Typography variant="h5" gutterBottom>
      Access Denied
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
      You don't have permission to access this resource.
    </Typography>
    <Button variant="contained" onClick={() => window.history.back()}>
      Go Back
    </Button>
  </Box>
);

/**
 * HOC for wrapping components with permission guards
 */
export const withPermissionGuard = <P extends object>(
  Component: ComponentType<P>,
  guardProps: PermissionGuardProps
): FC<P> => {
  const GuardedComponent: FC<P> = (props) => (
    <PermissionGuard {...guardProps}>
      <Component {...props} />
    </PermissionGuard>
  );

  GuardedComponent.displayName = `withPermissionGuard(${Component.displayName || Component.name})`;

  return GuardedComponent;
};

/**
 * Component that renders children only if permissions are met
 */
export const CanAccess: FC<PermissionGuardProps & { children: React.ReactNode }> = ({
  permissions,
  requireAll = false,
  minAccessLevel,
  roles,
  children,
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    hasAccessLevel,
    hasRole,
    hasAnyRole,
    currentUser 
  } = usePermissionCheck();

  if (!currentUser) return null;

  // Check roles
  if (roles) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const hasRequiredRole = roleArray.length === 1 
      ? hasRole(roleArray[0]) 
      : hasAnyRole(roleArray);
    
    if (!hasRequiredRole) return null;
  }

  // Check permissions
  if (permissions) {
    const permArray = Array.isArray(permissions) ? permissions : [permissions];
    let hasRequiredPermissions = false;

    if (requireAll) {
      hasRequiredPermissions = hasAllPermissions(permArray);
    } else {
      hasRequiredPermissions = permArray.length === 1 
        ? hasPermission(permArray[0]) 
        : hasAnyPermission(permArray);
    }

    if (!hasRequiredPermissions) return null;
  }

  // Check access level
  if (minAccessLevel !== undefined && !hasAccessLevel(minAccessLevel)) {
    return null;
  }

  return <>{children}</>;
};