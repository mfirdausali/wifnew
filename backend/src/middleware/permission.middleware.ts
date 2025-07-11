import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/permission.service';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

interface PermissionRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    accessLevel: number;
  };
}

export interface PermissionOptions {
  requireAll?: boolean; // Require all permissions (AND logic)
  requireAny?: boolean; // Require any permission (OR logic)
  checkAccessLevel?: boolean; // Check minimum access level
  minAccessLevel?: number; // Minimum access level required
  checkHierarchy?: boolean; // Check hierarchical permissions
  require2fa?: boolean; // Require 2FA for this endpoint
  customCheck?: (req: PermissionRequest) => Promise<boolean>; // Custom permission check
}

/**
 * Advanced permission checking middleware
 */
export const checkPermissions = (
  permissions: string[],
  options: PermissionOptions = {}
) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const { 
        requireAll = true, 
        requireAny = false,
        checkAccessLevel = false,
        minAccessLevel = 1,
        checkHierarchy = false,
        require2fa = false,
        customCheck
      } = options;

      // Check 2FA requirement
      if (require2fa) {
        const user = await PermissionService.getUserWithDetails(req.user.id);
        if (!user.twoFactorEnabled) {
          throw new ForbiddenError('Two-factor authentication required for this action');
        }
      }

      // Get user's effective permissions (including hierarchical)
      const userPermissions = checkHierarchy 
        ? await PermissionService.getEffectivePermissions(req.user.id)
        : await PermissionService.getUserPermissions(req.user.id);

      const userPermissionCodes = userPermissions.map(p => p.code);

      // Check access level if required
      if (checkAccessLevel && req.user.accessLevel < minAccessLevel) {
        logger.warn('Access level insufficient', {
          userId: req.user.id,
          userAccessLevel: req.user.accessLevel,
          requiredAccessLevel: minAccessLevel,
          path: req.path
        });
        throw new ForbiddenError('Insufficient access level');
      }

      // Check permissions based on logic type
      let hasPermission = false;
      
      if (requireAll) {
        hasPermission = permissions.every(p => userPermissionCodes.includes(p));
      } else if (requireAny) {
        hasPermission = permissions.some(p => userPermissionCodes.includes(p));
      }

      // Run custom check if provided
      if (hasPermission && customCheck) {
        hasPermission = await customCheck(req);
      }

      if (!hasPermission) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          requiredPermissions: permissions,
          userPermissions: userPermissionCodes,
          path: req.path,
          method: req.method
        });
        throw new ForbiddenError('Insufficient permissions');
      }

      // Log permission check for audit
      logger.debug('Permission check passed', {
        userId: req.user.id,
        permissions: permissions,
        path: req.path
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has permission to access a specific resource
 */
export const checkResourcePermission = (
  resourceType: string,
  getResourceId: (req: PermissionRequest) => string,
  permissionType: 'read' | 'write' | 'delete' = 'read'
) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const resourceId = getResourceId(req);
      const permission = `${resourceType}.${permissionType}`;

      // Check if user has general permission
      const hasGeneralPermission = await PermissionService.hasPermission(
        req.user.id, 
        permission
      );

      // Check if user has specific resource permission
      const hasResourcePermission = await PermissionService.hasResourcePermission(
        req.user.id,
        resourceType,
        resourceId,
        permissionType
      );

      if (!hasGeneralPermission && !hasResourcePermission) {
        logger.warn('Resource permission denied', {
          userId: req.user.id,
          resourceType,
          resourceId,
          permissionType,
          path: req.path
        });
        throw new ForbiddenError('No permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Dynamic permission checking based on request context
 */
export const checkDynamicPermission = (
  getPermission: (req: PermissionRequest) => string | string[]
) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const requiredPermissions = getPermission(req);
      const permissionsArray = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      const hasPermissions = await PermissionService.hasAllPermissions(
        req.user.id,
        permissionsArray
      );

      if (!hasPermissions) {
        logger.warn('Dynamic permission check failed', {
          userId: req.user.id,
          requiredPermissions: permissionsArray,
          path: req.path
        });
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has permission with specific conditions
 */
export const checkConditionalPermission = (
  permission: string,
  condition: (req: PermissionRequest) => Promise<boolean>
) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const hasPermission = await PermissionService.hasPermission(
        req.user.id,
        permission
      );

      if (!hasPermission) {
        throw new ForbiddenError('Insufficient permissions');
      }

      const conditionMet = await condition(req);
      if (!conditionMet) {
        logger.warn('Permission condition not met', {
          userId: req.user.id,
          permission,
          path: req.path
        });
        throw new ForbiddenError('Permission conditions not met');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check department-based permissions
 */
export const checkDepartmentPermission = (
  permissionType: 'manage' | 'view' | 'edit'
) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const departmentId = req.params.departmentId || req.body.departmentId;
      if (!departmentId) {
        throw new ForbiddenError('Department ID required');
      }

      const hasPermission = await PermissionService.hasDepartmentPermission(
        req.user.id,
        departmentId,
        permissionType
      );

      if (!hasPermission) {
        logger.warn('Department permission denied', {
          userId: req.user.id,
          departmentId,
          permissionType,
          path: req.path
        });
        throw new ForbiddenError('No permission for this department');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limit based on permission level
 */
export const permissionBasedRateLimit = (
  baseLimit: number,
  permissionMultipliers: Record<string, number>
) => {
  return async (req: PermissionRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        req.rateLimit = baseLimit;
        return next();
      }

      const userPermissions = await PermissionService.getUserPermissions(req.user.id);
      const userPermissionCodes = userPermissions.map(p => p.code);

      let maxMultiplier = 1;
      for (const [permission, multiplier] of Object.entries(permissionMultipliers)) {
        if (userPermissionCodes.includes(permission)) {
          maxMultiplier = Math.max(maxMultiplier, multiplier);
        }
      }

      req.rateLimit = baseLimit * maxMultiplier;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Export convenience functions
export const requirePermissions = (...permissions: string[]) => 
  checkPermissions(permissions, { requireAll: true });

export const requireAnyPermission = (...permissions: string[]) => 
  checkPermissions(permissions, { requireAny: true });

export const requirePermissionWithAccessLevel = (
  permission: string, 
  minAccessLevel: number
) => checkPermissions([permission], { 
  requireAll: true, 
  checkAccessLevel: true, 
  minAccessLevel 
});