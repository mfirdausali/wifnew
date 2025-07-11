import { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../config/database';

export class UsersRepository {
  static async findById(id: string, options?: {
    includeDeleted?: boolean;
    include?: Prisma.UserInclude;
    select?: Prisma.UserSelect;
  }) {
    const where: Prisma.UserWhereUniqueInput = { id };
    
    if (!options?.includeDeleted) {
      Object.assign(where, { deletedAt: null });
    }

    return await prisma.user.findUnique({
      where,
      include: options?.include,
      select: options?.select,
    });
  }

  static async findByEmail(email: string, options?: {
    includeDeleted?: boolean;
  }) {
    return await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  static async findMany(options: {
    where?: Prisma.UserWhereInput;
    include?: Prisma.UserInclude;
    select?: Prisma.UserSelect;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return await prisma.user.findMany(options);
  }

  static async count(where?: Prisma.UserWhereInput) {
    return await prisma.user.count({ where });
  }

  static async create(data: Prisma.UserCreateInput) {
    return await prisma.user.create({ data });
  }

  static async update(id: string, data: Prisma.UserUpdateInput) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  static async updateMany(where: Prisma.UserWhereInput, data: Prisma.UserUpdateInput) {
    return await prisma.user.updateMany({
      where,
      data,
    });
  }

  static async delete(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  static async softDelete(id: string, deletedBy: string) {
    return await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        status: UserStatus.INACTIVE,
      },
    });
  }

  static async groupBy<T extends Prisma.UserGroupByArgs>(args: T) {
    return await prisma.user.groupBy(args);
  }

  static async aggregate<T extends Prisma.UserAggregateArgs>(args: T) {
    return await prisma.user.aggregate(args);
  }

  // Custom queries
  static async findUsersWithPermission(permissionCode: string) {
    return await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            permissions: {
              some: {
                permission: { code: permissionCode },
                expiresAt: { gt: new Date() },
                revokedAt: null,
              },
            },
          },
          {
            role: {
              in: await this.getRolesWithPermission(permissionCode),
            },
          },
        ],
      },
    });
  }

  static async getRolesWithPermission(permissionCode: string): Promise<UserRole[]> {
    const permission = await prisma.permission.findUnique({
      where: { code: permissionCode },
      select: { defaultForRoles: true },
    });

    return (permission?.defaultForRoles || []) as UserRole[];
  }

  static async findSubordinates(managerId: string, recursive = false): Promise<User[]> {
    if (!recursive) {
      return await prisma.user.findMany({
        where: {
          managerId,
          deletedAt: null,
        },
      });
    }

    // Recursive query to get all subordinates in hierarchy
    const result = await prisma.$queryRaw<User[]>`
      WITH RECURSIVE subordinates AS (
        SELECT * FROM users WHERE manager_id = ${managerId} AND deleted_at IS NULL
        UNION ALL
        SELECT u.* FROM users u
        INNER JOIN subordinates s ON u.manager_id = s.id
        WHERE u.deleted_at IS NULL
      )
      SELECT * FROM subordinates;
    `;

    return result;
  }

  static async findByDepartment(departmentId: string, options?: {
    includeSubDepartments?: boolean;
  }) {
    if (!options?.includeSubDepartments) {
      return await prisma.user.findMany({
        where: {
          departmentId,
          deletedAt: null,
        },
      });
    }

    // Get department and all sub-departments
    const departments = await prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE dept_tree AS (
        SELECT id FROM departments WHERE id = ${departmentId}
        UNION ALL
        SELECT d.id FROM departments d
        INNER JOIN dept_tree dt ON d.parent_id = dt.id
      )
      SELECT id FROM dept_tree;
    `;

    const departmentIds = departments.map(d => d.id);

    return await prisma.user.findMany({
      where: {
        departmentId: { in: departmentIds },
        deletedAt: null,
      },
    });
  }

  static async getActiveSessionCount(userId: string): Promise<number> {
    return await prisma.userSession.count({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  static async getLastActivity(userId: string) {
    return await prisma.userActivityLog.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateLastActivity(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { lastActivityAt: new Date() },
    });
  }

  static async incrementLoginCount(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        loginCount: { increment: 1 },
        lastLoginAt: new Date(),
      },
    });
  }

  static async incrementFailedLoginCount(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: { increment: 1 },
        failedLoginLastAt: new Date(),
      },
    });
  }

  static async resetFailedLoginCount(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: 0,
        failedLoginLastAt: null,
      },
    });
  }

  static async findUsersWithExpiredPasswords() {
    return await prisma.user.findMany({
      where: {
        deletedAt: null,
        passwordExpiresAt: { lt: new Date() },
        status: UserStatus.ACTIVE,
      },
    });
  }

  static async findInactiveUsers(days: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await prisma.user.findMany({
      where: {
        deletedAt: null,
        lastActivityAt: { lt: cutoffDate },
        status: UserStatus.ACTIVE,
      },
    });
  }

  static async findUsersForPasswordExpiry(daysBeforeExpiry: number) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysBeforeExpiry);

    return await prisma.user.findMany({
      where: {
        deletedAt: null,
        status: UserStatus.ACTIVE,
        passwordExpiresAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  // Statistics
  static async getUserStatsByRole() {
    return await prisma.user.groupBy({
      by: ['role'],
      where: { deletedAt: null },
      _count: true,
    });
  }

  static async getUserStatsByDepartment() {
    return await prisma.user.groupBy({
      by: ['departmentId'],
      where: { deletedAt: null },
      _count: true,
    });
  }

  static async getUserStatsByStatus() {
    return await prisma.user.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    });
  }

  static async getNewUsersCount(days: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return await prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: { gte: cutoffDate },
      },
    });
  }

  static async getActiveUsersCount(minutes: number = 15) {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    return await prisma.user.count({
      where: {
        deletedAt: null,
        status: UserStatus.ACTIVE,
        lastActivityAt: { gte: cutoffTime },
      },
    });
  }
}