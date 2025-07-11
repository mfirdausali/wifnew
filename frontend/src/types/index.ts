// User types
export type UserRole = 'admin' | 'sales_manager' | 'finance_manager' | 'operations_manager';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  departmentId: string;
  position?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  accessLevel: number;
  permissions?: string[];
}

export interface CreateUserDTO {
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId: string;
  position?: string;
  phoneNumber?: string;
  permissions?: string[];
}

export interface UpdateUserDTO extends Partial<CreateUserDTO> {
  status?: UserStatus;
}

// Permission types
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  dependencies: string[];
  conflicts: string[];
  requiredRole?: UserRole;
  requiredAccessLevel?: number;
}

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  icon?: string;
}

// Department types
export interface Department {
  id: string;
  name: string;
  description?: string;
  parentId: string | null;
  managerIds: string[];
  memberCount: number;
  path: string[];
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentNode {
  id: string;
  department: Department;
  children: DepartmentNode[];
}

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
  parentId?: string | null;
  managerIds?: string[];
}

// Activity types
export type ActivityAction = 
  | 'user.login'
  | 'user.logout'
  | 'user.create'
  | 'user.update'
  | 'user.delete'
  | 'user.password_reset'
  | 'permission.grant'
  | 'permission.revoke'
  | 'bulk.update'
  | 'export.users'
  | 'import.users';

export interface ActivityLog {
  id: string;
  userId: string;
  action: ActivityAction;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    handler: string;
  };
}

// API response types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: PaginationMeta;
  };
}

// Export/Import types
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  fields?: string[];
  filters?: any;
}

export interface ImportOptions {
  updateExisting: boolean;
  skipDuplicates: boolean;
  validateEmails: boolean;
  sendWelcomeEmails: boolean;
}

export interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}