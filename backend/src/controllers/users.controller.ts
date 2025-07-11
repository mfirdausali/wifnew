import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../services/users.service';
import CacheService from '../services/cache.service';
import { EmailService } from '../services/email.service';
import { EventEmitter } from '../services/events.service';
import { 
  getPaginationParams, 
  generatePaginationLinks,
  pickAllowedFields,
  getObjectDiff,
  removeEmptyValues,
} from '@utils/helpers';
import { HTTP_STATUS } from '@utils/constants';
import { UserRole, UserStatus } from '@prisma/client';
import { 
  ValidationError, 
  ConflictError, 
  NotFoundError,
  ForbiddenError 
} from '@utils/errors';
import logger from '@utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    permissions: string[];
  };
}

interface ListUsersQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  roles?: UserRole[];
  departments?: string[];
  statuses?: UserStatus[];
  accessLevels?: number[];
  createdAfter?: string;
  createdBefore?: string;
  lastActiveAfter?: string;
  lastActiveBefore?: string;
  include?: string[];
  fields?: string[];
  isOnline?: boolean;
  hasNeverLoggedIn?: boolean;
  suspendedOnly?: boolean;
  withExpiredPasswords?: boolean;
}

export class UsersController {
  static async listUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 25,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search,
        roles,
        departments,
        statuses,
        accessLevels,
        createdAfter,
        createdBefore,
        lastActiveAfter,
        lastActiveBefore,
        include = [],
        fields,
        ...specialFilters
      } = req.query as ListUsersQueryParams;

      const { skip } = getPaginationParams({ page, limit });

      // Build filters
      const filters = {
        search,
        roles,
        departments,
        statuses,
        accessLevels,
        createdAfter,
        createdBefore,
        lastActiveAfter,
        lastActiveBefore,
        ...specialFilters,
      };

      // Get users
      const { users, total } = await UsersService.listUsers({
        filters,
        skip,
        limit,
        sortBy,
        sortOrder,
        include,
        fields,
      });

      // Get filter counts for UI
      const filterCounts = await UsersService.getFilterCounts(filters);

      // Build response
      const response = {
        success: true,
        data: users,
        meta: {
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1,
          },
          filters: {
            applied: removeEmptyValues(filters),
            available: filterCounts,
          },
          sorting: {
            field: sortBy,
            order: sortOrder,
          },
          ...(search && {
            search: {
              query: search,
              fields: ['firstName', 'lastName', 'email', 'position', 'department'],
              matches: total,
            },
          }),
        },
        links: generatePaginationLinks(req, { page, limit, total }),
      };

      res.status(HTTP_STATUS.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const createData = req.body;
      const createdBy = req.user!.id;

      // Create user
      const result = await UsersService.createUser(createData, createdBy);

      // Clear user list cache
      await CacheService.invalidatePattern('users-list:*');

      // Emit event for real-time updates
      EventEmitter.emit('user.created', {
        user: result.user,
        createdBy,
      });

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          user: result.user,
          welcomeEmailSent: result.welcomeEmailSent,
          verificationEmailSent: result.verificationEmailSent,
        },
        links: {
          self: `/api/users/${result.user.id}`,
          edit: `/api/users/${result.user.id}`,
          permissions: `/api/users/${result.user.id}/permissions`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { include = [], fields } = req.query as any;
      const requesterId = req.user!.id;

      const userDetails = await UsersService.getUserDetails(
        id,
        requesterId,
        req.user!.permissions,
        { include, fields }
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: userDetails,
        links: {
          self: `/api/users/${id}`,
          edit: `/api/users/${id}`,
          permissions: `/api/users/${id}/permissions`,
          activity: `/api/users/${id}/activity`,
          sessions: `/api/users/${id}/sessions`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updaterId = req.user!.id;
      const isOwnProfile = id === updaterId;

      const updatedUser = await UsersService.updateUser(
        id,
        updates,
        updaterId,
        req.user!,
        isOwnProfile
      );

      // Clear caches
      await Promise.all([
        CacheService.delete(`user:${id}`),
        CacheService.invalidatePattern('users-list:*'),
      ]);

      // Emit update event
      EventEmitter.emit('user.updated', {
        user: updatedUser,
        updatedBy: updaterId,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: updatedUser,
        links: {
          self: `/api/users/${id}`,
          permissions: `/api/users/${id}/permissions`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reassignTo, hardDelete, reason } = req.query as any;
      const deletedBy = req.user!.id;

      const result = await UsersService.deleteUser(
        id,
        deletedBy,
        req.user!,
        { reassignTo, hardDelete, reason }
      );

      // Clear caches
      await Promise.all([
        CacheService.delete(`user:${id}`),
        CacheService.invalidatePattern('users-list:*'),
        CacheService.invalidatePattern(`user-permissions:${id}:*`),
      ]);

      // Emit deletion event
      EventEmitter.emit('user.deleted', {
        userId: id,
        deletedBy,
        hardDelete: !!hardDelete,
        reassignedTo: reassignTo,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: hardDelete ? 'User permanently deleted' : 'User account deactivated',
        data: {
          deletedUserId: id,
          reassignedTo: reassignTo,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const statusData = req.body;

      const result = await UsersService.updateUserStatus(
        id,
        statusData,
        req.user!.id
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          userId: id,
          status: result.status,
          statusReason: result.statusReason,
          suspensionEndDate: result.suspensionEndDate,
          sessionsRevoked: result.sessionsRevoked,
          notificationSent: result.notificationSent,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const roleData = req.body;

      const result = await UsersService.updateUserRole(
        id,
        roleData,
        req.user!
      );

      // Clear permission cache
      await CacheService.invalidatePattern(`user-permissions:${id}:*`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpdateUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userIds, updates, options } = req.body;

      const results = await UsersService.bulkUpdateUsers(
        userIds,
        updates,
        options,
        req.user!
      );

      // Clear caches
      await CacheService.invalidatePattern('users-list:*');

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Updated ${successCount} users${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
        data: {
          total: userIds.length,
          succeeded: successCount,
          failed: failureCount,
          results,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async exportUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query as any;

      const { fileBuffer, contentType, filename } = await UsersService.exportUsers(
        query,
        req.user!
      );

      // Send file
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', fileBuffer.length.toString());
      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  }

  static async importUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { file, options } = req.body;

      const results = await UsersService.importUsers(
        file,
        options,
        req.user!.id
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }
}