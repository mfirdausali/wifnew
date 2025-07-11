// Re-export types from the main types file
export type {
  User,
  UserRole,
  UserStatus,
  CreateUserDTO,
  UpdateUserDTO,
  Permission,
  PermissionGroup,
  Department,
  DepartmentNode,
  CreateDepartmentDTO,
  ActivityAction,
  ActivityLog,
  Notification,
  PaginationMeta,
  ApiResponse,
  ExportOptions,
  ImportOptions,
  ImportResult
} from '@/types';

// Additional API-specific types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: PaginationMeta;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  statusCode: number;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
}

// User-specific types
export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  lastActivity: string;
  createdAt: string;
}

export interface UserSuggestion {
  id: string;
  email: string;
  fullName: string;
  role: string;
  departmentName?: string;
  avatarUrl?: string;
}

export interface UserPermission {
  id: string;
  permission: string;
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
  reason?: string;
}

// Department-specific types
export interface DepartmentStats {
  totalMembers: number;
  activeMembers: number;
  subdepartments: number;
  totalBudget?: number;
  averagePerformance?: number;
}

// Activity-specific types
export interface ActivityStats {
  totalActivities: number;
  uniqueUsers: number;
  topActions: Array<{
    action: string;
    count: number;
  }>;
  activityByHour: Array<{
    hour: number;
    count: number;
  }>;
  activityByDay: Array<{
    date: string;
    count: number;
  }>;
  errorRate: number;
  avgResponseTime: number;
}

export interface ActivityTimeline {
  date: string;
  activities: number;
  users: number;
  highlights: string[];
}

export interface ActivityMetadata {
  categories: Array<{
    value: string;
    label: string;
  }>;
  actions: Array<{
    value: string;
    label: string;
    category: string;
  }>;
  riskLevels: Array<{
    value: string;
    label: string;
    color: string;
  }>;
}

export interface ActivityFeedItem {
  id: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  action: string;
  actionCategory: string;
  resourceType?: string;
  resourceName?: string;
  createdAt: string;
  responseStatus?: number;
  ipAddress: string;
}

export interface SuspiciousActivityResult {
  suspicious: boolean;
  reasons: string[];
}

export interface ActivityReport {
  userId: string;
  period: {
    from: string;
    to: string;
  };
  summary: ActivityStats;
  activities: ActivityLog[];
  generatedAt: string;
}

// File upload types
export interface FileUploadResponse {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  mimeType: string;
}

// Export types
export type ExportFormat = 'csv' | 'xlsx' | 'json' | 'pdf';

export interface ExportProgress {
  status: 'preparing' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords?: number;
  processedRecords?: number;
  downloadUrl?: string;
  error?: string;
}

// WebSocket event types
export interface WebSocketEvent {
  event: string;
  data: any;
  timestamp: string;
}

export interface RealtimeUpdate {
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'permission_changed';
  entityId: string;
  data: any;
  userId: string;
  timestamp: string;
}

// Request/Response transformation types
export interface TransformConfig {
  transformRequest?: (data: any) => any;
  transformResponse?: (data: any) => any;
  transformError?: (error: any) => any;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  suggestions: string[];
}