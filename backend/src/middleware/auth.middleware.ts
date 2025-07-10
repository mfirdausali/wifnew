import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@services/token.service';
import { UnauthorizedError } from '@utils/errors';
import { UserRole } from '@prisma/client';
import logger from '@utils/logger';

export const authenticate = async (
  req: Request,
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

    // Attach user info to request
    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    req.sessionId = payload.sessionId;

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      logger.warn('Unauthorized access attempt', {
        userId: req.user.id,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });
      
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await TokenService.verifyToken(token);

      req.user = {
        id: payload.userId,
        email: payload.email,
        role: payload.role,
      };
      req.sessionId = payload.sessionId;
    }

    next();
  } catch (error) {
    // If token is invalid, continue without user
    next();
  }
};