import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { UserRole } from '@prisma/client';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

export class ActivityController {
  // Get activity logs with filters
  static async getActivities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        userId,
        action,
        actionCategory,
        resourceType,
        resourceId,
        ipAddress,
        sessionId,
        dateFrom,
        dateTo,
        success,
        page = '1',
        limit = '50',
      } = req.query;

      // Check permissions
      if (userId && userId !== req.user?.id) {
        // Only admins or users with specific permission can view other users' activities
        if (req.user?.role !== UserRole.ADMIN && 
            !req.user?.permissions.includes('activity.view.all')) {
          throw new ForbiddenError('You can only view your own activities');
        }
      }

      const filter = {
        userId: userId as string || (req.user?.role !== UserRole.ADMIN ? req.user?.id : undefined),
        action: action as string,
        actionCategory: actionCategory as string,
        resourceType: resourceType as string,
        resourceId: resourceId as string,
        ipAddress: ipAddress as string,
        sessionId: sessionId as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        success: success === 'true' ? true : success === 'false' ? false : undefined,
      };

      const activities = await activityService.getActivities(
        filter,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json(activities);
    } catch (error) {
      next(error);
    }
  }

  // Get user activity timeline
  static async getUserActivityTimeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { days = '7' } = req.query;

      // Check permissions
      if (userId !== req.user?.id && 
          req.user?.role !== UserRole.ADMIN && 
          !req.user?.permissions.includes('activity.view.all')) {
        throw new ForbiddenError('You can only view your own activity timeline');
      }

      const timeline = await activityService.getUserActivityTimeline(
        userId,
        parseInt(days as string)
      );

      res.json({ timeline });
    } catch (error) {
      next(error);
    }
  }

  // Get activity statistics
  static async getActivityStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { dateFrom, dateTo, userId } = req.query;

      // Only admins or users with specific permission can view stats
      if (req.user?.role !== UserRole.ADMIN && 
          !req.user?.permissions.includes('activity.stats.view')) {
        throw new ForbiddenError('Insufficient permissions to view activity statistics');
      }

      const filter = {
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        userId: userId as string,
      };

      const stats = await activityService.getActivityStats(filter);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // Get current user's activities
  static async getMyActivities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        action,
        actionCategory,
        dateFrom,
        dateTo,
        page = '1',
        limit = '50',
      } = req.query;

      const filter = {
        userId: req.user!.id,
        action: action as string,
        actionCategory: actionCategory as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const activities = await activityService.getActivities(
        filter,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json(activities);
    } catch (error) {
      next(error);
    }
  }

  // Detect suspicious activity for a user
  static async checkSuspiciousActivity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      // Only admins or security personnel can check suspicious activity
      if (req.user?.role !== UserRole.ADMIN && 
          !req.user?.permissions.includes('security.suspicious.check')) {
        throw new ForbiddenError('Insufficient permissions to check suspicious activity');
      }

      const result = await activityService.detectSuspiciousActivity(userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Generate activity report for a user
  static async generateActivityReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      // Check permissions
      if (userId !== req.user?.id && 
          req.user?.role !== UserRole.ADMIN && 
          !req.user?.permissions.includes('activity.report.generate')) {
        throw new ForbiddenError('You can only generate reports for your own activities');
      }

      if (!startDate || !endDate) {
        throw new BadRequestError('Start date and end date are required');
      }

      const report = await activityService.createActivityReport(
        userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      // Log report generation
      await activityService.logActivity({
        userId: req.user!.id,
        action: 'ACTIVITY_REPORT_GENERATED',
        actionCategory: 'REPORT',
        resourceType: 'User',
        resourceId: userId,
        details: {
          period: { startDate, endDate },
          reportSize: JSON.stringify(report).length,
        },
      });

      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  // Export activity logs
  static async exportActivities(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        format = 'csv',
        userId,
        dateFrom,
        dateTo,
        actionCategory,
      } = req.query;

      // Only admins can export activity logs
      if (req.user?.role !== UserRole.ADMIN && 
          !req.user?.permissions.includes('activity.export')) {
        throw new ForbiddenError('Insufficient permissions to export activity logs');
      }

      const filter = {
        userId: userId as string,
        actionCategory: actionCategory as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      // Get all activities for export
      const { activities } = await activityService.getActivities(filter, 1, 10000);

      // Log export activity
      await activityService.logActivity({
        userId: req.user!.id,
        action: 'ACTIVITY_EXPORT',
        actionCategory: 'DATA_TRANSFER',
        details: {
          format,
          filters: filter,
          recordCount: activities.length,
        },
      });

      // Generate export based on format
      if (format === 'csv') {
        const csv = ActivityController.generateCSV(activities);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=activities.csv');
        res.send(csv);
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=activities.json');
        res.json(activities);
      } else {
        throw new BadRequestError('Invalid export format. Use csv or json');
      }
    } catch (error) {
      next(error);
    }
  }

  // Get real-time activity feed (for dashboard)
  static async getActivityFeed(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Only admins can view real-time feed
      if (req.user?.role !== UserRole.ADMIN && 
          !req.user?.permissions.includes('activity.feed.view')) {
        throw new ForbiddenError('Insufficient permissions to view activity feed');
      }

      const { limit = '20' } = req.query;

      const activities = await activityService.getActivities(
        {},
        1,
        parseInt(limit as string)
      );

      res.json({
        activities: activities.activities.map(activity => ({
          id: activity.id,
          user: activity.user,
          action: activity.action,
          actionCategory: activity.actionCategory,
          resourceType: activity.resourceType,
          resourceName: activity.resourceName,
          createdAt: activity.createdAt,
          responseStatus: activity.responseStatus,
          ipAddress: activity.ipAddress,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // Get activity categories and actions for filtering
  static async getActivityMetadata(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // This can be accessed by any authenticated user
      const metadata = {
        categories: [
          { value: 'AUTH', label: 'Authentication' },
          { value: 'USER', label: 'User Management' },
          { value: 'PERMISSION', label: 'Permissions' },
          { value: 'DATA_TRANSFER', label: 'Import/Export' },
          { value: 'DATA_MODIFICATION', label: 'Data Changes' },
          { value: 'HIGH_RISK', label: 'High Risk Operations' },
          { value: 'OTHER', label: 'Other' },
        ],
        actions: [
          // Auth actions
          { value: 'LOGIN', label: 'Login', category: 'AUTH' },
          { value: 'LOGIN_SUCCESS', label: 'Login Success', category: 'AUTH' },
          { value: 'LOGIN_FAILED', label: 'Login Failed', category: 'AUTH' },
          { value: 'LOGOUT', label: 'Logout', category: 'AUTH' },
          { value: 'PASSWORD_CHANGED', label: 'Password Changed', category: 'AUTH' },
          { value: 'TOKEN_REFRESH', label: 'Token Refresh', category: 'AUTH' },
          
          // User actions
          { value: 'USER_CREATE', label: 'Create User', category: 'USER' },
          { value: 'USER_UPDATE', label: 'Update User', category: 'USER' },
          { value: 'USER_DELETE', label: 'Delete User', category: 'USER' },
          { value: 'USER_VIEW', label: 'View User', category: 'USER' },
          
          // Permission actions
          { value: 'PERMISSION_GRANT', label: 'Grant Permission', category: 'PERMISSION' },
          { value: 'PERMISSION_REVOKE', label: 'Revoke Permission', category: 'PERMISSION' },
          
          // Data transfer actions
          { value: 'DATA_EXPORT', label: 'Export Data', category: 'DATA_TRANSFER' },
          { value: 'DATA_IMPORT', label: 'Import Data', category: 'DATA_TRANSFER' },
          
          // Bulk operations
          { value: 'BULK_UPDATE', label: 'Bulk Update', category: 'DATA_MODIFICATION' },
          { value: 'BULK_DELETE', label: 'Bulk Delete', category: 'DATA_MODIFICATION' },
        ],
        riskLevels: [
          { value: 'low', label: 'Low Risk', color: 'green' },
          { value: 'medium', label: 'Medium Risk', color: 'yellow' },
          { value: 'high', label: 'High Risk', color: 'orange' },
          { value: 'critical', label: 'Critical Risk', color: 'red' },
        ],
      };

      res.json(metadata);
    } catch (error) {
      next(error);
    }
  }

  // Helper method to generate CSV
  private static generateCSV(activities: any[]): string {
    const headers = [
      'Date',
      'Time',
      'User',
      'Action',
      'Category',
      'Resource Type',
      'Resource',
      'IP Address',
      'Status',
      'Response Time (ms)',
    ];

    const rows = activities.map(activity => [
      activity.createdAt.toISOString().split('T')[0],
      activity.createdAt.toISOString().split('T')[1].split('.')[0],
      activity.user?.email || 'Unknown',
      activity.action,
      activity.actionCategory || '',
      activity.resourceType || '',
      activity.resourceName || activity.resourceId || '',
      activity.ipAddress || '',
      activity.responseStatus || '',
      activity.responseTimeMs || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}