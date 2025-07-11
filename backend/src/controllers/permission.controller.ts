import { Request, Response } from 'express';
import { PermissionService } from '../services/permission.service';
import { prisma } from '../config/database';
import { ValidationError } from '../utils/errors';
import logger from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class PermissionController {
  /**
   * Get all permissions grouped by category
   */
  static async getPermissions(req: Request, res: Response) {
    try {
      const permissions = await PermissionService.getPermissionsByCategory();
      
      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      logger.error('Error getting permissions', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch permissions',
      });
    }
  }

  /**
   * Get permission hierarchy
   */
  static async getPermissionHierarchy(req: Request, res: Response) {
    try {
      const hierarchy = await PermissionService.getPermissionHierarchy();
      
      res.json({
        success: true,
        data: hierarchy,
      });
    } catch (error) {
      logger.error('Error getting permission hierarchy', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch permission hierarchy',
      });
    }
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const includeHierarchy = req.query.includeHierarchy === 'true';

      const permissions = includeHierarchy
        ? await PermissionService.getEffectivePermissions(userId)
        : await PermissionService.getUserPermissions(userId);

      res.json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      logger.error('Error getting user permissions', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user permissions',
      });
    }
  }

  /**
   * Grant permissions to user
   */
  static async grantPermissions(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { permissions, reason, expiresAt } = req.body;

      if (!permissions || !Array.isArray(permissions)) {
        throw new ValidationError('Permissions array is required');
      }

      await prisma.$transaction(async (tx) => {
        // Grant each permission
        for (const permissionCode of permissions) {
          const permission = await tx.permission.findUnique({
            where: { code: permissionCode },
          });

          if (!permission) {
            throw new ValidationError(`Invalid permission: ${permissionCode}`);
          }

          await tx.userPermission.create({
            data: {
              userId,
              permissionId: permission.id,
              grantedBy: req.user!.id,
              grantedAt: new Date(),
              grantReason: reason,
              expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
          });
        }

        // Log audit event
        await tx.auditLog.create({
          data: {
            userId: req.user!.id,
            targetUserId: userId,
            action: 'permission.grant',
            actionCategory: 'permission',
            targetType: 'user',
            targetId: userId,
            details: {
              permissions,
              reason,
              expiresAt,
            },
          },
        });
      });

      // Fetch updated permissions
      const updatedPermissions = await PermissionService.getUserPermissions(userId);

      res.json({
        success: true,
        message: 'Permissions granted successfully',
        data: updatedPermissions,
      });
    } catch (error) {
      logger.error('Error granting permissions', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to grant permissions',
      });
    }
  }

  /**
   * Revoke permissions from user
   */
  static async revokePermissions(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { permissions, reason } = req.body;

      if (!permissions || !Array.isArray(permissions)) {
        throw new ValidationError('Permissions array is required');
      }

      await prisma.$transaction(async (tx) => {
        await PermissionService.revokePermissions(userId, permissions, req.user!.id);

        // Log audit event
        await tx.auditLog.create({
          data: {
            userId: req.user!.id,
            targetUserId: userId,
            action: 'permission.revoke',
            actionCategory: 'permission',
            targetType: 'user',
            targetId: userId,
            details: {
              permissions,
              reason,
            },
          },
        });
      });

      // Fetch updated permissions
      const updatedPermissions = await PermissionService.getUserPermissions(userId);

      res.json({
        success: true,
        message: 'Permissions revoked successfully',
        data: updatedPermissions,
      });
    } catch (error) {
      logger.error('Error revoking permissions', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to revoke permissions',
      });
    }
  }

  /**
   * Grant temporary permission
   */
  static async grantTemporaryPermission(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { permission, hours, reason } = req.body;

      if (!permission || !hours) {
        throw new ValidationError('Permission and hours are required');
      }

      await prisma.$transaction(async (tx) => {
        await PermissionService.grantTemporaryPermission(
          userId,
          permission,
          req.user!.id,
          hours
        );

        // Log audit event
        await tx.auditLog.create({
          data: {
            userId: req.user!.id,
            targetUserId: userId,
            action: 'permission.grant_temporary',
            actionCategory: 'permission',
            targetType: 'user',
            targetId: userId,
            details: {
              permission,
              hours,
              reason,
            },
          },
        });
      });

      res.json({
        success: true,
        message: `Temporary permission granted for ${hours} hours`,
      });
    } catch (error) {
      logger.error('Error granting temporary permission', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to grant temporary permission',
      });
    }
  }

  /**
   * Clone permissions from one user to another
   */
  static async clonePermissions(req: AuthRequest, res: Response) {
    try {
      const { sourceUserId, targetUserId } = req.body;

      if (!sourceUserId || !targetUserId) {
        throw new ValidationError('Source and target user IDs are required');
      }

      await prisma.$transaction(async (tx) => {
        await PermissionService.clonePermissions(
          sourceUserId,
          targetUserId,
          req.user!.id
        );

        // Log audit event
        await tx.auditLog.create({
          data: {
            userId: req.user!.id,
            targetUserId: targetUserId,
            action: 'permission.clone',
            actionCategory: 'permission',
            targetType: 'user',
            targetId: targetUserId,
            details: {
              sourceUserId,
              targetUserId,
            },
          },
        });
      });

      const clonedPermissions = await PermissionService.getUserPermissions(targetUserId);

      res.json({
        success: true,
        message: 'Permissions cloned successfully',
        data: clonedPermissions,
      });
    } catch (error) {
      logger.error('Error cloning permissions', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clone permissions',
      });
    }
  }

  /**
   * Get permission audit log for a user
   */
  static async getPermissionAuditLog(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const logs = await PermissionService.getPermissionAuditLog(userId, limit);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      logger.error('Error getting permission audit log', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch permission audit log',
      });
    }
  }

  /**
   * Check user permission
   */
  static async checkPermission(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { permission } = req.query;

      if (!permission) {
        throw new ValidationError('Permission code is required');
      }

      const hasPermission = await PermissionService.hasPermission(
        userId,
        permission as string
      );

      const requirements = await PermissionService.checkPermissionRequirements(
        userId,
        permission as string
      );

      res.json({
        success: true,
        data: {
          hasPermission,
          ...requirements,
        },
      });
    } catch (error) {
      logger.error('Error checking permission', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check permission',
      });
    }
  }

  /**
   * Get expired permissions
   */
  static async getExpiredPermissions(req: Request, res: Response) {
    try {
      const expired = await PermissionService.getExpiredPermissions();

      res.json({
        success: true,
        data: expired,
      });
    } catch (error) {
      logger.error('Error getting expired permissions', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch expired permissions',
      });
    }
  }

  /**
   * Cleanup expired permissions
   */
  static async cleanupExpiredPermissions(req: AuthRequest, res: Response) {
    try {
      const count = await PermissionService.cleanupExpiredPermissions();

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'permission.cleanup_expired',
          actionCategory: 'permission',
          targetType: 'system',
          details: {
            count,
          },
        },
      });

      res.json({
        success: true,
        message: `Cleaned up ${count} expired permissions`,
        data: { count },
      });
    } catch (error) {
      logger.error('Error cleaning up expired permissions', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup expired permissions',
      });
    }
  }

  /**
   * Create a new permission
   */
  static async createPermission(req: AuthRequest, res: Response) {
    try {
      const permissionData = req.body;

      const permission = await PermissionService.createPermission(permissionData);

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'permission.create',
          actionCategory: 'permission',
          targetType: 'permission',
          targetId: permission.id,
          details: permissionData,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Permission created successfully',
        data: permission,
      });
    } catch (error) {
      logger.error('Error creating permission', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create permission',
      });
    }
  }

  /**
   * Update a permission
   */
  static async updatePermission(req: AuthRequest, res: Response) {
    try {
      const { permissionId } = req.params;
      const updateData = req.body;

      const permission = await PermissionService.updatePermission(
        permissionId,
        updateData
      );

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'permission.update',
          actionCategory: 'permission',
          targetType: 'permission',
          targetId: permissionId,
          details: updateData,
        },
      });

      res.json({
        success: true,
        message: 'Permission updated successfully',
        data: permission,
      });
    } catch (error) {
      logger.error('Error updating permission', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update permission',
      });
    }
  }

  /**
   * Delete a permission
   */
  static async deletePermission(req: AuthRequest, res: Response) {
    try {
      const { permissionId } = req.params;

      await PermissionService.deletePermission(permissionId);

      // Log audit event
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'permission.delete',
          actionCategory: 'permission',
          targetType: 'permission',
          targetId: permissionId,
          details: {},
        },
      });

      res.json({
        success: true,
        message: 'Permission deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting permission', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete permission',
      });
    }
  }
}