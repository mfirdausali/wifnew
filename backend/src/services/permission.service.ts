import { prisma } from '../config/database';
import { Prisma, UserRole } from '@prisma/client';
import { NotFoundError, ValidationError } from '../utils/errors';
import logger from '../utils/logger';

export class PermissionService {
  static async getUserPermissions(userId: string) {
    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get all permissions (role-based and direct)
    const [rolePermissions, directPermissions] = await Promise.all([
      this.getRolePermissions(user.role),
      this.getDirectPermissions(userId),
    ]);

    // Merge permissions, direct permissions override role permissions
    const permissionMap = new Map<string, any>();

    // Add role permissions
    rolePermissions.forEach(perm => {
      permissionMap.set(perm.code, {
        ...perm,
        source: 'role',
      });
    });

    // Add/override with direct permissions
    directPermissions.forEach(perm => {
      permissionMap.set(perm.permission.code, {
        ...perm.permission,
        source: 'direct',
        grantedAt: perm.grantedAt,
        grantedBy: perm.grantedBy,
        expiresAt: perm.expiresAt,
      });
    });

    return Array.from(permissionMap.values());
  }

  static async getRolePermissions(role: UserRole) {
    return await prisma.permission.findMany({
      where: {
        defaultForRoles: {
          has: role,
        },
      },
    });
  }

  static async getDirectPermissions(userId: string) {
    return await prisma.userPermission.findMany({
      where: {
        userId,
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        permission: true,
      },
    });
  }

  static async hasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(p => p.code === permissionCode);
  }

  static async hasAnyPermission(userId: string, permissionCodes: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const userPermissionCodes = permissions.map(p => p.code);
    return permissionCodes.some(code => userPermissionCodes.includes(code));
  }

  static async hasAllPermissions(userId: string, permissionCodes: string[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const userPermissionCodes = permissions.map(p => p.code);
    return permissionCodes.every(code => userPermissionCodes.includes(code));
  }

  static async assignPermissions(
    tx: Prisma.TransactionClient,
    userId: string,
    permissionCodes: string[],
    grantedBy: string
  ) {
    // Validate permissions exist
    const permissions = await tx.permission.findMany({
      where: { code: { in: permissionCodes } },
    });

    if (permissions.length !== permissionCodes.length) {
      const foundCodes = permissions.map(p => p.code);
      const missingCodes = permissionCodes.filter(code => !foundCodes.includes(code));
      throw new ValidationError(`Invalid permissions: ${missingCodes.join(', ')}`);
    }

    // Create user permissions
    const userPermissions = permissions.map(permission => ({
      userId,
      permissionId: permission.id,
      grantedBy,
      grantedAt: new Date(),
    }));

    await tx.userPermission.createMany({
      data: userPermissions,
      skipDuplicates: true,
    });

    logger.info('Permissions assigned', { userId, permissionCodes, grantedBy });
  }

  static async revokePermissions(
    userId: string,
    permissionCodes: string[],
    revokedBy: string
  ) {
    const permissions = await prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true },
    });

    const permissionIds = permissions.map(p => p.id);

    await prisma.userPermission.updateMany({
      where: {
        userId,
        permissionId: { in: permissionIds },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedBy,
      },
    });

    logger.info('Permissions revoked', { userId, permissionCodes, revokedBy });
  }

  static async updateRolePermissions(
    tx: Prisma.TransactionClient,
    userId: string,
    newRole: UserRole
  ) {
    // This is a placeholder - in a real system, you might want to:
    // 1. Revoke permissions that were only from the old role
    // 2. Grant new permissions from the new role
    // 3. Keep direct permissions intact
    
    logger.info('Role permissions updated', { userId, newRole });
  }

  static async getPermissionsByCategory() {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    const grouped = permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return grouped;
  }

  static async createPermission(data: {
    code: string;
    name: string;
    description?: string;
    category: string;
    module?: string;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    requires2fa?: boolean;
    requiresApproval?: boolean;
    defaultForRoles?: UserRole[];
  }) {
    return await prisma.permission.create({
      data: {
        ...data,
        defaultForRoles: data.defaultForRoles || [],
      },
    });
  }

  static async updatePermission(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      category: string;
      module: string;
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      requires2fa: boolean;
      requiresApproval: boolean;
      defaultForRoles: UserRole[];
    }>
  ) {
    return await prisma.permission.update({
      where: { id },
      data,
    });
  }

  static async deletePermission(id: string) {
    // Check if permission is in use
    const usageCount = await prisma.userPermission.count({
      where: { permissionId: id },
    });

    if (usageCount > 0) {
      throw new ValidationError('Cannot delete permission that is in use');
    }

    await prisma.permission.delete({
      where: { id },
    });
  }

  static async getPermissionUsage(permissionId: string) {
    const [directUsers, roleUsers] = await Promise.all([
      prisma.user.count({
        where: {
          permissions: {
            some: {
              permissionId,
              revokedAt: null,
            },
          },
        },
      }),
      prisma.permission.findUnique({
        where: { id: permissionId },
        select: { defaultForRoles: true },
      }),
    ]);

    let roleUserCount = 0;
    if (roleUsers?.defaultForRoles.length) {
      roleUserCount = await prisma.user.count({
        where: {
          role: { in: roleUsers.defaultForRoles as UserRole[] },
        },
      });
    }

    return {
      directUsers,
      roleUsers: roleUserCount,
      totalUsers: directUsers + roleUserCount,
    };
  }

  static async checkPermissionRequirements(
    userId: string,
    permissionCode: string
  ): Promise<{
    hasPermission: boolean;
    requires2fa: boolean;
    requiresApproval: boolean;
    is2faEnabled?: boolean;
  }> {
    const [permission, user] = await Promise.all([
      prisma.permission.findUnique({
        where: { code: permissionCode },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorEnabled: true },
      }),
    ]);

    if (!permission) {
      return {
        hasPermission: false,
        requires2fa: false,
        requiresApproval: false,
      };
    }

    const hasPermission = await this.hasPermission(userId, permissionCode);

    return {
      hasPermission,
      requires2fa: permission.requires2fa,
      requiresApproval: permission.requiresApproval,
      is2faEnabled: user?.twoFactorEnabled,
    };
  }
}