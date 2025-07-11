import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { PermissionService } from '../services/permission.service';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
  sessionId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = await TokenService.verifyToken(token);

    // Get user permissions
    const permissions = await PermissionService.getUserPermissions(payload.userId);
    const permissionCodes = permissions.map(p => p.code);

    // Attach user info to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
      permissions: permissionCodes,
    };
    req.sessionId = payload.sessionId;

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization (backward compatible)
export const authorizeRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

// Permission-based authorization (new)
export const authorize = (...requiredPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // If user permissions not loaded yet, load them
    if (!req.user.permissions) {
      const permissions = await PermissionService.getUserPermissions(req.user.id);
      req.user.permissions = permissions.map(p => p.code);
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        userPermissions: req.user.permissions,
        requiredPermissions,
        path: req.path,
      });
      
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

// Check any of the required permissions
export const authorizeAny = (...requiredPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    // If user permissions not loaded yet, load them
    if (!req.user.permissions) {
      const permissions = await PermissionService.getUserPermissions(req.user.id);
      req.user.permissions = permissions.map(p => p.code);
    }

    // Check if user has any of the required permissions
    const hasAnyPermission = requiredPermissions.some(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasAnyPermission) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        userPermissions: req.user.permissions,
        requiredPermissions,
        path: req.path,
      });
      
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await TokenService.verifyToken(token);

      // Get user permissions
      const permissions = await PermissionService.getUserPermissions(payload.userId);
      const permissionCodes = permissions.map(p => p.code);

      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
        permissions: permissionCodes,
      };
      req.sessionId = payload.sessionId;
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};