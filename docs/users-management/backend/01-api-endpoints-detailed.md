# Users Management - API Endpoints Detailed Specification

## Overview
This document provides exhaustive specifications for all API endpoints in the Users Management feature, including request/response schemas, validation rules, error handling, and implementation details.

## Table of Contents
1. [GET /api/users - List Users](#get-apiusers---list-users)
2. [POST /api/users - Create User](#post-apiusers---create-user)
3. [GET /api/users/:id - Get User Details](#get-apiusersid---get-user-details)
4. [PUT /api/users/:id - Update User](#put-apiusersid---update-user)
5. [DELETE /api/users/:id - Delete User](#delete-apiusersid---delete-user)
6. [PATCH /api/users/:id/status - Update User Status](#patch-apiusersidstatus---update-user-status)
7. [PATCH /api/users/:id/role - Update User Role](#patch-apiusersidrole---update-user-role)
8. [POST /api/users/bulk-update - Bulk Update Users](#post-apiusersbulk-update---bulk-update-users)
9. [GET /api/users/export - Export Users](#get-apiusersexport---export-users)
10. [POST /api/users/import - Import Users](#post-apiusersimport---import-users)

---

## 1. GET /api/users - List Users

### 1.1 Endpoint Details
```yaml
Method: GET
Path: /api/users
Description: Retrieve a paginated list of users with filtering and sorting
Authentication: Required
Permissions: users.view
Rate Limit: 100 requests per minute
Cache: 5 minutes (with cache invalidation on user changes)
```

### 1.2 Request Parameters

#### Query Parameters
```typescript
interface ListUsersQueryParams {
  // Pagination
  page?: number;              // Default: 1, Min: 1
  limit?: number;             // Default: 25, Min: 1, Max: 100
  
  // Sorting
  sortBy?: string;            // Default: 'createdAt'
  sortOrder?: 'asc' | 'desc'; // Default: 'desc'
  
  // Search
  search?: string;            // Searches: name, email, position, department
  
  // Filters
  roles?: string[];           // Array of role IDs
  departments?: string[];     // Array of department IDs
  statuses?: UserStatus[];    // Array of statuses
  accessLevels?: number[];    // Array of access levels (1-5)
  
  // Date filters
  createdAfter?: string;      // ISO 8601 date
  createdBefore?: string;     // ISO 8601 date
  lastActiveAfter?: string;   // ISO 8601 date
  lastActiveBefore?: string;  // ISO 8601 date
  
  // Relationship includes
  include?: string[];         // Options: 'department', 'manager', 'permissions', 'lastActivity'
  
  // Field selection
  fields?: string[];          // Specific fields to return
  
  // Special filters
  isOnline?: boolean;         // Currently online users
  hasNeverLoggedIn?: boolean; // Users who never logged in
  suspendedOnly?: boolean;    // Only suspended users
  withExpiredPasswords?: boolean; // Users with expired passwords
}
```

### 1.3 Response Schema

#### Success Response (200 OK)
```typescript
interface ListUsersResponse {
  success: true;
  data: User[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
    filters: {
      applied: Record<string, any>;
      available: {
        roles: { value: string; label: string; count: number }[];
        departments: { value: string; label: string; count: number }[];
        statuses: { value: string; label: string; count: number }[];
        accessLevels: { value: number; label: string; count: number }[];
      };
    };
    sorting: {
      field: string;
      order: 'asc' | 'desc';
    };
    search?: {
      query: string;
      fields: string[];
      matches: number;
    };
  };
  links: {
    self: string;
    first: string;
    last: string;
    prev?: string;
    next?: string;
  };
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  initials: string;
  
  // Professional info
  position?: string;
  department?: string;
  departmentDetails?: Department; // If include=department
  managerId?: string;
  managerDetails?: User;         // If include=manager
  
  // Access control
  role: UserRole;
  accessLevel: 1 | 2 | 3 | 4 | 5;
  permissions?: Permission[];     // If include=permissions
  
  // Status
  status: 'active' | 'inactive' | 'suspended';
  statusReason?: string;
  suspensionEndDate?: string;
  
  // Contact
  phone?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  
  // Profile
  avatar?: string;
  timezone?: string;
  language?: string;
  
  // Activity
  lastLoginAt?: string;
  lastActivityAt?: string;       // If include=lastActivity
  lastActivity?: UserActivity;    // If include=lastActivity
  loginCount: number;
  isOnline: boolean;
  
  // Security
  passwordChangedAt?: string;
  passwordExpiresAt?: string;
  requirePasswordChange: boolean;
  twoFactorEnabled: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  
  // Computed fields
  daysInactive?: number;
  passwordExpired?: boolean;
}
```

### 1.4 Implementation Example

```typescript
// routes/users.routes.ts
router.get('/users', 
  authenticate,
  authorize('users.view'),
  validate(listUsersSchema),
  rateLimiter('users-list'),
  cache('users-list', 300),
  asyncHandler(usersController.listUsers)
);

// controllers/users.controller.ts
export const listUsers = async (req: Request, res: Response) => {
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

  // Build query
  const query = buildUsersQuery({
    search,
    filters: {
      roles,
      departments,
      statuses,
      accessLevels,
      createdAfter,
      createdBefore,
      lastActiveAfter,
      lastActiveBefore,
      ...specialFilters
    }
  });

  // Apply field selection
  const select = fields ? buildFieldSelection(fields) : undefined;

  // Execute query with pagination
  const { users, total } = await userService.findUsers({
    where: query,
    include: buildIncludes(include),
    select,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Get filter counts for UI
  const filterCounts = await userService.getFilterCounts(query);

  // Build response
  const response: ListUsersResponse = {
    success: true,
    data: users.map(user => transformUser(user, { include, fields })),
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
        applied: removeEmptyValues({ roles, departments, statuses, accessLevels }),
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

  res.json(response);
};

// Query builder helper
const buildUsersQuery = ({ search, filters }: BuildQueryParams) => {
  const where: Prisma.UserWhereInput = {
    deletedAt: null, // Soft delete filter
  };

  // Search across multiple fields
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { position: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Role filter
  if (filters.roles?.length) {
    where.role = { in: filters.roles };
  }

  // Department filter
  if (filters.departments?.length) {
    where.department = { in: filters.departments };
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
    where.isOnline = filters.isOnline;
  }

  if (filters.hasNeverLoggedIn) {
    where.lastLoginAt = null;
  }

  if (filters.suspendedOnly) {
    where.status = 'suspended';
    where.suspensionEndDate = { gt: new Date() };
  }

  if (filters.withExpiredPasswords) {
    where.passwordExpiresAt = { lt: new Date() };
  }

  return where;
};
```

### 1.5 Error Responses

```typescript
// 400 Bad Request - Invalid parameters
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid query parameters",
    "details": {
      "page": "Must be a positive integer",
      "sortBy": "Invalid sort field"
    }
  }
}

// 401 Unauthorized - No authentication
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 403 Forbidden - No permission
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to view users"
  }
}

// 429 Too Many Requests - Rate limit exceeded
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retryAfter": 60
  }
}

// 500 Internal Server Error
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "requestId": "req_1234567890"
  }
}
```

### 1.6 Validation Schema

```typescript
const listUsersSchema = yup.object({
  query: yup.object({
    page: yup.number().positive().integer().default(1),
    limit: yup.number().positive().integer().min(1).max(100).default(25),
    sortBy: yup.string().oneOf([
      'firstName', 'lastName', 'email', 'role', 'department',
      'accessLevel', 'status', 'lastLoginAt', 'createdAt', 'updatedAt'
    ]).default('createdAt'),
    sortOrder: yup.string().oneOf(['asc', 'desc']).default('desc'),
    search: yup.string().trim().max(100),
    roles: yup.array().of(yup.string().oneOf(Object.values(UserRole))),
    departments: yup.array().of(yup.string()),
    statuses: yup.array().of(yup.string().oneOf(['active', 'inactive', 'suspended'])),
    accessLevels: yup.array().of(yup.number().min(1).max(5)),
    createdAfter: yup.date(),
    createdBefore: yup.date(),
    lastActiveAfter: yup.date(),
    lastActiveBefore: yup.date(),
    include: yup.array().of(yup.string().oneOf(['department', 'manager', 'permissions', 'lastActivity'])),
    fields: yup.array().of(yup.string()),
    isOnline: yup.boolean(),
    hasNeverLoggedIn: yup.boolean(),
    suspendedOnly: yup.boolean(),
    withExpiredPasswords: yup.boolean(),
  })
});
```

---

## 2. POST /api/users - Create User

### 2.1 Endpoint Details
```yaml
Method: POST
Path: /api/users
Description: Create a new user account
Authentication: Required
Permissions: users.create
Rate Limit: 20 requests per minute
Audit: Full request/response logged
```

### 2.2 Request Body

```typescript
interface CreateUserRequest {
  // Personal information
  email: string;              // Required, unique, valid email
  firstName: string;          // Required, 2-50 chars
  lastName: string;           // Required, 2-50 chars
  middleName?: string;        // Optional, 2-50 chars
  
  // Professional information
  position: string;           // Required, 3-100 chars
  department: string;         // Required, valid department ID
  managerId?: string;         // Optional, valid user ID
  employmentDate?: string;    // Optional, ISO 8601 date
  
  // Access control
  role: UserRole;             // Required
  accessLevel: 1 | 2 | 3 | 4 | 5; // Required
  permissions?: string[];     // Optional, additional permissions
  
  // Authentication
  password: string;           // Required, min 8 chars, complexity rules
  requirePasswordChange?: boolean; // Default: true
  
  // Contact information
  phone?: string;             // Optional, E.164 format
  timezone?: string;          // Optional, IANA timezone
  language?: string;          // Optional, ISO 639-1
  
  // Options
  sendWelcomeEmail?: boolean; // Default: true
  skipEmailVerification?: boolean; // Default: false
  
  // Metadata
  notes?: string;             // Optional admin notes
  customFields?: Record<string, any>; // Optional custom data
}
```

### 2.3 Response Schema

#### Success Response (201 Created)
```typescript
interface CreateUserResponse {
  success: true;
  data: {
    user: User;
    temporaryPassword?: string; // Only if password was auto-generated
    welcomeEmailSent: boolean;
    verificationEmailSent: boolean;
  };
  links: {
    self: string;
    edit: string;
    permissions: string;
  };
}
```

### 2.4 Implementation

```typescript
// controllers/users.controller.ts
export const createUser = async (req: Request, res: Response) => {
  const createData = req.body as CreateUserRequest;
  const createdBy = req.user!.id;

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Check email uniqueness
    const existingUser = await tx.user.findUnique({
      where: { email: createData.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    // Validate department
    const department = await tx.department.findUnique({
      where: { id: createData.department },
    });

    if (!department) {
      throw new ValidationError('Invalid department');
    }

    // Validate manager if provided
    if (createData.managerId) {
      const manager = await tx.user.findUnique({
        where: { id: createData.managerId },
      });

      if (!manager) {
        throw new ValidationError('Invalid manager ID');
      }

      // Check manager is in same or parent department
      if (!isValidManagerForDepartment(manager, department)) {
        throw new ValidationError('Manager must be in same or parent department');
      }
    }

    // Validate role and access level combination
    if (!isValidRoleAccessLevel(createData.role, createData.accessLevel)) {
      throw new ValidationError('Invalid role and access level combination');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createData.password, 12);

    // Create user
    const user = await tx.user.create({
      data: {
        email: createData.email.toLowerCase(),
        firstName: createData.firstName.trim(),
        lastName: createData.lastName.trim(),
        middleName: createData.middleName?.trim(),
        fullName: generateFullName(createData),
        initials: generateInitials(createData),
        
        position: createData.position,
        department: createData.department,
        managerId: createData.managerId,
        employmentDate: createData.employmentDate ? new Date(createData.employmentDate) : new Date(),
        
        role: createData.role,
        accessLevel: createData.accessLevel,
        
        password: hashedPassword,
        passwordChangedAt: new Date(),
        passwordExpiresAt: addDays(new Date(), 90), // 90 day expiry
        requirePasswordChange: createData.requirePasswordChange ?? true,
        
        phone: createData.phone,
        timezone: createData.timezone || 'UTC',
        language: createData.language || 'en',
        
        status: 'active',
        emailVerified: createData.skipEmailVerification || false,
        
        createdBy,
        updatedBy: createdBy,
        
        customFields: createData.customFields,
      },
      include: {
        departmentDetails: true,
        managerDetails: true,
      },
    });

    // Assign permissions
    if (createData.permissions?.length) {
      await assignPermissions(tx, user.id, createData.permissions, createdBy);
    }

    // Create audit log
    await tx.auditLog.create({
      data: {
        userId: createdBy,
        targetUserId: user.id,
        action: 'USER_CREATED',
        details: {
          email: user.email,
          role: user.role,
          department: user.department,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // Send emails (outside transaction)
    const emailTasks: Promise<any>[] = [];

    if (createData.sendWelcomeEmail !== false) {
      emailTasks.push(
        emailService.sendWelcomeEmail(user, {
          temporaryPassword: createData.password,
          requirePasswordChange: user.requirePasswordChange,
        })
      );
    }

    if (!createData.skipEmailVerification) {
      const verificationToken = await generateVerificationToken(user.id);
      emailTasks.push(
        emailService.sendVerificationEmail(user, verificationToken)
      );
    }

    const emailResults = await Promise.allSettled(emailTasks);

    return {
      user,
      welcomeEmailSent: emailResults[0]?.status === 'fulfilled',
      verificationEmailSent: emailResults[1]?.status === 'fulfilled',
    };
  });

  // Clear user list cache
  await cacheService.invalidatePattern('users-list:*');

  // Emit event for real-time updates
  eventEmitter.emit('user.created', {
    user: result.user,
    createdBy,
  });

  res.status(201).json({
    success: true,
    data: {
      user: transformUser(result.user),
      welcomeEmailSent: result.welcomeEmailSent,
      verificationEmailSent: result.verificationEmailSent,
    },
    links: {
      self: `/api/users/${result.user.id}`,
      edit: `/api/users/${result.user.id}`,
      permissions: `/api/users/${result.user.id}/permissions`,
    },
  });
};
```

### 2.5 Validation Rules

```typescript
const createUserSchema = yup.object({
  body: yup.object({
    // Personal information
    email: yup
      .string()
      .required('Email is required')
      .email('Invalid email format')
      .test('email-domain', 'Email domain not allowed', async (value) => {
        if (!value) return true;
        return await isAllowedEmailDomain(value);
      }),
    
    firstName: yup
      .string()
      .required('First name is required')
      .trim()
      .min(2, 'First name too short')
      .max(50, 'First name too long')
      .matches(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
    
    lastName: yup
      .string()
      .required('Last name is required')
      .trim()
      .min(2, 'Last name too short')
      .max(50, 'Last name too long')
      .matches(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
    
    middleName: yup
      .string()
      .trim()
      .min(2, 'Middle name too short')
      .max(50, 'Middle name too long')
      .matches(/^[a-zA-Z\s\-']+$/, 'Middle name contains invalid characters')
      .nullable(),
    
    // Professional information
    position: yup
      .string()
      .required('Position is required')
      .trim()
      .min(3, 'Position too short')
      .max(100, 'Position too long'),
    
    department: yup
      .string()
      .required('Department is required')
      .uuid('Invalid department ID'),
    
    managerId: yup
      .string()
      .uuid('Invalid manager ID')
      .nullable(),
    
    employmentDate: yup
      .date()
      .max(new Date(), 'Employment date cannot be in future')
      .nullable(),
    
    // Access control
    role: yup
      .string()
      .required('Role is required')
      .oneOf(Object.values(UserRole), 'Invalid role'),
    
    accessLevel: yup
      .number()
      .required('Access level is required')
      .min(1, 'Access level too low')
      .max(5, 'Access level too high'),
    
    permissions: yup
      .array()
      .of(yup.string())
      .test('valid-permissions', 'Invalid permissions', async (value) => {
        if (!value?.length) return true;
        return await areValidPermissions(value);
      }),
    
    // Authentication
    password: yup
      .string()
      .required('Password is required')
      .min(8, 'Password too short')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain uppercase, lowercase, number and special character'
      )
      .test('password-strength', 'Password is too weak', async (value) => {
        if (!value) return true;
        const strength = await checkPasswordStrength(value);
        return strength.score >= 3;
      })
      .test('password-breach', 'Password found in data breach', async (value) => {
        if (!value) return true;
        return !(await isPasswordBreached(value));
      }),
    
    requirePasswordChange: yup.boolean().default(true),
    
    // Contact information
    phone: yup
      .string()
      .matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone format')
      .nullable(),
    
    timezone: yup
      .string()
      .test('valid-timezone', 'Invalid timezone', (value) => {
        if (!value) return true;
        return isValidTimezone(value);
      })
      .nullable(),
    
    language: yup
      .string()
      .matches(/^[a-z]{2}$/, 'Invalid language code')
      .nullable(),
    
    // Options
    sendWelcomeEmail: yup.boolean().default(true),
    skipEmailVerification: yup.boolean().default(false),
    
    // Metadata
    notes: yup.string().max(1000, 'Notes too long').nullable(),
    customFields: yup.object().nullable(),
  }),
});
```

### 2.6 Error Responses

```typescript
// 400 Bad Request - Validation errors
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Email already in use",
      "password": "Password is too weak",
      "department": "Invalid department ID"
    }
  }
}

// 409 Conflict - Email already exists
{
  "success": false,
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "A user with this email already exists"
  }
}

// 422 Unprocessable Entity - Business logic error
{
  "success": false,
  "error": {
    "code": "INVALID_ROLE_ACCESS_LEVEL",
    "message": "Sales Manager role requires access level 2 or higher"
  }
}
```

---

## 3. GET /api/users/:id - Get User Details

### 3.1 Endpoint Details
```yaml
Method: GET
Path: /api/users/:id
Description: Get detailed information about a specific user
Authentication: Required
Permissions: users.view OR viewing own profile
Rate Limit: 200 requests per minute
Cache: 10 minutes
```

### 3.2 Request Parameters

#### Path Parameters
```typescript
interface GetUserParams {
  id: string; // User ID (UUID)
}
```

#### Query Parameters
```typescript
interface GetUserQuery {
  include?: string[]; // Options: 'permissions', 'activity', 'sessions', 'auditLogs', 'stats'
  fields?: string[];  // Specific fields to return
}
```

### 3.3 Response Schema

#### Success Response (200 OK)
```typescript
interface GetUserResponse {
  success: true;
  data: UserDetails;
  links: {
    self: string;
    edit: string;
    permissions: string;
    activity: string;
    sessions: string;
  };
}

interface UserDetails extends User {
  // Additional details
  permissions?: DetailedPermission[];      // If include=permissions
  activitySummary?: ActivitySummary;       // If include=activity
  activeSessions?: Session[];              // If include=sessions
  recentAuditLogs?: AuditLog[];           // If include=auditLogs
  statistics?: UserStatistics;             // If include=stats
  
  // Computed fields
  accountAge: number;                      // Days since creation
  passwordAge: number;                     // Days since last change
  daysUntilPasswordExpiry?: number;
  lastSeenRelative: string;               // "2 hours ago"
}

interface DetailedPermission {
  id: string;
  name: string;
  description: string;
  category: string;
  source: 'role' | 'direct' | 'department';
  grantedAt: string;
  grantedBy?: string;
  expiresAt?: string;
}

interface ActivitySummary {
  lastLogin: string;
  lastActivity: string;
  totalLogins: number;
  failedLogins: number;
  averageSessionDuration: number; // minutes
  mostActiveHours: number[];      // 0-23
  preferredDevices: {
    type: string;
    count: number;
    lastUsed: string;
  }[];
}

interface UserStatistics {
  createdRecords: number;
  updatedRecords: number;
  performedActions: {
    action: string;
    count: number;
  }[];
  dataAccess: {
    module: string;
    accessCount: number;
    lastAccessed: string;
  }[];
}
```

### 3.4 Implementation

```typescript
export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { include = [], fields } = req.query as GetUserQuery;
  const requesterId = req.user!.id;

  // Check if user is viewing own profile
  const isOwnProfile = id === requesterId;

  // Permission check
  if (!isOwnProfile && !req.user!.permissions.includes('users.view')) {
    throw new ForbiddenError('No permission to view other users');
  }

  // Build query
  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    include: buildUserIncludes(include, isOwnProfile),
    select: fields ? buildFieldSelection(fields) : undefined,
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Additional permission check for sensitive data
  if (!isOwnProfile && user.role === 'admin' && req.user!.role !== 'admin') {
    // Non-admins cannot view admin details
    throw new ForbiddenError('Cannot view administrator details');
  }

  // Load additional data based on includes
  const additionalData: any = {};

  if (include.includes('permissions')) {
    additionalData.permissions = await getUserPermissions(user.id);
  }

  if (include.includes('activity')) {
    additionalData.activitySummary = await getActivitySummary(user.id);
  }

  if (include.includes('sessions')) {
    additionalData.activeSessions = await getActiveSessions(user.id);
  }

  if (include.includes('auditLogs')) {
    // Check permission for audit logs
    if (!isOwnProfile && !req.user!.permissions.includes('audit.view')) {
      throw new ForbiddenError('No permission to view audit logs');
    }
    additionalData.recentAuditLogs = await getRecentAuditLogs(user.id);
  }

  if (include.includes('stats')) {
    additionalData.statistics = await getUserStatistics(user.id);
  }

  // Calculate computed fields
  const now = new Date();
  const userDetails: UserDetails = {
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
  await logDataAccess({
    userId: requesterId,
    targetUserId: user.id,
    action: 'VIEW_USER_DETAILS',
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    data: userDetails,
    links: {
      self: `/api/users/${user.id}`,
      edit: `/api/users/${user.id}`,
      permissions: `/api/users/${user.id}/permissions`,
      activity: `/api/users/${user.id}/activity`,
      sessions: `/api/users/${user.id}/sessions`,
    },
  });
};
```

### 3.5 Permission Logic

```typescript
const checkUserViewPermission = async (
  viewer: User,
  targetUser: User,
  requestedIncludes: string[]
): Promise<void> => {
  // Own profile - allow most data
  if (viewer.id === targetUser.id) {
    if (requestedIncludes.includes('auditLogs')) {
      throw new ForbiddenError('Cannot view own audit logs');
    }
    return;
  }

  // Check base permission
  if (!viewer.permissions.includes('users.view')) {
    throw new ForbiddenError('No permission to view users');
  }

  // Department-based access
  if (viewer.accessLevel < 4) {
    // Levels 1-3 can only view within department
    if (viewer.department !== targetUser.department) {
      const canViewCrossDepartment = await checkCrossDepartmentPermission(
        viewer,
        targetUser.department
      );
      
      if (!canViewCrossDepartment) {
        throw new ForbiddenError('Cannot view users from other departments');
      }
    }
  }

  // Role-based restrictions
  if (targetUser.role === 'admin' && viewer.role !== 'admin') {
    throw new ForbiddenError('Only admins can view admin details');
  }

  // Include-specific permissions
  if (requestedIncludes.includes('permissions') && 
      !viewer.permissions.includes('users.view-permissions')) {
    throw new ForbiddenError('No permission to view user permissions');
  }

  if (requestedIncludes.includes('auditLogs') && 
      !viewer.permissions.includes('audit.view')) {
    throw new ForbiddenError('No permission to view audit logs');
  }

  if (requestedIncludes.includes('sessions') && 
      !viewer.permissions.includes('users.view-sessions')) {
    throw new ForbiddenError('No permission to view user sessions');
  }
};
```

---

## 4. PUT /api/users/:id - Update User

### 4.1 Endpoint Details
```yaml
Method: PUT
Path: /api/users/:id
Description: Update user information
Authentication: Required
Permissions: users.edit OR editing own profile (limited fields)
Rate Limit: 50 requests per minute
Audit: Full change tracking
```

### 4.2 Request Body

```typescript
interface UpdateUserRequest {
  // Personal information (self-editable)
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  phone?: string | null;
  timezone?: string;
  language?: string;
  
  // Professional information (admin only)
  position?: string;
  department?: string;
  managerId?: string | null;
  employmentDate?: string;
  
  // Access control (admin only)
  role?: UserRole;
  accessLevel?: 1 | 2 | 3 | 4 | 5;
  permissions?: string[];
  
  // Account settings (self-editable with restrictions)
  email?: string;                    // Requires email verification
  twoFactorEnabled?: boolean;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  
  // Metadata (admin only)
  notes?: string;
  customFields?: Record<string, any>;
  
  // Options
  skipValidation?: boolean;          // Admin only, dangerous
  reason?: string;                   // Reason for changes
}
```

### 4.3 Implementation

```typescript
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body as UpdateUserRequest;
  const updaterId = req.user!.id;
  const isOwnProfile = id === updaterId;

  // Get current user data
  const currentUser = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  });

  if (!currentUser) {
    throw new NotFoundError('User not found');
  }

  // Determine allowed fields based on permissions
  const allowedFields = getAllowedUpdateFields(req.user!, isOwnProfile);
  
  // Filter updates to allowed fields only
  const filteredUpdates = pickAllowedFields(updates, allowedFields);

  // Validate updates
  if (!updates.skipValidation || !req.user!.permissions.includes('admin.skip-validation')) {
    await validateUserUpdates(filteredUpdates, currentUser);
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
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

      // Create email change request
      const changeToken = await createEmailChangeToken(
        currentUser.id,
        filteredUpdates.email
      );

      // Send verification email
      await emailService.sendEmailChangeVerification(
        currentUser,
        filteredUpdates.email,
        changeToken
      );

      // Don't update email yet
      delete updateData.email;
      
      await tx.notification.create({
        data: {
          userId: currentUser.id,
          type: 'EMAIL_CHANGE_PENDING',
          message: `Email change to ${filteredUpdates.email} pending verification`,
        },
      });
    }

    // Handle department change
    if (filteredUpdates.department && filteredUpdates.department !== currentUser.department) {
      // Validate new department
      const newDepartment = await tx.department.findUnique({
        where: { id: filteredUpdates.department },
      });

      if (!newDepartment) {
        throw new ValidationError('Invalid department');
      }

      // Check if manager is still valid
      if (currentUser.managerId) {
        const manager = await tx.user.findUnique({
          where: { id: currentUser.managerId },
        });

        if (manager && !isValidManagerForDepartment(manager, newDepartment)) {
          updateData.managerId = null; // Clear invalid manager
        }
      }
    }

    // Handle role/access level change
    if (filteredUpdates.role || filteredUpdates.accessLevel) {
      const newRole = filteredUpdates.role || currentUser.role;
      const newAccessLevel = filteredUpdates.accessLevel || currentUser.accessLevel;

      if (!isValidRoleAccessLevel(newRole, newAccessLevel)) {
        throw new ValidationError('Invalid role and access level combination');
      }

      // Log permission change
      await tx.auditLog.create({
        data: {
          userId: updaterId,
          targetUserId: currentUser.id,
          action: 'PERMISSIONS_CHANGED',
          details: {
            oldRole: currentUser.role,
            newRole,
            oldAccessLevel: currentUser.accessLevel,
            newAccessLevel,
            reason: updates.reason,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    }

    // Update user
    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        ...updateData,
        fullName: generateFullName({
          firstName: updateData.firstName || currentUser.firstName,
          lastName: updateData.lastName || currentUser.lastName,
          middleName: updateData.middleName !== undefined 
            ? updateData.middleName 
            : currentUser.middleName,
        }),
        initials: generateInitials({
          firstName: updateData.firstName || currentUser.firstName,
          lastName: updateData.lastName || currentUser.lastName,
        }),
        updatedBy: updaterId,
        updatedAt: new Date(),
      },
      include: {
        departmentDetails: true,
        managerDetails: true,
      },
    });

    // Handle permission updates
    if (filteredUpdates.permissions && !isOwnProfile) {
      await updateUserPermissions(
        tx,
        currentUser.id,
        filteredUpdates.permissions,
        updaterId
      );
    }

    // Create audit log for changes
    const changes = getObjectDiff(currentUser, updatedUser);
    if (Object.keys(changes).length > 0) {
      await tx.auditLog.create({
        data: {
          userId: updaterId,
          targetUserId: currentUser.id,
          action: 'USER_UPDATED',
          details: {
            changes,
            reason: updates.reason,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    }

    return updatedUser;
  });

  // Clear caches
  await Promise.all([
    cacheService.delete(`user:${id}`),
    cacheService.invalidatePattern('users-list:*'),
  ]);

  // Emit update event
  eventEmitter.emit('user.updated', {
    user: result,
    updatedBy: updaterId,
    changes: getObjectDiff(currentUser, result),
  });

  res.json({
    success: true,
    data: transformUser(result),
    links: {
      self: `/api/users/${result.id}`,
      permissions: `/api/users/${result.id}/permissions`,
    },
  });
};

// Helper to determine allowed fields
const getAllowedUpdateFields = (user: User, isOwnProfile: boolean): string[] => {
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
};
```

### 4.4 Validation Schema

```typescript
const updateUserSchema = yup.object({
  body: yup.object({
    firstName: yup
      .string()
      .trim()
      .min(2, 'First name too short')
      .max(50, 'First name too long')
      .matches(/^[a-zA-Z\s\-']+$/, 'Invalid characters'),
    
    lastName: yup
      .string()
      .trim()
      .min(2, 'Last name too short')
      .max(50, 'Last name too long')
      .matches(/^[a-zA-Z\s\-']+$/, 'Invalid characters'),
    
    email: yup
      .string()
      .email('Invalid email format')
      .test('email-change-limit', 'Too many email changes', async (value, context) => {
        if (!value || value === context.parent.currentEmail) return true;
        const recentChanges = await getRecentEmailChanges(context.parent.userId);
        return recentChanges < 3; // Max 3 changes per month
      }),
    
    role: yup
      .string()
      .oneOf(Object.values(UserRole))
      .test('role-change', 'Invalid role change', async (value, context) => {
        if (!value) return true;
        return await canChangeRole(
          context.options.context.user,
          context.parent.currentRole,
          value
        );
      }),
    
    accessLevel: yup
      .number()
      .min(1)
      .max(5)
      .test('access-level-change', 'Cannot increase own access level', (value, context) => {
        if (!value) return true;
        const isOwnProfile = context.options.context.userId === context.parent.userId;
        if (isOwnProfile && value > context.parent.currentAccessLevel) {
          return false;
        }
        return true;
      }),
    
    department: yup
      .string()
      .uuid('Invalid department')
      .test('department-transfer', 'Invalid department transfer', async (value, context) => {
        if (!value || value === context.parent.currentDepartment) return true;
        return await canTransferDepartment(
          context.options.context.user,
          context.parent.userId,
          value
        );
      }),
  }).test('at-least-one-field', 'No changes provided', (value) => {
    return Object.keys(value).length > 0;
  }),
});
```

---

## 5. DELETE /api/users/:id - Delete User

### 5.1 Endpoint Details
```yaml
Method: DELETE
Path: /api/users/:id
Description: Soft delete a user account
Authentication: Required
Permissions: users.delete
Rate Limit: 10 requests per minute
Audit: Full audit trail maintained
```

### 5.2 Request Parameters

#### Path Parameters
```typescript
interface DeleteUserParams {
  id: string; // User ID to delete
}
```

#### Query Parameters
```typescript
interface DeleteUserQuery {
  reassignTo?: string;     // User ID to reassign ownership
  hardDelete?: boolean;    // Permanent deletion (super admin only)
  reason?: string;         // Reason for deletion
}
```

### 5.3 Implementation

```typescript
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reassignTo, hardDelete, reason } = req.query as DeleteUserQuery;
  const deletedBy = req.user!.id;

  // Prevent self-deletion
  if (id === deletedBy) {
    throw new ValidationError('Cannot delete your own account');
  }

  // Get user to delete
  const userToDelete = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    include: {
      _count: {
        select: {
          createdRecords: true,
          managedUsers: true,
          ownedDocuments: true,
        },
      },
    },
  });

  if (!userToDelete) {
    throw new NotFoundError('User not found');
  }

  // Check permissions for deleting admins
  if (userToDelete.role === 'admin' && !req.user!.permissions.includes('admin.delete')) {
    throw new ForbiddenError('Cannot delete administrator accounts');
  }

  // Handle reassignment
  if (userToDelete._count.createdRecords > 0 || 
      userToDelete._count.managedUsers > 0 || 
      userToDelete._count.ownedDocuments > 0) {
    
    if (!reassignTo) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'REASSIGNMENT_REQUIRED',
          message: 'User has associated data that must be reassigned',
          details: {
            createdRecords: userToDelete._count.createdRecords,
            managedUsers: userToDelete._count.managedUsers,
            ownedDocuments: userToDelete._count.ownedDocuments,
          },
        },
      });
    }

    // Validate reassignment target
    const reassignTarget = await prisma.user.findUnique({
      where: { id: reassignTo, deletedAt: null },
    });

    if (!reassignTarget) {
      throw new ValidationError('Invalid reassignment target');
    }

    if (reassignTarget.status !== 'active') {
      throw new ValidationError('Reassignment target must be active');
    }
  }

  // Perform deletion
  const result = await prisma.$transaction(async (tx) => {
    // Reassign data if needed
    if (reassignTo) {
      await reassignUserData(tx, id, reassignTo);
    }

    let deletedUser;

    if (hardDelete && req.user!.permissions.includes('admin.hard-delete')) {
      // Permanent deletion
      // First, anonymize audit logs
      await tx.auditLog.updateMany({
        where: { OR: [{ userId: id }, { targetUserId: id }] },
        data: {
          userId: '[DELETED]',
          targetUserId: '[DELETED]',
          details: tx.json({
            ...tx.auditLog.details,
            _deleted: true,
            _deletedAt: new Date(),
          }),
        },
      });

      // Delete user permanently
      deletedUser = await tx.user.delete({
        where: { id },
      });
    } else {
      // Soft delete
      deletedUser = await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy,
          status: 'inactive',
          // Anonymize personal data
          email: `deleted_${id}@deleted.local`,
          firstName: '[DELETED]',
          lastName: '[DELETED]',
          middleName: null,
          phone: null,
          // Clear sensitive data
          password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
          sessions: {
            deleteMany: {},
          },
          tokens: {
            deleteMany: {},
          },
        },
      });
    }

    // Create deletion audit log
    await tx.auditLog.create({
      data: {
        userId: deletedBy,
        targetUserId: hardDelete ? '[DELETED]' : id,
        action: hardDelete ? 'USER_HARD_DELETED' : 'USER_SOFT_DELETED',
        details: {
          email: userToDelete.email,
          role: userToDelete.role,
          department: userToDelete.department,
          reassignedTo: reassignTo,
          reason,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    // Revoke all active sessions
    await sessionService.revokeAllUserSessions(id);

    return deletedUser;
  });

  // Clear caches
  await Promise.all([
    cacheService.delete(`user:${id}`),
    cacheService.invalidatePattern('users-list:*'),
    cacheService.invalidatePattern(`user-permissions:${id}:*`),
  ]);

  // Emit deletion event
  eventEmitter.emit('user.deleted', {
    userId: id,
    deletedBy,
    hardDelete: !!hardDelete,
    reassignedTo: reassignTo,
  });

  res.json({
    success: true,
    message: hardDelete ? 'User permanently deleted' : 'User account deactivated',
    data: {
      deletedUserId: id,
      reassignedTo: reassignTo,
      timestamp: new Date(),
    },
  });
};

// Helper to reassign user data
const reassignUserData = async (
  tx: PrismaTransactionClient,
  fromUserId: string,
  toUserId: string
): Promise<void> => {
  // Reassign managed users
  await tx.user.updateMany({
    where: { managerId: fromUserId },
    data: { managerId: toUserId },
  });

  // Reassign created records
  await tx.record.updateMany({
    where: { createdBy: fromUserId },
    data: { createdBy: toUserId },
  });

  // Reassign documents
  await tx.document.updateMany({
    where: { ownerId: fromUserId },
    data: { ownerId: toUserId },
  });

  // Add more reassignments as needed for your domain
};
```

---

## 6. PATCH /api/users/:id/status - Update User Status

### 6.1 Endpoint Details
```yaml
Method: PATCH
Path: /api/users/:id/status
Description: Update user account status
Authentication: Required
Permissions: users.manage-status
Rate Limit: 30 requests per minute
```

### 6.2 Request Body

```typescript
interface UpdateUserStatusRequest {
  status: 'active' | 'inactive' | 'suspended';
  reason?: string;                    // Required for suspension
  suspensionEndDate?: string;         // ISO 8601, for temporary suspension
  notifyUser?: boolean;               // Send email notification
  revokeActiveSessions?: boolean;     // Force logout
}
```

### 6.3 Implementation

```typescript
export const updateUserStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    status,
    reason,
    suspensionEndDate,
    notifyUser = true,
    revokeActiveSessions = true,
  } = req.body as UpdateUserStatusRequest;

  // Validation
  if (status === 'suspended' && !reason) {
    throw new ValidationError('Reason required for suspension');
  }

  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Check if status change is valid
  const validTransitions = {
    active: ['inactive', 'suspended'],
    inactive: ['active', 'suspended'],
    suspended: ['active', 'inactive'],
  };

  if (!validTransitions[user.status].includes(status)) {
    throw new ValidationError(
      `Cannot change status from ${user.status} to ${status}`
    );
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      status,
      statusReason: reason,
      suspensionEndDate: suspensionEndDate ? new Date(suspensionEndDate) : null,
      updatedBy: req.user!.id,
    },
  });

  // Revoke sessions if needed
  if (revokeActiveSessions && (status === 'inactive' || status === 'suspended')) {
    await sessionService.revokeAllUserSessions(id);
  }

  // Send notification
  if (notifyUser) {
    await emailService.sendStatusChangeNotification(updatedUser, {
      oldStatus: user.status,
      newStatus: status,
      reason,
      suspensionEndDate,
    });
  }

  // Audit log
  await createAuditLog({
    userId: req.user!.id,
    targetUserId: id,
    action: 'USER_STATUS_CHANGED',
    details: {
      oldStatus: user.status,
      newStatus: status,
      reason,
      suspensionEndDate,
    },
  });

  res.json({
    success: true,
    data: {
      userId: id,
      status,
      statusReason: reason,
      suspensionEndDate,
      sessionsRevoked: revokeActiveSessions,
      notificationSent: notifyUser,
    },
  });
};
```

---

## 7. PATCH /api/users/:id/role - Update User Role

### 7.1 Request Body

```typescript
interface UpdateUserRoleRequest {
  role: UserRole;
  accessLevel?: number;      // Optionally update access level
  reason: string;            // Required for audit
  effectiveDate?: string;    // Schedule role change
  notifyUser?: boolean;      // Default: true
}
```

### 7.2 Implementation

```typescript
export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    role,
    accessLevel,
    reason,
    effectiveDate,
    notifyUser = true,
  } = req.body;

  const user = await prisma.user.findUnique({
    where: { id, deletedAt: null },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Validate role change permissions
  if (!canAssignRole(req.user!, role)) {
    throw new ForbiddenError(`You cannot assign ${role} role`);
  }

  // Validate role and access level combination
  const finalAccessLevel = accessLevel ?? user.accessLevel;
  if (!isValidRoleAccessLevel(role, finalAccessLevel)) {
    throw new ValidationError('Invalid role and access level combination');
  }

  if (effectiveDate && new Date(effectiveDate) > new Date()) {
    // Schedule role change
    await scheduleRoleChange({
      userId: id,
      newRole: role,
      newAccessLevel: finalAccessLevel,
      effectiveDate: new Date(effectiveDate),
      scheduledBy: req.user!.id,
      reason,
    });

    return res.json({
      success: true,
      message: 'Role change scheduled',
      data: {
        scheduledFor: effectiveDate,
        currentRole: user.role,
        futureRole: role,
      },
    });
  }

  // Immediate role change
  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        role,
        accessLevel: finalAccessLevel,
        updatedBy: req.user!.id,
      },
    });

    // Update role-based permissions
    await updateRolePermissions(tx, id, role);

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: req.user!.id,
        targetUserId: id,
        action: 'USER_ROLE_CHANGED',
        details: {
          oldRole: user.role,
          newRole: role,
          oldAccessLevel: user.accessLevel,
          newAccessLevel: finalAccessLevel,
          reason,
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    return updated;
  });

  // Clear permission cache
  await cacheService.invalidatePattern(`user-permissions:${id}:*`);

  // Send notification
  if (notifyUser) {
    await emailService.sendRoleChangeNotification(updatedUser, {
      oldRole: user.role,
      newRole: role,
      reason,
    });
  }

  res.json({
    success: true,
    data: {
      userId: id,
      role,
      accessLevel: finalAccessLevel,
      previousRole: user.role,
      previousAccessLevel: user.accessLevel,
    },
  });
};
```

---

## 8. POST /api/users/bulk-update - Bulk Update Users

### 8.1 Request Body

```typescript
interface BulkUpdateRequest {
  userIds: string[];           // Users to update
  updates: {
    status?: UserStatus;
    role?: UserRole;
    accessLevel?: number;
    department?: string;
    managerId?: string;
    customFields?: Record<string, any>;
  };
  options: {
    skipValidation?: boolean;
    notifyUsers?: boolean;
    reason: string;           // Required for audit
  };
}
```

### 8.2 Implementation

```typescript
export const bulkUpdateUsers = async (req: Request, res: Response) => {
  const { userIds, updates, options } = req.body as BulkUpdateRequest;

  // Validate bulk operation size
  if (userIds.length > 100) {
    throw new ValidationError('Maximum 100 users per bulk operation');
  }

  // Check permissions for bulk operations
  if (!req.user!.permissions.includes('users.bulk-edit')) {
    throw new ForbiddenError('No permission for bulk operations');
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
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'USERS_NOT_FOUND',
        message: 'Some users not found',
        details: { missingIds },
      },
    });
  }

  // Validate updates for each user
  if (!options.skipValidation) {
    const validationErrors = await validateBulkUpdates(users, updates, req.user!);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERRORS',
          message: 'Validation failed for some users',
          details: validationErrors,
        },
      });
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
            updatedBy: req.user!.id,
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
            userId: req.user!.id,
            targetUserId: user.id,
            action: 'USER_BULK_UPDATED',
            details: {
              updates,
              reason: options.reason,
            },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        });
      } catch (error) {
        updateResults.push({
          userId: user.id,
          success: false,
          error: error.message,
        });
      }
    }

    return updateResults;
  });

  // Clear caches
  await cacheService.invalidatePattern('users-list:*');
  
  // Send notifications
  if (options.notifyUsers) {
    const successfulUpdates = results.filter(r => r.success);
    await sendBulkUpdateNotifications(successfulUpdates, updates, options.reason);
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  res.json({
    success: true,
    message: `Updated ${successCount} users${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
    data: {
      total: userIds.length,
      succeeded: successCount,
      failed: failureCount,
      results,
    },
  });
};
```

---

## 9. GET /api/users/export - Export Users

### 9.1 Query Parameters

```typescript
interface ExportUsersQuery {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  
  // Filters (same as list endpoint)
  roles?: string[];
  departments?: string[];
  statuses?: UserStatus[];
  // ... other filters
  
  // Export options
  fields?: string[];           // Specific fields to export
  includeHeaders?: boolean;    // Include column headers
  dateFormat?: string;         // Date formatting
  timezone?: string;           // Convert dates to timezone
  
  // PDF specific
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'Letter';
}
```

### 9.2 Implementation

```typescript
export const exportUsers = async (req: Request, res: Response) => {
  const query = req.query as ExportUsersQuery;

  // Check export permission
  if (!req.user!.permissions.includes('users.export')) {
    throw new ForbiddenError('No permission to export users');
  }

  // Apply same filters as list endpoint
  const users = await userService.findUsers({
    where: buildUsersQuery({ filters: query }),
    select: query.fields ? buildFieldSelection(query.fields) : getExportFields(query.format),
  });

  // Check export size limit
  if (users.length > 10000) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'EXPORT_TOO_LARGE',
        message: 'Export exceeds maximum size',
        details: {
          count: users.length,
          maxAllowed: 10000,
        },
      },
    });
  }

  // Generate export file
  let fileBuffer: Buffer;
  let contentType: string;
  let filename: string;

  switch (query.format) {
    case 'csv':
      fileBuffer = await generateCSV(users, query);
      contentType = 'text/csv';
      filename = `users_export_${Date.now()}.csv`;
      break;

    case 'xlsx':
      fileBuffer = await generateExcel(users, query);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `users_export_${Date.now()}.xlsx`;
      break;

    case 'json':
      fileBuffer = Buffer.from(JSON.stringify(users, null, 2));
      contentType = 'application/json';
      filename = `users_export_${Date.now()}.json`;
      break;

    case 'pdf':
      fileBuffer = await generatePDF(users, query);
      contentType = 'application/pdf';
      filename = `users_export_${Date.now()}.pdf`;
      break;
  }

  // Audit log
  await createAuditLog({
    userId: req.user!.id,
    action: 'USERS_EXPORTED',
    details: {
      format: query.format,
      count: users.length,
      filters: query,
    },
  });

  // Send file
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', fileBuffer.length.toString());
  res.send(fileBuffer);
};
```

---

## 10. POST /api/users/import - Import Users

### 10.1 Request Body

```typescript
interface ImportUsersRequest {
  file: File;                        // Uploaded file
  options: {
    format: 'csv' | 'xlsx' | 'json';
    hasHeaders?: boolean;            // First row contains headers
    columnMapping?: Record<string, string>; // Map columns to fields
    
    // Import behavior
    mode: 'create' | 'update' | 'upsert';
    identifyBy?: 'email' | 'employeeId' | 'custom';
    customIdentifier?: string;
    
    // Validation
    skipValidation?: boolean;
    validateOnly?: boolean;          // Dry run
    
    // Defaults for missing data
    defaultRole?: UserRole;
    defaultDepartment?: string;
    defaultAccessLevel?: number;
    generatePasswords?: boolean;
    
    // Notifications
    sendWelcomeEmails?: boolean;
    notifyOnError?: boolean;
  };
}
```

### 10.2 Implementation

```typescript
export const importUsers = async (req: Request, res: Response) => {
  const { file, options } = req.body as ImportUsersRequest;

  // Check permission
  if (!req.user!.permissions.includes('users.import')) {
    throw new ForbiddenError('No permission to import users');
  }

  // Parse file
  const parsedData = await parseImportFile(file, options);

  if (parsedData.errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse import file',
        details: parsedData.errors,
      },
    });
  }

  // Validate data
  const validationResults = await validateImportData(parsedData.rows, options);

  if (options.validateOnly) {
    return res.json({
      success: true,
      data: {
        totalRows: parsedData.rows.length,
        validRows: validationResults.valid.length,
        invalidRows: validationResults.invalid.length,
        warnings: validationResults.warnings,
        errors: validationResults.errors,
      },
    });
  }

  if (validationResults.invalid.length > 0 && !options.skipValidation) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Import data validation failed',
        details: {
          invalidRows: validationResults.invalid,
          errors: validationResults.errors,
        },
      },
    });
  }

  // Process import
  const importId = generateImportId();
  const importResults = await processImport(
    validationResults.valid,
    options,
    req.user!.id,
    importId
  );

  // Send notifications
  if (options.sendWelcomeEmails) {
    await sendImportWelcomeEmails(importResults.created);
  }

  if (options.notifyOnError && importResults.failed.length > 0) {
    await notifyImportErrors(req.user!.email, importId, importResults.failed);
  }

  res.json({
    success: true,
    data: {
      importId,
      summary: {
        total: parsedData.rows.length,
        created: importResults.created.length,
        updated: importResults.updated.length,
        failed: importResults.failed.length,
        skipped: importResults.skipped.length,
      },
      results: importResults,
    },
  });
};

// Import processing logic
const processImport = async (
  rows: any[],
  options: ImportOptions,
  importedBy: string,
  importId: string
): Promise<ImportResults> => {
  const results: ImportResults = {
    created: [],
    updated: [],
    failed: [],
    skipped: [],
  };

  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    
    await prisma.$transaction(async (tx) => {
      for (const row of batch) {
        try {
          const processedUser = await processUserRow(tx, row, options, importedBy);
          
          if (processedUser.action === 'created') {
            results.created.push(processedUser);
          } else if (processedUser.action === 'updated') {
            results.updated.push(processedUser);
          } else if (processedUser.action === 'skipped') {
            results.skipped.push(processedUser);
          }
        } catch (error) {
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
      importedBy,
      filename: options.filename,
      totalRows: rows.length,
      successCount: results.created.length + results.updated.length,
      failureCount: results.failed.length,
      results: results,
    },
  });

  return results;
};
```

---

## Common Response Headers

All endpoints include these standard headers:

```typescript
{
  "X-Request-ID": "req_1234567890",      // Unique request ID for tracking
  "X-Response-Time": "245ms",            // Processing time
  "X-Rate-Limit-Limit": "100",          // Rate limit ceiling
  "X-Rate-Limit-Remaining": "99",       // Remaining requests
  "X-Rate-Limit-Reset": "1640000000",   // Reset timestamp
  "Cache-Control": "private, max-age=0", // Cache directives
  "Content-Type": "application/json",    // Response type
  "Content-Security-Policy": "...",      // Security policy
}
```

## Error Response Structure

All error responses follow this structure:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;          // Machine-readable error code
    message: string;       // Human-readable message
    details?: any;         // Additional error details
    field?: string;        // Field that caused error
    requestId?: string;    // Request ID for support
    docUrl?: string;       // Link to documentation
  };
  meta?: {
    timestamp: string;
    path: string;
    method: string;
  };
}
```

## Pagination Meta Structure

```typescript
interface PaginationMeta {
  page: number;         // Current page (1-based)
  limit: number;        // Items per page
  total: number;        // Total items
  totalPages: number;   // Total pages
  hasNextPage: boolean; // Has next page
  hasPrevPage: boolean; // Has previous page
}
```

## Rate Limiting

Different endpoints have different rate limits:

- **Read operations**: 100-200 requests/minute
- **Write operations**: 20-50 requests/minute  
- **Bulk operations**: 10 requests/minute
- **Export operations**: 5 requests/minute

Rate limit headers are included in all responses.