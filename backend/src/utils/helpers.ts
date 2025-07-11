import { Request } from 'express';
import { PAGINATION } from './constants';

export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const getPaginationParams = (req: Request) => {
  const page = Math.max(1, parseInt(req.query.page as string) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    },
  };
};

export const sanitizeUser = (user: any) => {
  const { password, ...sanitizedUser } = user;
  return sanitizedUser;
};

export const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  return ip || 'unknown';
};

export const getUserAgent = (req: Request): string => {
  return req.headers['user-agent'] || 'unknown';
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDateTime = (date: Date): string => {
  return date.toISOString().replace('T', ' ').split('.')[0];
};

export const generateFullName = (data: { 
  firstName: string; 
  lastName: string; 
  middleName?: string | null;
}): string => {
  const parts = [data.firstName, data.middleName, data.lastName].filter(Boolean);
  return parts.join(' ');
};

export const generateInitials = (data: { 
  firstName: string; 
  lastName: string;
}): string => {
  return `${data.firstName.charAt(0)}${data.lastName.charAt(0)}`.toUpperCase();
};

export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (ex) {
    return false;
  }
};

export const isAllowedEmailDomain = async (email: string): Promise<boolean> => {
  // In production, this would check against a list of allowed domains
  const blockedDomains = ['tempmail.com', 'throwaway.email'];
  const domain = email.split('@')[1];
  return !blockedDomains.includes(domain);
};

export const isValidRoleAccessLevel = (role: string, accessLevel: number): boolean => {
  const roleAccessLevels: Record<string, number[]> = {
    ADMIN: [4, 5],
    SALES_MANAGER: [2, 3],
    FINANCE_MANAGER: [2, 3],
    OPERATIONS_MANAGER: [2, 3],
  };
  
  return roleAccessLevels[role]?.includes(accessLevel) || false;
};

export const canAssignRole = (user: any, targetRole: string): boolean => {
  // Only admins can assign admin role
  if (targetRole === 'ADMIN' && user.role !== 'ADMIN') {
    return false;
  }
  
  // Check if user has permission to assign roles
  return user.permissions?.includes('users.manage-role') || false;
};

export const isValidManagerForDepartment = (manager: any, department: any): boolean => {
  // Manager must be in same department or parent department
  // This is a simplified check - in production would check department hierarchy
  return manager.departmentId === department.id || 
         manager.departmentId === department.parentId;
};

export const transformUser = (user: any, options?: { 
  include?: string[]; 
  fields?: string[];
}): any => {
  const transformed = { ...sanitizeUser(user) };
  
  // Remove fields not requested
  if (options?.fields) {
    const allowedFields = new Set(options.fields);
    Object.keys(transformed).forEach(key => {
      if (!allowedFields.has(key)) {
        delete transformed[key];
      }
    });
  }
  
  // Remove includes not requested
  if (options?.include) {
    const allowedIncludes = new Set(options.include);
    ['department', 'manager', 'permissions'].forEach(key => {
      if (!allowedIncludes.has(key) && transformed[key]) {
        delete transformed[key];
      }
    });
  }
  
  return transformed;
};

export const buildFieldSelection = (fields: string[]): any => {
  const selection: any = {};
  fields.forEach(field => {
    selection[field] = true;
  });
  // Always include id
  selection.id = true;
  return selection;
};

export const buildIncludes = (includes: string[], isOwnProfile = false): any => {
  const includeMap: any = {};
  
  includes.forEach(include => {
    switch (include) {
      case 'department':
        includeMap.department = true;
        break;
      case 'manager':
        includeMap.manager = {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        };
        break;
      case 'permissions':
        if (!isOwnProfile) {
          includeMap.permissions = {
            include: {
              permission: true,
            },
          };
        }
        break;
      case 'lastActivity':
        includeMap.activityLogs = {
          take: 1,
          orderBy: { createdAt: 'desc' },
        };
        break;
      case 'sessions':
        if (!isOwnProfile) {
          includeMap.sessions = {
            where: {
              revokedAt: null,
              expiresAt: { gt: new Date() },
            },
          };
        }
        break;
    }
  });
  
  return includeMap;
};

export const pickChangedFields = (original: any, updated: any): any => {
  const changes: any = {};
  
  Object.keys(updated).forEach(key => {
    if (original[key] !== updated[key]) {
      changes[key] = {
        old: original[key],
        new: updated[key],
      };
    }
  });
  
  return changes;
};

export const pickAllowedFields = (data: any, allowedFields: string[]): any => {
  const picked: any = {};
  const allowed = new Set(allowedFields);
  
  Object.keys(data).forEach(key => {
    if (allowed.has(key)) {
      picked[key] = data[key];
    }
  });
  
  return picked;
};

export const getObjectDiff = (obj1: any, obj2: any): any => {
  const diff: any = {};
  
  Object.keys(obj2).forEach(key => {
    if (obj1[key] !== obj2[key]) {
      diff[key] = {
        from: obj1[key],
        to: obj2[key],
      };
    }
  });
  
  return diff;
};

export const removeEmptyValues = (obj: any): any => {
  const cleaned: any = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length === 0) {
        return;
      }
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};

export const generatePaginationLinks = (
  req: Request,
  { page, limit, total }: { page: number; limit: number; total: number }
) => {
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`;
  const totalPages = Math.ceil(total / limit);
  
  const links: any = {
    self: `${baseUrl}?page=${page}&limit=${limit}`,
    first: `${baseUrl}?page=1&limit=${limit}`,
    last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
  };
  
  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }
  
  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }
  
  // Add other query params
  const queryParams = { ...req.query };
  delete queryParams.page;
  delete queryParams.limit;
  
  if (Object.keys(queryParams).length > 0) {
    const queryString = new URLSearchParams(queryParams as any).toString();
    Object.keys(links).forEach(key => {
      links[key] += `&${queryString}`;
    });
  }
  
  return links;
};