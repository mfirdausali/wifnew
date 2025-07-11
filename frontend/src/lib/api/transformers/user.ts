import { camelCase, snakeCase, mapKeys } from 'lodash';
import { User, Department } from '../types';

// Transform API response to frontend format
export function transformUser(apiUser: any): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    firstName: apiUser.first_name || apiUser.firstName,
    lastName: apiUser.last_name || apiUser.lastName,
    fullName: apiUser.full_name || apiUser.fullName || `${apiUser.first_name || apiUser.firstName} ${apiUser.last_name || apiUser.lastName}`,
    position: apiUser.position,
    departmentId: apiUser.department_id || apiUser.departmentId,
    role: apiUser.role,
    accessLevel: apiUser.access_level || apiUser.accessLevel,
    status: apiUser.status,
    avatarUrl: apiUser.avatar_url || apiUser.avatarUrl,
    phoneNumber: apiUser.phone_number || apiUser.phoneNumber || apiUser.phone,
    lastLoginAt: apiUser.last_login_at || apiUser.lastLoginAt,
    createdAt: apiUser.created_at || apiUser.createdAt,
    updatedAt: apiUser.updated_at || apiUser.updatedAt,
    permissions: apiUser.permissions,
  };
}

// Transform frontend data to API format
export function transformUserInput(userData: any): any {
  const transformed = mapKeys(userData, (_, key) => snakeCase(key));
  
  // Handle specific field transformations
  if (userData.phoneNumber) {
    transformed.phone_number = userData.phoneNumber;
  }
  
  // Remove fullName if present (it's computed on backend)
  delete transformed.full_name;
  
  return transformed;
}

// Transform department
export function transformDepartment(apiDept: any): Department {
  return {
    id: apiDept.id,
    name: apiDept.name,
    description: apiDept.description,
    parentId: apiDept.parent_id || apiDept.parentId,
    managerIds: apiDept.manager_ids || apiDept.managerIds || [],
    memberCount: apiDept.member_count || apiDept.memberCount || 0,
    path: apiDept.path || [],
    level: apiDept.level || 0,
    createdAt: apiDept.created_at || apiDept.createdAt,
    updatedAt: apiDept.updated_at || apiDept.updatedAt,
  };
}