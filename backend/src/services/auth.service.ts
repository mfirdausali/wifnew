import bcrypt from 'bcryptjs';
import { User, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { TokenService } from './token.service';
import { 
  UnauthorizedError, 
  ConflictError, 
  NotFoundError,
  ValidationError 
} from '../utils/errors';
import { sanitizeUser, isStrongPassword } from '../utils/helpers';
import { AUDIT_ACTIONS } from '../utils/constants';
import logger from '../utils/logger';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

interface LoginData {
  email: string;
  password: string;
}

interface LoginResponse {
  user: Partial<User>;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthService {
  static async register(data: RegisterData): Promise<User> {
    const { email, password, firstName, lastName, role = UserRole.SALES_MANAGER } = data;

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
        emailNormalized: email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role,
        accessLevel: 1, // Default access level
        status: UserStatus.ACTIVE,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AUDIT_ACTIONS.USER_REGISTER,
        targetType: 'user',
        targetId: user.id,
        targetUserId: user.id,
        actionCategory: 'auth',
        details: { email, role },
        ipAddress: '',
        userAgent: '',
      },
    });

    logger.info('User registered', { userId: user.id, email, role });

    return sanitizeUser(user) as User;
  }

  static async login(data: LoginData, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    const { email, password } = data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError(`Account is ${user.status.toLowerCase()}`);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens (this also creates the session)
    const tokens = await TokenService.generateTokenPair(user, {
      ipAddress: ipAddress || '',
      userAgent: userAgent || '',
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AUDIT_ACTIONS.USER_LOGIN,
        targetType: 'user',
        targetId: user.id,
        actionCategory: 'auth',
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        details: { email },
      },
    });

    logger.info('User logged in', { userId: user.id, email });

    return {
      user: sanitizeUser(user),
      tokens,
    };
  }

  static async logout(userId: string, token: string): Promise<void> {
    // Revoke the token
    await TokenService.revokeToken(token);

    // Mark user sessions as revoked
    await prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTIONS.USER_LOGOUT,
        targetType: 'user',
        targetId: userId,
        actionCategory: 'auth',
        ipAddress: '',
        userAgent: '',
      },
    });

    logger.info('User logged out', { userId });
  }

  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    // Validate new password strength
    if (!isStrongPassword(newPassword)) {
      throw new ValidationError(
        'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { 
        passwordHash: hashedPassword,
        passwordChangedAt: new Date(),
        passwordExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    // Revoke all user tokens
    await TokenService.revokeAllUserTokens(userId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: AUDIT_ACTIONS.PASSWORD_CHANGE,
        targetType: 'user',
        targetId: userId,
        targetUserId: userId,
        actionCategory: 'auth',
        ipAddress: '',
        userAgent: '',
      },
    });

    logger.info('Password changed', { userId });
  }

  static async verifyEmail(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });

    logger.info('Email verified', { userId });
  }

  static async getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user ? sanitizeUser(user) as User : null;
  }
}