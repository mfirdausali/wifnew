import { createAsyncThunk } from '@reduxjs/toolkit';
import { Permission, PermissionGroup, UserRole } from '@/types';
import { permissionService, UpdateUserPermissionsData } from '@/lib/api';

// Fetch all permissions and groups
export const fetchPermissions = createAsyncThunk(
  'permissions/fetchPermissions',
  async () => {
    const [permissions, groups] = await Promise.all([
      permissionService.getPermissions(),
      permissionService.getPermissionGroups()
    ]);
    return { permissions, groups };
  }
);

// Fetch user permissions
export const fetchUserPermissions = createAsyncThunk(
  'permissions/fetchUserPermissions',
  async (userId: string) => {
    const permissions = await permissionService.getUserPermissions(userId);
    return { userId, permissions };
  }
);

// Update user permissions
export const updateUserPermissions = createAsyncThunk(
  'permissions/updateUserPermissions',
  async ({ userId, permissions, reason }: { userId: string; permissions: string[]; reason?: string }) => {
    const data: UpdateUserPermissionsData = { permissions, reason };
    const updatedPermissions = await permissionService.updateUserPermissions(userId, data);
    return { userId, permissions: updatedPermissions };
  }
);

// Check user permission
export const checkUserPermission = createAsyncThunk(
  'permissions/checkUserPermission',
  async ({ userId, permission }: { userId: string; permission: string }) => {
    return await permissionService.checkUserPermission(userId, permission);
  }
);

// Fetch role permissions
export const fetchRolePermissions = createAsyncThunk(
  'permissions/fetchRolePermissions',
  async () => {
    return await permissionService.getRolePermissions();
  }
);

// Validate permissions
export const validatePermissions = createAsyncThunk(
  'permissions/validatePermissions',
  async (permissions: string[]) => {
    return await permissionService.validatePermissions(permissions);
  }
);