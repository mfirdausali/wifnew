import { User, UserRole, UserStatus, Prisma } from '@prisma/client';
import { prisma } from '@config/database';
import bcrypt from 'bcryptjs';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError,
  ForbiddenError 
} from '@utils/errors';
import { sanitizeUser, isStrongPassword } from '@utils/helpers';
import { AUDIT_ACTIONS } from '@utils/constants';
import logger from '@utils/logger';

interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  phoneNumber?: string;
}

interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  department?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

interface UserFilter {
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  search?: string;
}

export class UserService {
  static async createUser(data: CreateUserData, createdBy: string): Promise<User> {
    const { email, password, ...userData } = data;

    // Validate password strength
    if (!isStrongPassword(password)) {
      throw new ValidationError(
        'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        ...userData,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: createdBy,
        action: AUDIT_ACTIONS.USER_REGISTER,
        resource: 'users',
        resourceId: user.id,
        details: { email, role: userData.role },
      },
    });

    logger.info('User created by admin', { userId: user.id, createdBy });

    return sanitizeUser(user) as User;
  }

  static async getUsers(
    filter: UserFilter,
    skip: number,
    take: number
  ): Promise<{ users: User[]; total: number }> {
    const where: Prisma.UserWhereInput = {};

    if (filter.role) {
      where.role = filter.role;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.department) {
      where.department = filter.department;
    }

    if (filter.search) {
      where.OR = [
        { email: { contains: filter.search, mode: 'insensitive' } },
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => sanitizeUser(user) as User),
      total,
    };
  }

  static async getUserById(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return sanitizeUser(user) as User;
  }

  static async updateUser(
    userId: string, 
    data: UpdateUserData, 
    updatedBy: string
  ): Promise<User> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: AUDIT_ACTIONS.USER_UPDATE,
        resource: 'users',
        resourceId: userId,
        details: data,
      },
    });

    logger.info('User updated', { userId, updatedBy });

    return sanitizeUser(user) as User;
  }

  static async updateUserRole(
    userId: string,
    newRole: UserRole,
    updatedBy: string,
    updaterRole: UserRole
  ): Promise<User> {
    // Only admins can change roles
    if (updaterRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can change user roles');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Prevent changing own role
    if (userId === updatedBy) {
      throw new ValidationError('Cannot change your own role');
    }

    // Update role
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: AUDIT_ACTIONS.ROLE_CHANGE,
        resource: 'users',
        resourceId: userId,
        details: { 
          oldRole: existingUser.role, 
          newRole 
        },
      },
    });

    logger.info('User role changed', { userId, oldRole: existingUser.role, newRole, updatedBy });

    return sanitizeUser(user) as User;
  }

  static async updateUserStatus(
    userId: string,
    newStatus: UserStatus,
    updatedBy: string,
    updaterRole: UserRole
  ): Promise<User> {
    // Only admins can change status
    if (updaterRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can change user status');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Prevent changing own status
    if (userId === updatedBy) {
      throw new ValidationError('Cannot change your own status');
    }

    // Update status
    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    // If user is being deactivated, revoke all tokens
    if (newStatus !== UserStatus.ACTIVE) {
      const { TokenService } = await import('./token.service');
      await TokenService.revokeAllUserTokens(userId);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: AUDIT_ACTIONS.USER_UPDATE,
        resource: 'users',
        resourceId: userId,
        details: { 
          oldStatus: existingUser.status, 
          newStatus 
        },
      },
    });

    logger.info('User status changed', { userId, oldStatus: existingUser.status, newStatus, updatedBy });

    return sanitizeUser(user) as User;
  }

  static async deleteUser(userId: string, deletedBy: string, deleterRole: UserRole): Promise<void> {
    // Only admins can delete users
    if (deleterRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only administrators can delete users');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent self-deletion
    if (userId === deletedBy) {
      throw new ValidationError('Cannot delete your own account');
    }

    // Soft delete by updating status
    await prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.DELETED },
    });

    // Revoke all user tokens
    const { TokenService } = await import('./token.service');
    await TokenService.revokeAllUserTokens(userId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: deletedBy,
        action: AUDIT_ACTIONS.USER_DELETE,
        resource: 'users',
        resourceId: userId,
        details: { email: user.email },
      },
    });

    logger.info('User deleted', { userId, deletedBy });
  }

  static async getUserStats(): Promise<any> {
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentRegistrations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      usersByRole: usersByRole.reduce((acc, curr) => {
        acc[curr.role] = curr._count;
        return acc;
      }, {} as Record<string, number>),
      recentRegistrations,
    };
  }
}