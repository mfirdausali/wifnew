import { User, UserRole, UserStatus, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { 
  NotFoundError, 
  ConflictError, 
  ValidationError,
  ForbiddenError 
} from '../utils/errors';
import { 
  sanitizeUser, 
  isStrongPassword,
  generateFullName,
  generateInitials,
  isValidTimezone,
  isAllowedEmailDomain,
  isValidRoleAccessLevel,
  canAssignRole,
  isValidManagerForDepartment,
  transformUser,
  buildFieldSelection,
  buildIncludes,
  pickChangedFields,
} from '../utils/helpers';
import { AUDIT_ACTIONS } from '../utils/constants';
import { EmailService } from './email.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { PermissionService } from './permission.service';
import { FileService } from './file.service';
import logger from '../utils/logger';
import { differenceInDays, formatDistanceToNow, addDays } from 'date-fns';

interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  position: string;
  department: string;
  managerId?: string;
  employmentDate?: string;
  role: UserRole;
  accessLevel: 1 | 2 | 3 | 4 | 5;
  permissions?: string[];
  password: string;
  requirePasswordChange?: boolean;
  phone?: string;
  timezone?: string;
  language?: string;
  sendWelcomeEmail?: boolean;
  skipEmailVerification?: boolean;
  notes?: string;
  customFields?: Record<string, any>;
}

interface ListUsersOptions {
  filters: any;
  skip: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  include?: string[];
  fields?: string[];
}

export class UsersService {
  static async listUsers(options: ListUsersOptions) {
    const where = this.buildUsersQuery(options.filters);
    const select = options.fields ? buildFieldSelection(options.fields) : undefined;
    const include = options.include ? buildIncludes(options.include) : undefined;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select,
        include,
        orderBy: { [options.sortBy]: options.sortOrder },
        skip: options.skip,
        take: options.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => transformUser(user, { include: options.include, fields: options.fields })),
      total,
    };
  }

  static async createUser(data: CreateUserData, createdBy: string) {
    return await prisma.$transaction(async (tx) => {
      // Check email uniqueness
      const existingUser = await tx.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ConflictError('Email already in use');
      }

      // Validate email domain
      if (!await isAllowedEmailDomain(data.email)) {
        throw new ValidationError('Email domain not allowed');
      }

      // Validate department
      const department = await tx.department.findUnique({
        where: { id: data.department },
      });

      if (!department) {
        throw new ValidationError('Invalid department');
      }

      // Validate manager if provided
      if (data.managerId) {
        const manager = await tx.user.findUnique({
          where: { id: data.managerId },
        });

        if (!manager) {
          throw new ValidationError('Invalid manager ID');
        }

        if (!isValidManagerForDepartment(manager, department)) {
          throw new ValidationError('Manager must be in same or parent department');
        }
      }

      // Validate role and access level combination
      if (!isValidRoleAccessLevel(data.role, data.accessLevel)) {
        throw new ValidationError('Invalid role and access level combination');
      }

      // Validate password strength
      if (!isStrongPassword(data.password)) {
        throw new ValidationError(
          'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character'
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);

      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          emailNormalized: data.email.toLowerCase(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          middleName: data.middleName?.trim(),
          fullName: generateFullName(data),
          initials: generateInitials(data),
          
          position: data.position,
          departmentId: data.department,
          managerId: data.managerId,
          employmentDate: data.employmentDate ? new Date(data.employmentDate) : new Date(),
          
          role: data.role,
          accessLevel: data.accessLevel,
          
          passwordHash: hashedPassword,
          passwordChangedAt: new Date(),
          passwordExpiresAt: addDays(new Date(), 90), // 90 day expiry
          requirePasswordChange: data.requirePasswordChange ?? true,
          
          phone: data.phone,
          timezone: data.timezone || 'UTC',
          language: data.language || 'en',
          
          status: UserStatus.ACTIVE,
          emailVerified: data.skipEmailVerification || false,
          
          createdBy,
          updatedBy: createdBy,
          
          customFields: data.customFields || {},
          notes: data.notes,
        },
        include: {
          department: true,
          manager: true,
        },
      });

      // Assign permissions
      if (data.permissions?.length) {
        await PermissionService.assignPermissions(tx, user.id, data.permissions, createdBy);
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: createdBy,
          targetUserId: user.id,
          action: AUDIT_ACTIONS.USER_CREATED,
          details: {
            email: user.email,
            role: user.role,
            department: user.department?.name,
          },
          ipAddress: '',
          userAgent: '',
        },
      });

      // Send emails (outside transaction)
      const emailTasks: Promise<any>[] = [];
      let welcomeEmailSent = false;
      let verificationEmailSent = false;

      if (data.sendWelcomeEmail !== false) {
        emailTasks.push(
          EmailService.sendWelcomeEmail(user, {
            temporaryPassword: data.password,
            requirePasswordChange: user.requirePasswordChange,
          }).then(() => { welcomeEmailSent = true; }).catch(() => {})
        );
      }

      if (!data.skipEmailVerification) {
        const verificationToken = await TokenService.generateVerificationToken(user.id);
        emailTasks.push(
          EmailService.sendVerificationEmail(user, verificationToken)
            .then(() => { verificationEmailSent = true; }).catch(() => {})
        );
      }

      await Promise.allSettled(emailTasks);

      logger.info('User created', { userId: user.id, createdBy });

      return {
        user: sanitizeUser(user),
        welcomeEmailSent,
        verificationEmailSent,
      };
    });
  }

  static async getUserDetails(
    userId: string, 
    requesterId: string,
    requesterPermissions: string[],
    options: { include?: string[], fields?: string[] }
  ) {
    const isOwnProfile = userId === requesterId;

    // Permission check
    if (!isOwnProfile && !requesterPermissions.includes('users.view')) {
      throw new ForbiddenError('No permission to view other users');
    }

    // Build query
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: buildIncludes(options.include || [], isOwnProfile),
      select: options.fields ? buildFieldSelection(options.fields) : undefined,
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Additional permission check for sensitive data
    if (!isOwnProfile && user.role === UserRole.ADMIN && !requesterPermissions.includes('admin.view')) {
      throw new ForbiddenError('Cannot view administrator details');
    }

    // Load additional data based on includes
    const additionalData: any = {};

    if (options.include?.includes('permissions')) {
      additionalData.permissions = await PermissionService.getUserPermissions(user.id);
    }

    if (options.include?.includes('activity')) {
      additionalData.activitySummary = await this.getActivitySummary(user.id);
    }

    if (options.include?.includes('sessions')) {
      additionalData.activeSessions = await SessionService.getActiveSessions(user.id);
    }

    if (options.include?.includes('auditLogs')) {
      if (!isOwnProfile && !requesterPermissions.includes('audit.view')) {
        throw new ForbiddenError('No permission to view audit logs');
      }
      additionalData.recentAuditLogs = await this.getRecentAuditLogs(user.id);
    }

    if (options.include?.includes('stats')) {
      additionalData.statistics = await this.getUserStatistics(user.id);
    }

    // Calculate computed fields
    const now = new Date();
    const userDetails = {
      ...transformUser(user),
      ...additionalData,
      accountAge: differenceInDays(now, new Date(user.createdAt)),
      passwordAge: differenceInDays(now, new Date(user.passwordChangedAt)),
      daysUntilPasswordExpiry: user.passwordExpiresAt
        ? differenceInDays(new Date(user.passwordExpiresAt), now)
        : undefined,
      lastSeenRelative: user.lastActivityAt
        ? formatDistanceToNow(new Date(user.lastActivityAt), { addSuffix: true })
        : 'Never',
    };

    // Log access
    await this.logDataAccess({
      userId: requesterId,
      targetUserId: user.id,
      action: 'VIEW_USER_DETAILS',
      ipAddress: '',
    });

    return userDetails;
  }

  static async updateUser(
    userId: string,
    updates: any,
    updaterId: string,
    updater: any,
    isOwnProfile: boolean
  ) {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!currentUser) {
      throw new NotFoundError('User not found');
    }

    // Determine allowed fields based on permissions
    const allowedFields = this.getAllowedUpdateFields(updater, isOwnProfile);
    
    // Filter updates to allowed fields only
    const filteredUpdates = pickAllowedFields(updates, allowedFields);

    // Validate updates
    if (!updates.skipValidation || !updater.permissions.includes('admin.skip-validation')) {
      await this.validateUserUpdates(filteredUpdates, currentUser);
    }

    // Perform update
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updateData: any = { ...filteredUpdates };

      // Handle email change
      if (filteredUpdates.email && filteredUpdates.email !== currentUser.email) {
        // Check email uniqueness
        const emailExists = await tx.user.findUnique({
          where: { email: filteredUpdates.email.toLowerCase() },
        });

        if (emailExists) {
          throw new ConflictError('Email already in use');
        }

        // For now, update directly (in production, would require verification)
        updateData.email = filteredUpdates.email.toLowerCase();
        updateData.emailNormalized = filteredUpdates.email.toLowerCase();
      }

      // Handle department change
      if (filteredUpdates.department && filteredUpdates.department !== currentUser.departmentId) {
        const newDepartment = await tx.department.findUnique({
          where: { id: filteredUpdates.department },
        });

        if (!newDepartment) {
          throw new ValidationError('Invalid department');
        }

        updateData.departmentId = filteredUpdates.department;
      }

      // Handle role/access level change
      if (filteredUpdates.role || filteredUpdates.accessLevel) {
        const newRole = filteredUpdates.role || currentUser.role;
        const newAccessLevel = filteredUpdates.accessLevel || currentUser.accessLevel;

        if (!isValidRoleAccessLevel(newRole, newAccessLevel)) {
          throw new ValidationError('Invalid role and access level combination');
        }
      }

      // Update full name if name fields changed
      if (updateData.firstName || updateData.lastName || updateData.middleName !== undefined) {
        updateData.fullName = generateFullName({
          firstName: updateData.firstName || currentUser.firstName,
          lastName: updateData.lastName || currentUser.lastName,
          middleName: updateData.middleName !== undefined 
            ? updateData.middleName 
            : currentUser.middleName,
        });
        updateData.initials = generateInitials({
          firstName: updateData.firstName || currentUser.firstName,
          lastName: updateData.lastName || currentUser.lastName,
        });
      }

      // Update user
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedBy: updaterId,
          updatedAt: new Date(),
        },
        include: {
          department: true,
          manager: true,
        },
      });

      // Create audit log
      const changes = pickChangedFields(currentUser, updated);
      if (Object.keys(changes).length > 0) {
        await tx.auditLog.create({
          data: {
            userId: updaterId,
            targetUserId: userId,
            action: AUDIT_ACTIONS.USER_UPDATE,
            details: {
              changes,
              reason: updates.reason,
            },
            ipAddress: '',
            userAgent: '',
          },
        });
      }

      return updated;
    });

    logger.info('User updated', { userId, updatedBy: updaterId });

    return sanitizeUser(updatedUser);
  }

  static async deleteUser(
    userId: string,
    deletedBy: string,
    deleter: any,
    options: { reassignTo?: string, hardDelete?: boolean, reason?: string }
  ) {
    // Prevent self-deletion
    if (userId === deletedBy) {
      throw new ValidationError('Cannot delete your own account');
    }

    // Get user to delete
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        _count: {
          select: {
            subordinates: true,
            createdUsers: true,
          },
        },
      },
    });

    if (!userToDelete) {
      throw new NotFoundError('User not found');
    }

    // Check permissions for deleting admins
    if (userToDelete.role === UserRole.ADMIN && !deleter.permissions.includes('admin.delete')) {
      throw new ForbiddenError('Cannot delete administrator accounts');
    }

    // Handle reassignment if needed
    if ((userToDelete._count.subordinates > 0 || userToDelete._count.createdUsers > 0) && !options.reassignTo) {
      throw new ValidationError('User has associated data that must be reassigned');
    }

    if (options.reassignTo) {
      const reassignTarget = await prisma.user.findUnique({
        where: { id: options.reassignTo, deletedAt: null },
      });

      if (!reassignTarget) {
        throw new ValidationError('Invalid reassignment target');
      }

      if (reassignTarget.status !== UserStatus.ACTIVE) {
        throw new ValidationError('Reassignment target must be active');
      }
    }

    // Perform deletion
    return await prisma.$transaction(async (tx) => {
      // Reassign data if needed
      if (options.reassignTo) {
        await this.reassignUserData(tx, userId, options.reassignTo);
      }

      let deletedUser;

      if (options.hardDelete && deleter.permissions.includes('admin.hard-delete')) {
        // Permanent deletion
        deletedUser = await tx.user.delete({
          where: { id: userId },
        });
      } else {
        // Soft delete
        deletedUser = await tx.user.update({
          where: { id: userId },
          data: {
            deletedAt: new Date(),
            deletedBy,
            status: UserStatus.INACTIVE,
            // Anonymize personal data
            email: `deleted_${userId}@deleted.local`,
            emailNormalized: `deleted_${userId}@deleted.local`,
            firstName: '[DELETED]',
            lastName: '[DELETED]',
            middleName: null,
            phone: null,
            // Clear sensitive data
            passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
          },
        });
      }

      // Create deletion audit log
      await tx.auditLog.create({
        data: {
          userId: deletedBy,
          targetUserId: options.hardDelete ? null : userId,
          action: options.hardDelete ? 'USER_HARD_DELETED' : 'USER_SOFT_DELETED',
          details: {
            email: userToDelete.email,
            role: userToDelete.role,
            department: userToDelete.departmentId,
            reassignedTo: options.reassignTo,
            reason: options.reason,
          },
          ipAddress: '',
          userAgent: '',
        },
      });

      // Revoke all active sessions
      await SessionService.revokeAllUserSessions(userId);

      logger.info('User deleted', { userId, deletedBy, hardDelete: options.hardDelete });

      return deletedUser;
    });
  }

  static async updateUserStatus(
    userId: string,
    statusData: any,
    updatedBy: string
  ) {
    const {
      status,
      reason,
      suspensionEndDate,
      notifyUser = true,
      revokeActiveSessions = true,
    } = statusData;

    // Validation
    if (status === UserStatus.SUSPENDED && !reason) {
      throw new ValidationError('Reason required for suspension');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if status change is valid
    const validTransitions: Record<UserStatus, UserStatus[]> = {
      [UserStatus.ACTIVE]: [UserStatus.INACTIVE, UserStatus.SUSPENDED],
      [UserStatus.INACTIVE]: [UserStatus.ACTIVE, UserStatus.SUSPENDED],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.INACTIVE],
    };

    if (!validTransitions[user.status].includes(status)) {
      throw new ValidationError(
        `Cannot change status from ${user.status} to ${status}`
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        statusReason: reason,
        suspensionEndDate: suspensionEndDate ? new Date(suspensionEndDate) : null,
        updatedBy,
      },
    });

    // Revoke sessions if needed
    let sessionsRevoked = false;
    if (revokeActiveSessions && (status === UserStatus.INACTIVE || status === UserStatus.SUSPENDED)) {
      await SessionService.revokeAllUserSessions(userId);
      sessionsRevoked = true;
    }

    // Send notification
    let notificationSent = false;
    if (notifyUser) {
      try {
        await EmailService.sendStatusChangeNotification(updatedUser, {
          oldStatus: user.status,
          newStatus: status,
          reason,
          suspensionEndDate,
        });
        notificationSent = true;
      } catch (error) {
        logger.error('Failed to send status change notification', { error, userId });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedBy,
        targetUserId: userId,
        action: 'USER_STATUS_CHANGED',
        details: {
          oldStatus: user.status,
          newStatus: status,
          reason,
          suspensionEndDate,
        },
        ipAddress: '',
        userAgent: '',
      },
    });

    logger.info('User status changed', { userId, oldStatus: user.status, newStatus: status });

    return {
      userId,
      status,
      statusReason: reason,
      suspensionEndDate,
      sessionsRevoked,
      notificationSent,
    };
  }

  static async updateUserRole(
    userId: string,
    roleData: any,
    updater: any
  ) {
    const {
      role,
      accessLevel,
      reason,
      effectiveDate,
      notifyUser = true,
    } = roleData;

    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Validate role change permissions
    if (!canAssignRole(updater, role)) {
      throw new ForbiddenError(`You cannot assign ${role} role`);
    }

    // Validate role and access level combination
    const finalAccessLevel = accessLevel ?? user.accessLevel;
    if (!isValidRoleAccessLevel(role, finalAccessLevel)) {
      throw new ValidationError('Invalid role and access level combination');
    }

    if (effectiveDate && new Date(effectiveDate) > new Date()) {
      // Schedule role change for future
      // This would be implemented with a job queue in production
      return {
        message: 'Role change scheduled',
        scheduledFor: effectiveDate,
        currentRole: user.role,
        futureRole: role,
      };
    }

    // Immediate role change
    const updatedUser = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          role,
          accessLevel: finalAccessLevel,
          updatedBy: updater.id,
        },
      });

      // Update role-based permissions
      await PermissionService.updateRolePermissions(tx, userId, role);

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: updater.id,
          targetUserId: userId,
          action: AUDIT_ACTIONS.ROLE_CHANGE,
          details: {
            oldRole: user.role,
            newRole: role,
            oldAccessLevel: user.accessLevel,
            newAccessLevel: finalAccessLevel,
            reason,
          },
          ipAddress: '',
          userAgent: '',
        },
      });

      return updated;
    });

    // Send notification
    if (notifyUser) {
      try {
        await EmailService.sendRoleChangeNotification(updatedUser, {
          oldRole: user.role,
          newRole: role,
          reason,
        });
      } catch (error) {
        logger.error('Failed to send role change notification', { error, userId });
      }
    }

    logger.info('User role changed', { userId, oldRole: user.role, newRole: role });

    return {
      userId,
      role,
      accessLevel: finalAccessLevel,
      previousRole: user.role,
      previousAccessLevel: user.accessLevel,
    };
  }

  static async bulkUpdateUsers(
    userIds: string[],
    updates: any,
    options: any,
    updater: any
  ) {
    // Validate bulk operation size
    if (userIds.length > 100) {
      throw new ValidationError('Maximum 100 users per bulk operation');
    }

    // Get all users
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
      },
    });

    if (users.length !== userIds.length) {
      const foundIds = users.map(u => u.id);
      const missingIds = userIds.filter(id => !foundIds.includes(id));
      throw new ValidationError(`Some users not found: ${missingIds.join(', ')}`);
    }

    // Validate updates for each user
    if (!options.skipValidation) {
      const validationErrors = await this.validateBulkUpdates(users, updates, updater);
      if (validationErrors.length > 0) {
        throw new ValidationError('Validation failed for some users');
      }
    }

    // Perform bulk update
    const results = await prisma.$transaction(async (tx) => {
      const updateResults: any[] = [];

      for (const user of users) {
        try {
          const updated = await tx.user.update({
            where: { id: user.id },
            data: {
              ...updates,
              updatedBy: updater.id,
              updatedAt: new Date(),
            },
          });

          updateResults.push({
            userId: user.id,
            success: true,
            previousValues: pickChangedFields(user, updates),
            newValues: pickChangedFields(updated, updates),
          });

          // Audit log
          await tx.auditLog.create({
            data: {
              userId: updater.id,
              targetUserId: user.id,
              action: 'USER_BULK_UPDATED',
              details: {
                updates,
                reason: options.reason,
              },
              ipAddress: '',
              userAgent: '',
            },
          });
        } catch (error: any) {
          updateResults.push({
            userId: user.id,
            success: false,
            error: error.message,
          });
        }
      }

      return updateResults;
    });

    // Send notifications
    if (options.notifyUsers) {
      const successfulUpdates = results.filter(r => r.success);
      await this.sendBulkUpdateNotifications(successfulUpdates, updates, options.reason);
    }

    logger.info('Bulk update completed', { 
      userIds: userIds.length, 
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

    return results;
  }

  static async exportUsers(query: any, exporter: any) {
    // Apply same filters as list endpoint
    const users = await prisma.user.findMany({
      where: this.buildUsersQuery(query),
      select: query.fields ? buildFieldSelection(query.fields) : this.getExportFields(query.format),
    });

    // Check export size limit
    if (users.length > 10000) {
      throw new ValidationError(`Export exceeds maximum size: ${users.length} users`);
    }

    // Generate export file
    let fileBuffer: Buffer;
    let contentType: string;
    let filename: string;

    switch (query.format) {
      case 'csv':
        fileBuffer = await FileService.generateCSV(users, query);
        contentType = 'text/csv';
        filename = `users_export_${Date.now()}.csv`;
        break;

      case 'xlsx':
        fileBuffer = await FileService.generateExcel(users, query);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `users_export_${Date.now()}.xlsx`;
        break;

      case 'json':
        fileBuffer = Buffer.from(JSON.stringify(users, null, 2));
        contentType = 'application/json';
        filename = `users_export_${Date.now()}.json`;
        break;

      case 'pdf':
        fileBuffer = await FileService.generatePDF(users, query);
        contentType = 'application/pdf';
        filename = `users_export_${Date.now()}.pdf`;
        break;

      default:
        throw new ValidationError('Invalid export format');
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: exporter.id,
        action: 'USERS_EXPORTED',
        details: {
          format: query.format,
          count: users.length,
          filters: query,
        },
        ipAddress: '',
        userAgent: '',
      },
    });

    logger.info('Users exported', { format: query.format, count: users.length, exportedBy: exporter.id });

    return { fileBuffer, contentType, filename };
  }

  static async importUsers(file: any, options: any, importedBy: string) {
    // Parse file
    const parsedData = await FileService.parseImportFile(file, options);

    if (parsedData.errors.length > 0) {
      throw new ValidationError('Failed to parse import file');
    }

    // Validate data
    const validationResults = await this.validateImportData(parsedData.rows, options);

    if (options.validateOnly) {
      return {
        totalRows: parsedData.rows.length,
        validRows: validationResults.valid.length,
        invalidRows: validationResults.invalid.length,
        warnings: validationResults.warnings,
        errors: validationResults.errors,
      };
    }

    if (validationResults.invalid.length > 0 && !options.skipValidation) {
      throw new ValidationError('Import data validation failed');
    }

    // Process import
    const importId = crypto.randomUUID();
    const importResults = await this.processImport(
      validationResults.valid,
      options,
      importedBy,
      importId
    );

    // Send notifications
    if (options.sendWelcomeEmails) {
      await this.sendImportWelcomeEmails(importResults.created);
    }

    logger.info('Users imported', { 
      importId, 
      total: parsedData.rows.length,
      created: importResults.created.length,
      updated: importResults.updated.length,
      failed: importResults.failed.length,
    });

    return {
      importId,
      summary: {
        total: parsedData.rows.length,
        created: importResults.created.length,
        updated: importResults.updated.length,
        failed: importResults.failed.length,
        skipped: importResults.skipped.length,
      },
      results: importResults,
    };
  }

  // Helper methods
  private static buildUsersQuery(filters: any): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    // Search across multiple fields
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { position: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (filters.roles?.length) {
      where.role = { in: filters.roles };
    }

    // Department filter
    if (filters.departments?.length) {
      where.departmentId = { in: filters.departments };
    }

    // Status filter
    if (filters.statuses?.length) {
      where.status = { in: filters.statuses };
    }

    // Access level filter
    if (filters.accessLevels?.length) {
      where.accessLevel = { in: filters.accessLevels };
    }

    // Date filters
    if (filters.createdAfter || filters.createdBefore) {
      where.createdAt = {
        ...(filters.createdAfter && { gte: new Date(filters.createdAfter) }),
        ...(filters.createdBefore && { lte: new Date(filters.createdBefore) }),
      };
    }

    if (filters.lastActiveAfter || filters.lastActiveBefore) {
      where.lastActivityAt = {
        ...(filters.lastActiveAfter && { gte: new Date(filters.lastActiveAfter) }),
        ...(filters.lastActiveBefore && { lte: new Date(filters.lastActiveBefore) }),
      };
    }

    // Special filters
    if (filters.isOnline !== undefined) {
      // This would check active sessions in production
      where.lastActivityAt = {
        gte: new Date(Date.now() - 15 * 60 * 1000), // Active in last 15 minutes
      };
    }

    if (filters.hasNeverLoggedIn) {
      where.lastLoginAt = null;
    }

    if (filters.suspendedOnly) {
      where.status = UserStatus.SUSPENDED;
      where.suspensionEndDate = { gt: new Date() };
    }

    if (filters.withExpiredPasswords) {
      where.passwordExpiresAt = { lt: new Date() };
    }

    return where;
  }

  private static async getFilterCounts(filters: any) {
    const baseWhere = this.buildUsersQuery({ ...filters, roles: undefined, departments: undefined, statuses: undefined, accessLevels: undefined });

    const [roles, departments, statuses, accessLevels] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        where: baseWhere,
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['departmentId'],
        where: baseWhere,
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: true,
      }),
      prisma.user.groupBy({
        by: ['accessLevel'],
        where: baseWhere,
        _count: true,
      }),
    ]);

    // Get department names
    const departmentIds = departments.map(d => d.departmentId).filter(Boolean);
    const departmentDetails = await prisma.department.findMany({
      where: { id: { in: departmentIds as string[] } },
      select: { id: true, name: true },
    });

    const departmentMap = new Map(departmentDetails.map(d => [d.id, d.name]));

    return {
      roles: roles.map(r => ({
        value: r.role,
        label: r.role.replace('_', ' '),
        count: r._count,
      })),
      departments: departments
        .filter(d => d.departmentId)
        .map(d => ({
          value: d.departmentId!,
          label: departmentMap.get(d.departmentId!) || 'Unknown',
          count: d._count,
        })),
      statuses: statuses.map(s => ({
        value: s.status,
        label: s.status,
        count: s._count,
      })),
      accessLevels: accessLevels.map(a => ({
        value: a.accessLevel,
        label: `Level ${a.accessLevel}`,
        count: a._count,
      })),
    };
  }

  private static getAllowedUpdateFields(user: any, isOwnProfile: boolean): string[] {
    const baseFields = [
      'firstName', 'lastName', 'middleName', 'phone',
      'timezone', 'language', 'notificationPreferences',
    ];

    if (isOwnProfile) {
      return [...baseFields, 'email', 'twoFactorEnabled'];
    }

    if (user.permissions.includes('users.edit')) {
      return [
        ...baseFields,
        'email', 'position', 'department', 'managerId',
        'employmentDate', 'notes', 'customFields',
      ];
    }

    if (user.permissions.includes('users.edit-access')) {
      return ['role', 'accessLevel', 'permissions'];
    }

    return [];
  }

  private static async validateUserUpdates(updates: any, currentUser: any) {
    // Add validation logic here
    if (updates.email && !await isAllowedEmailDomain(updates.email)) {
      throw new ValidationError('Email domain not allowed');
    }

    if (updates.timezone && !isValidTimezone(updates.timezone)) {
      throw new ValidationError('Invalid timezone');
    }
  }

  private static async validateBulkUpdates(users: any[], updates: any, updater: any) {
    const errors = [];
    
    for (const user of users) {
      try {
        await this.validateUserUpdates(updates, user);
      } catch (error: any) {
        errors.push({
          userId: user.id,
          error: error.message,
        });
      }
    }

    return errors;
  }

  private static async reassignUserData(tx: any, fromUserId: string, toUserId: string) {
    // Reassign managed users
    await tx.user.updateMany({
      where: { managerId: fromUserId },
      data: { managerId: toUserId },
    });

    // Reassign created users
    await tx.user.updateMany({
      where: { createdBy: fromUserId },
      data: { createdBy: toUserId },
    });

    // Add more reassignments as needed
  }

  private static async getActivitySummary(userId: string) {
    // Implement activity summary logic
    return {
      lastLogin: new Date(),
      lastActivity: new Date(),
      totalLogins: 0,
      failedLogins: 0,
      averageSessionDuration: 0,
      mostActiveHours: [],
      preferredDevices: [],
    };
  }

  private static async getRecentAuditLogs(userId: string) {
    return await prisma.auditLog.findMany({
      where: {
        OR: [
          { userId },
          { targetUserId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  private static async getUserStatistics(userId: string) {
    // Implement user statistics logic
    return {
      createdRecords: 0,
      updatedRecords: 0,
      performedActions: [],
      dataAccess: [],
    };
  }

  private static async logDataAccess(data: any) {
    // Implement data access logging
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        targetUserId: data.targetUserId,
        action: data.action,
        ipAddress: data.ipAddress,
        userAgent: '',
      },
    });
  }

  private static getExportFields(format: string) {
    // Define fields to export based on format
    const baseFields = {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
      status: true,
      createdAt: true,
    };

    if (format === 'pdf') {
      return baseFields;
    }

    return {
      ...baseFields,
      position: true,
      phone: true,
      lastLoginAt: true,
      accessLevel: true,
    };
  }

  private static async validateImportData(rows: any[], options: any) {
    const valid: any[] = [];
    const invalid: any[] = [];
    const warnings: any[] = [];
    const errors: any[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        // Validate required fields
        if (!row.email || !row.firstName || !row.lastName) {
          invalid.push({ row: index + 1, reason: 'Missing required fields' });
          continue;
        }

        // Validate email
        if (!await isAllowedEmailDomain(row.email)) {
          invalid.push({ row: index + 1, reason: 'Email domain not allowed' });
          continue;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: row.email.toLowerCase() },
        });

        if (existingUser && options.mode === 'create') {
          invalid.push({ row: index + 1, reason: 'User already exists' });
          continue;
        }

        if (!existingUser && options.mode === 'update') {
          invalid.push({ row: index + 1, reason: 'User not found' });
          continue;
        }

        valid.push({ ...row, _rowNumber: index + 1, _existingUser: existingUser });
      } catch (error: any) {
        errors.push({ row: index + 1, error: error.message });
      }
    }

    return { valid, invalid, warnings, errors };
  }

  private static async processImport(rows: any[], options: any, importedBy: string, importId: string) {
    const results = {
      created: [] as any[],
      updated: [] as any[],
      failed: [] as any[],
      skipped: [] as any[],
    };

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      await prisma.$transaction(async (tx) => {
        for (const row of batch) {
          try {
            if (options.mode === 'create' || (options.mode === 'upsert' && !row._existingUser)) {
              // Create new user
              const password = options.generatePasswords 
                ? crypto.randomBytes(12).toString('base64')
                : row.password;

              const user = await tx.user.create({
                data: {
                  email: row.email.toLowerCase(),
                  emailNormalized: row.email.toLowerCase(),
                  firstName: row.firstName,
                  lastName: row.lastName,
                  middleName: row.middleName,
                  fullName: generateFullName(row),
                  initials: generateInitials(row),
                  position: row.position || 'Employee',
                  departmentId: row.department || options.defaultDepartment,
                  role: row.role || options.defaultRole || UserRole.SALES_MANAGER,
                  accessLevel: row.accessLevel || options.defaultAccessLevel || 1,
                  passwordHash: await bcrypt.hash(password, 12),
                  requirePasswordChange: true,
                  createdBy: importedBy,
                  updatedBy: importedBy,
                },
              });

              results.created.push({ ...user, temporaryPassword: password });
            } else if (options.mode === 'update' || options.mode === 'upsert') {
              // Update existing user
              const updateData: any = {};
              
              if (row.firstName) updateData.firstName = row.firstName;
              if (row.lastName) updateData.lastName = row.lastName;
              if (row.position) updateData.position = row.position;
              if (row.department) updateData.departmentId = row.department;
              if (row.role) updateData.role = row.role;
              if (row.accessLevel) updateData.accessLevel = row.accessLevel;

              const user = await tx.user.update({
                where: { id: row._existingUser.id },
                data: {
                  ...updateData,
                  updatedBy: importedBy,
                },
              });

              results.updated.push(user);
            }
          } catch (error: any) {
            results.failed.push({
              row: row._rowNumber,
              data: row,
              error: error.message,
            });
          }
        }
      });
    }

    // Create import log
    await prisma.importLog.create({
      data: {
        id: importId,
        userId: importedBy,
        filename: options.filename || 'import.csv',
        totalRows: rows.length,
        successCount: results.created.length + results.updated.length,
        failureCount: results.failed.length,
        details: results,
      },
    });

    return results;
  }

  private static async sendBulkUpdateNotifications(updates: any[], changes: any, reason: string) {
    // Implement bulk notification sending
    for (const update of updates) {
      try {
        await EmailService.sendBulkUpdateNotification(update.userId, changes, reason);
      } catch (error) {
        logger.error('Failed to send bulk update notification', { error, userId: update.userId });
      }
    }
  }

  private static async sendImportWelcomeEmails(users: any[]) {
    for (const user of users) {
      try {
        await EmailService.sendWelcomeEmail(user, {
          temporaryPassword: user.temporaryPassword,
          requirePasswordChange: true,
        });
      } catch (error) {
        logger.error('Failed to send import welcome email', { error, userId: user.id });
      }
    }
  }
}