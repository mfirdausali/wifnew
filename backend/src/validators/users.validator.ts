import * as yup from 'yup';
import { UserRole, UserStatus } from '@prisma/client';

// Helper validators
const emailValidator = yup
  .string()
  .required('Email is required')
  .email('Invalid email format')
  .lowercase()
  .trim();

const nameValidator = yup
  .string()
  .required()
  .trim()
  .min(2, 'Too short')
  .max(50, 'Too long')
  .matches(/^[a-zA-Z\s\-']+$/, 'Contains invalid characters');

const passwordValidator = yup
  .string()
  .required('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number and special character'
  );

// List users query schema
export const listUsersSchema = yup.object({
  page: yup.number().positive().integer().default(1),
  limit: yup.number().positive().integer().min(1).max(100).default(25),
  sortBy: yup.string().oneOf([
    'firstName', 'lastName', 'email', 'role', 'department',
    'accessLevel', 'status', 'lastLoginAt', 'createdAt', 'updatedAt'
  ]).default('createdAt'),
  sortOrder: yup.string().oneOf(['asc', 'desc']).default('desc'),
  search: yup.string().trim().max(100),
  roles: yup.array().of(yup.string().oneOf(Object.values(UserRole))),
  departments: yup.array().of(yup.string().uuid()),
  statuses: yup.array().of(yup.string().oneOf(Object.values(UserStatus))),
  accessLevels: yup.array().of(yup.number().min(1).max(5)),
  createdAfter: yup.date(),
  createdBefore: yup.date(),
  lastActiveAfter: yup.date(),
  lastActiveBefore: yup.date(),
  include: yup.array().of(yup.string().oneOf(['department', 'manager', 'permissions', 'lastActivity', 'sessions', 'auditLogs', 'stats'])),
  fields: yup.array().of(yup.string()),
  isOnline: yup.boolean(),
  hasNeverLoggedIn: yup.boolean(),
  suspendedOnly: yup.boolean(),
  withExpiredPasswords: yup.boolean(),
});

// Create user schema
export const createUserSchema = yup.object({
  body: yup.object({
    // Personal information
    email: emailValidator,
    firstName: nameValidator.label('First name'),
    lastName: nameValidator.label('Last name'),
    middleName: yup.string().trim().min(2).max(50).nullable(),
    
    // Professional information
    position: yup.string().required('Position is required').trim().min(3).max(100),
    department: yup.string().required('Department is required').uuid('Invalid department ID'),
    managerId: yup.string().uuid('Invalid manager ID').nullable(),
    employmentDate: yup.date().max(new Date(), 'Employment date cannot be in future').nullable(),
    
    // Access control
    role: yup.string().required('Role is required').oneOf(Object.values(UserRole), 'Invalid role'),
    accessLevel: yup.number().required('Access level is required').min(1).max(5),
    permissions: yup.array().of(yup.string()),
    
    // Authentication
    password: passwordValidator,
    requirePasswordChange: yup.boolean().default(true),
    
    // Contact information
    phone: yup.string().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format').nullable(),
    timezone: yup.string().nullable(),
    language: yup.string().matches(/^[a-z]{2}$/, 'Invalid language code').nullable(),
    
    // Options
    sendWelcomeEmail: yup.boolean().default(true),
    skipEmailVerification: yup.boolean().default(false),
    
    // Metadata
    notes: yup.string().max(1000, 'Notes too long').nullable(),
    customFields: yup.object().nullable(),
  }),
});

// Update user schema
export const updateUserSchema = yup.object({
  body: yup.object({
    firstName: nameValidator.optional(),
    lastName: nameValidator.optional(),
    middleName: yup.string().trim().min(2).max(50).nullable(),
    phone: yup.string().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format').nullable(),
    timezone: yup.string().nullable(),
    language: yup.string().matches(/^[a-z]{2}$/, 'Invalid language code').nullable(),
    
    // Professional information (admin only)
    position: yup.string().trim().min(3).max(100),
    department: yup.string().uuid('Invalid department'),
    managerId: yup.string().uuid('Invalid manager ID').nullable(),
    employmentDate: yup.date().max(new Date(), 'Employment date cannot be in future'),
    
    // Access control (admin only)
    role: yup.string().oneOf(Object.values(UserRole)),
    accessLevel: yup.number().min(1).max(5),
    permissions: yup.array().of(yup.string()),
    
    // Account settings
    email: emailValidator.optional(),
    twoFactorEnabled: yup.boolean(),
    notificationPreferences: yup.object({
      email: yup.boolean(),
      sms: yup.boolean(),
      push: yup.boolean(),
    }),
    
    // Metadata
    notes: yup.string().max(1000).nullable(),
    customFields: yup.object().nullable(),
    
    // Options
    skipValidation: yup.boolean(),
    reason: yup.string(),
  }).test('at-least-one-field', 'No changes provided', (value) => {
    return Object.keys(value).length > 0;
  }),
});

// Update user status schema
export const updateUserStatusSchema = yup.object({
  body: yup.object({
    status: yup.string().required('Status is required').oneOf(Object.values(UserStatus)),
    reason: yup.string().when('status', {
      is: UserStatus.SUSPENDED,
      then: (schema) => schema.required('Reason required for suspension'),
      otherwise: (schema) => schema.nullable(),
    }),
    suspensionEndDate: yup.date().when('status', {
      is: UserStatus.SUSPENDED,
      then: (schema) => schema.min(new Date(), 'Suspension end date must be in future'),
      otherwise: (schema) => schema.nullable(),
    }),
    notifyUser: yup.boolean().default(true),
    revokeActiveSessions: yup.boolean().default(true),
  }),
});

// Update user role schema
export const updateUserRoleSchema = yup.object({
  body: yup.object({
    role: yup.string().required('Role is required').oneOf(Object.values(UserRole)),
    accessLevel: yup.number().min(1).max(5),
    reason: yup.string().required('Reason is required'),
    effectiveDate: yup.date().min(new Date(), 'Effective date must be in future').nullable(),
    notifyUser: yup.boolean().default(true),
  }),
});

// Bulk update users schema
export const bulkUpdateUsersSchema = yup.object({
  body: yup.object({
    userIds: yup.array()
      .of(yup.string().uuid())
      .required('User IDs are required')
      .min(1, 'At least one user ID required')
      .max(100, 'Maximum 100 users per bulk operation'),
    updates: yup.object({
      status: yup.string().oneOf(Object.values(UserStatus)),
      role: yup.string().oneOf(Object.values(UserRole)),
      accessLevel: yup.number().min(1).max(5),
      department: yup.string().uuid(),
      managerId: yup.string().uuid().nullable(),
      customFields: yup.object(),
    }).test('at-least-one-update', 'At least one update field required', (value) => {
      return Object.keys(value).length > 0;
    }),
    options: yup.object({
      skipValidation: yup.boolean(),
      notifyUsers: yup.boolean(),
      reason: yup.string().required('Reason is required'),
    }).required(),
  }),
});

// Export users schema
export const exportUsersSchema = yup.object({
  format: yup.string().required('Format is required').oneOf(['csv', 'xlsx', 'json', 'pdf']),
  
  // Filters (same as list endpoint)
  roles: yup.array().of(yup.string().oneOf(Object.values(UserRole))),
  departments: yup.array().of(yup.string().uuid()),
  statuses: yup.array().of(yup.string().oneOf(Object.values(UserStatus))),
  accessLevels: yup.array().of(yup.number().min(1).max(5)),
  search: yup.string().trim().max(100),
  
  // Export options
  fields: yup.array().of(yup.string()),
  includeHeaders: yup.boolean().default(true),
  dateFormat: yup.string().default('YYYY-MM-DD'),
  timezone: yup.string().default('UTC'),
  
  // PDF specific
  orientation: yup.string().oneOf(['portrait', 'landscape']).default('portrait'),
  pageSize: yup.string().oneOf(['A4', 'Letter']).default('A4'),
});

// Import users schema
export const importUsersSchema = yup.object({
  body: yup.object({
    file: yup.mixed().required('File is required'),
    options: yup.object({
      format: yup.string().required().oneOf(['csv', 'xlsx', 'json']),
      hasHeaders: yup.boolean().default(true),
      columnMapping: yup.object(),
      
      // Import behavior
      mode: yup.string().required().oneOf(['create', 'update', 'upsert']),
      identifyBy: yup.string().oneOf(['email', 'employeeId', 'custom']).default('email'),
      customIdentifier: yup.string().when('identifyBy', {
        is: 'custom',
        then: (schema) => schema.required('Custom identifier required'),
      }),
      
      // Validation
      skipValidation: yup.boolean(),
      validateOnly: yup.boolean(),
      
      // Defaults
      defaultRole: yup.string().oneOf(Object.values(UserRole)),
      defaultDepartment: yup.string().uuid(),
      defaultAccessLevel: yup.number().min(1).max(5),
      generatePasswords: yup.boolean(),
      
      // Notifications
      sendWelcomeEmails: yup.boolean(),
      notifyOnError: yup.boolean(),
    }).required(),
  }),
});

// User ID param schema
export const userIdParamSchema = yup.object({
  id: yup.string().uuid('Invalid user ID').required(),
});

// Get user query schema
export const getUserQuerySchema = yup.object({
  include: yup.array().of(yup.string().oneOf(['permissions', 'activity', 'sessions', 'auditLogs', 'stats'])),
  fields: yup.array().of(yup.string()),
});

// Delete user query schema
export const deleteUserQuerySchema = yup.object({
  reassignTo: yup.string().uuid('Invalid reassignment target'),
  hardDelete: yup.boolean(),
  reason: yup.string(),
});