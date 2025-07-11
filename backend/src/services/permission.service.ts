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

  // New methods for hierarchical permissions
  static async getEffectivePermissions(userId: string) {
    const directPermissions = await this.getUserPermissions(userId);
    const permissionIds = directPermissions.map(p => p.id);

    // Get all child permissions
    const childPermissions = await prisma.permission.findMany({
      where: {
        path: {
          contains: permissionIds.join(','),
        },
      },
    });

    // Combine and deduplicate
    const allPermissions = [...directPermissions, ...childPermissions];
    const uniquePermissions = Array.from(
      new Map(allPermissions.map(p => [p.id, p])).values()
    );

    return uniquePermissions;
  }

  static async getPermissionHierarchy() {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { level: 'asc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    // Build tree structure
    const permissionMap = new Map<string, any>();
    const rootPermissions: any[] = [];

    permissions.forEach(permission => {
      const node = {
        ...permission,
        children: [],
      };
      permissionMap.set(permission.id, node);

      if (!permission.parentId) {
        rootPermissions.push(node);
      }
    });

    // Link children to parents
    permissions.forEach(permission => {
      if (permission.parentId) {
        const parent = permissionMap.get(permission.parentId);
        if (parent) {
          parent.children.push(permissionMap.get(permission.id));
        }
      }
    });

    return rootPermissions;
  }

  static async hasResourcePermission(
    userId: string,
    resourceType: string,
    resourceId: string,
    permissionType: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    // Check if user has direct permission on the resource
    const permission = `${resourceType}.${permissionType}`;
    const hasGeneralPermission = await this.hasPermission(userId, permission);

    if (hasGeneralPermission) {
      return true;
    }

    // Check if user has ownership or specific access to the resource
    // This would need to be implemented based on your resource access model
    // For example, checking if user owns the resource or has been granted access
    
    return false;
  }

  static async hasDepartmentPermission(
    userId: string,
    departmentId: string,
    permissionType: 'manage' | 'view' | 'edit'
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        departmentsManaged: true,
        departmentsDeputy: true,
      },
    });

    if (!user) {
      return false;
    }

    // Check if user is admin
    if (user.role === 'ADMIN') {
      return true;
    }

    // Check if user manages the department
    if (permissionType === 'manage') {
      return user.departmentsManaged.some(d => d.id === departmentId) ||
             user.departmentsDeputy.some(d => d.id === departmentId);
    }

    // Check if user belongs to the department
    if (permissionType === 'view') {
      return user.departmentId === departmentId ||
             user.departmentsManaged.some(d => d.id === departmentId) ||
             user.departmentsDeputy.some(d => d.id === departmentId);
    }

    // Check specific department permissions
    const hasPermission = await this.hasPermission(
      userId,
      `department.${permissionType}`
    );

    return hasPermission;
  }

  static async getUserWithDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        accessLevel: true,
        twoFactorEnabled: true,
        status: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  static async grantTemporaryPermission(
    userId: string,
    permissionCode: string,
    grantedBy: string,
    expiresIn: number // hours
  ) {
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode },
    });

    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresIn);

    await prisma.userPermission.create({
      data: {
        userId,
        permissionId: permission.id,
        grantedBy,
        grantedAt: new Date(),
        expiresAt,
        grantReason: `Temporary permission granted for ${expiresIn} hours`,
      },
    });

    logger.info('Temporary permission granted', {
      userId,
      permissionCode,
      grantedBy,
      expiresAt,
    });
  }

  static async getPermissionAuditLog(
    userId: string,
    limit: number = 50
  ) {
    const logs = await prisma.userPermission.findMany({
      where: { userId },
      include: {
        permission: true,
        grantedByUser: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        revokedByUser: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: { grantedAt: 'desc' },
      take: limit,
    });

    return logs;
  }

  static async getExpiredPermissions() {
    const expired = await prisma.userPermission.findMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
        revokedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        permission: true,
      },
    });

    return expired;
  }

  static async cleanupExpiredPermissions() {
    const result = await prisma.userPermission.updateMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: 'Permission expired',
      },
    });

    logger.info('Expired permissions cleaned up', {
      count: result.count,
    });

    return result.count;
  }

  static async clonePermissions(
    sourceUserId: string,
    targetUserId: string,
    clonedBy: string
  ) {
    const sourcePermissions = await this.getDirectPermissions(sourceUserId);

    const permissionsToCreate = sourcePermissions.map(sp => ({
      userId: targetUserId,
      permissionId: sp.permissionId,
      grantedBy: clonedBy,
      grantedAt: new Date(),
      grantReason: `Cloned from user ${sourceUserId}`,
      canDelegate: sp.canDelegate,
      delegationLimit: sp.delegationLimit,
    }));

    await prisma.userPermission.createMany({
      data: permissionsToCreate,
      skipDuplicates: true,
    });

    logger.info('Permissions cloned', {
      sourceUserId,
      targetUserId,
      clonedBy,
      count: permissionsToCreate.length,
    });
  }
}