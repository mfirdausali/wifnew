import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service';
import logger from '../utils/logger';

interface ActivityRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
  sessionId?: string;
  startTime?: number;
}

// List of paths to exclude from activity logging
const EXCLUDED_PATHS = [
  '/health',
  '/api/health',
  '/favicon.ico',
  '/robots.txt',
  '/metrics',
];

// List of sensitive paths that should log minimal data
const SENSITIVE_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/password',
  '/users/password',
];

export const activityLogger = (req: ActivityRequest, res: Response, next: NextFunction) => {
  // Skip if path is excluded
  if (EXCLUDED_PATHS.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Skip if user is not authenticated (except for auth endpoints)
  if (!req.user && !req.path.startsWith('/auth')) {
    return next();
  }

  // Record start time
  req.startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;
  const originalJson = res.json;
  const originalSend = res.send;

  // Track response
  let responseBody: any;
  let responseCaptured = false;

  // Override json method to capture response
  res.json = function(body: any) {
    responseBody = body;
    responseCaptured = true;
    return originalJson.call(this, body);
  };

  // Override send method to capture response
  res.send = function(body: any) {
    if (!responseCaptured) {
      responseBody = body;
    }
    return originalSend.call(this, body);
  };

  // Override end method to log activity
  res.end = function(...args: any[]) {
    // Calculate response time
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;

    // Log activity asynchronously
    if (req.user?.id || req.path.startsWith('/auth')) {
      const isSensitivePath = SENSITIVE_PATHS.some(path => req.path.startsWith(path));
      
      activityService.logHttpActivity(req, res, responseTime).catch(error => {
        logger.error('Failed to log activity:', error);
      });

      // Log specific auth activities
      if (req.path === '/auth/login' && res.statusCode === 200) {
        activityService.logActivity({
          userId: responseBody?.user?.id || 'unknown',
          action: 'LOGIN_SUCCESS',
          actionCategory: 'AUTH',
          ipAddress: activityService['getClientIp'](req),
          userAgent: req.get('user-agent'),
          details: {
            loginMethod: req.body?.loginMethod || 'password',
          },
        }).catch(error => {
          logger.error('Failed to log login activity:', error);
        });
      } else if (req.path === '/auth/login' && res.statusCode === 401) {
        activityService.logActivity({
          userId: req.body?.email || 'unknown',
          action: 'LOGIN_FAILED',
          actionCategory: 'AUTH',
          ipAddress: activityService['getClientIp'](req),
          userAgent: req.get('user-agent'),
          errorMessage: 'Invalid credentials',
          details: {
            email: req.body?.email,
          },
        }).catch(error => {
          logger.error('Failed to log failed login activity:', error);
        });
      }

      // Log logout
      if (req.path === '/auth/logout' && res.statusCode === 200) {
        activityService.logActivity({
          userId: req.user?.id || 'unknown',
          action: 'LOGOUT',
          actionCategory: 'AUTH',
          ipAddress: activityService['getClientIp'](req),
          userAgent: req.get('user-agent'),
          sessionId: req.sessionId,
        }).catch(error => {
          logger.error('Failed to log logout activity:', error);
        });
      }

      // Log password changes
      if (req.path.includes('/password') && req.method === 'POST' && res.statusCode === 200) {
        activityService.logActivity({
          userId: req.user?.id || 'unknown',
          action: 'PASSWORD_CHANGED',
          actionCategory: 'AUTH',
          ipAddress: activityService['getClientIp'](req),
          userAgent: req.get('user-agent'),
        }).catch(error => {
          logger.error('Failed to log password change activity:', error);
        });
      }

      // Log permission changes
      if (req.path.includes('/permissions') && req.method === 'POST' && res.statusCode === 200) {
        activityService.logActivity({
          userId: req.user?.id || 'unknown',
          action: 'PERMISSION_GRANTED',
          actionCategory: 'PERMISSION',
          resourceType: 'User',
          resourceId: req.params.userId || req.body?.userId,
          details: {
            permissions: req.body?.permissions,
            grantedBy: req.user?.id,
          },
        }).catch(error => {
          logger.error('Failed to log permission grant activity:', error);
        });
      }

      // Log bulk operations
      if (req.path.includes('/bulk') && res.statusCode === 200) {
        const action = req.method === 'DELETE' ? 'BULK_DELETE' : 
                      req.method === 'PUT' ? 'BULK_UPDATE' : 'BULK_OPERATION';
        
        activityService.logActivity({
          userId: req.user?.id || 'unknown',
          action,
          actionCategory: 'DATA_MODIFICATION',
          details: {
            affectedCount: responseBody?.affected || responseBody?.count,
            operation: req.path,
          },
        }).catch(error => {
          logger.error('Failed to log bulk operation activity:', error);
        });
      }

      // Log exports
      if (req.path.includes('/export') && res.statusCode === 200) {
        activityService.logActivity({
          userId: req.user?.id || 'unknown',
          action: 'DATA_EXPORT',
          actionCategory: 'DATA_TRANSFER',
          details: {
            format: req.query.format || 'csv',
            filters: req.query,
            recordCount: responseBody?.count,
          },
        }).catch(error => {
          logger.error('Failed to log export activity:', error);
        });
      }

      // Log imports
      if (req.path.includes('/import') && res.statusCode === 200) {
        activityService.logActivity({
          userId: req.user?.id || 'unknown',
          action: 'DATA_IMPORT',
          actionCategory: 'DATA_TRANSFER',
          details: {
            filename: req.file?.filename || req.body?.filename,
            recordCount: responseBody?.imported || responseBody?.count,
            errors: responseBody?.errors,
          },
        }).catch(error => {
          logger.error('Failed to log import activity:', error);
        });
      }
    }

    // Call original end
    return originalEnd.apply(res, args);
  };

  next();
};

// Middleware to check for suspicious activity
export const suspiciousActivityCheck = async (
  req: ActivityRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.id) {
    return next();
  }

  try {
    const { suspicious, reasons } = await activityService.detectSuspiciousActivity(req.user.id);
    
    if (suspicious) {
      logger.warn('Suspicious activity detected', {
        userId: req.user.id,
        reasons,
        path: req.path,
        ip: activityService['getClientIp'](req),
      });

      // Emit event for real-time notifications
      activityService.emit('security:suspicious_activity', {
        userId: req.user.id,
        reasons,
        timestamp: new Date(),
      });

      // Add security flag to request
      (req as any).securityFlags = reasons;
    }
  } catch (error) {
    logger.error('Failed to check suspicious activity:', error);
  }

  next();
};

// Middleware for high-risk operations
export const highRiskOperationLogger = (operationType: string) => {
  return async (req: ActivityRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return next();
    }

    // Log the attempt
    await activityService.logActivity({
      userId: req.user.id,
      action: `${operationType}_ATTEMPTED`,
      actionCategory: 'HIGH_RISK',
      method: req.method,
      path: req.path,
      ipAddress: activityService['getClientIp'](req),
      userAgent: req.get('user-agent'),
      sessionId: req.sessionId,
      details: {
        operationType,
        params: req.params,
        query: req.query,
      },
    });

    // Check if user has been performing too many high-risk operations
    const last5Minutes = new Date();
    last5Minutes.setMinutes(last5Minutes.getMinutes() - 5);

    const recentHighRiskOps = await activityService.getActivities({
      userId: req.user.id,
      actionCategory: 'HIGH_RISK',
      dateFrom: last5Minutes,
    });

    if (recentHighRiskOps.total > 10) {
      logger.warn('Too many high-risk operations', {
        userId: req.user.id,
        count: recentHighRiskOps.total,
        operations: recentHighRiskOps.activities.map(a => a.action),
      });

      return res.status(429).json({
        error: 'Too many high-risk operations. Please try again later.',
        retryAfter: 300, // 5 minutes
      });
    }

    next();
  };
};