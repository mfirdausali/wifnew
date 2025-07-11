import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { Permission, PermissionGroup, UserRole } from '@/types';
import { selectUserById } from './userSelectors';

// Basic selectors
export const selectPermissionsState = (state: RootState) => state.permissions;
export const selectAllPermissions = (state: RootState) => state.permissions.permissions;
export const selectPermissionGroups = (state: RootState) => state.permissions.groups;
export const selectPermissionById = (state: RootState, permissionId: string) => 
  state.permissions.permissions[permissionId];

// User permissions selectors
export const selectUserPermissions = createSelector(
  [selectPermissionsState, (_, userId: string) => userId],
  (state, userId) => {
    const permissionIds = state.userPermissions[userId] || [];
    return permissionIds.map(id => state.permissions[id]).filter(Boolean);
  }
);

export const selectUserPermissionIds = (state: RootState, userId: string) =>
  state.permissions.userPermissions[userId] || [];

// Role permissions selectors
export const selectRolePermissions = createSelector(
  [selectPermissionsState, (_, role: UserRole) => role],
  (state, role) => {
    const permissionIds = state.rolePermissions[role] || [];
    return permissionIds.map(id => state.permissions[id]).filter(Boolean);
  }
);

export const selectRolePermissionIds = (state: RootState, role: UserRole) =>
  state.permissions.rolePermissions[role] || [];

// Effective permissions (combines user and role permissions)
export const selectEffectiveUserPermissions = createSelector(
  [
    (state: RootState, userId: string) => selectUserPermissions(state, userId),
    (state: RootState, userId: string) => {
      const user = selectUserById(state, userId);
      return user ? selectRolePermissions(state, user.role) : [];
    },
  ],
  (userPermissions, rolePermissions) => {
    // Combine user-specific and role-based permissions
    const combined = new Map<string, Permission>();
    
    rolePermissions.forEach(p => combined.set(p.id, p));
    userPermissions.forEach(p => combined.set(p.id, p));
    
    return Array.from(combined.values());
  }
);

// Permission checking selectors
export const selectUserHasPermission = createSelector(
  [
    (state: RootState, { userId, permissionId }: { userId: string; permissionId: string }) =>
      selectEffectiveUserPermissions(state, userId),
    (_, { permissionId }) => permissionId,
  ],
  (permissions, permissionId) => permissions.some(p => p.id === permissionId)
);

export const selectUserHasAnyPermission = createSelector(
  [
    (state: RootState, { userId, permissionIds }: { userId: string; permissionIds: string[] }) =>
      selectEffectiveUserPermissions(state, userId),
    (_, { permissionIds }) => permissionIds,
  ],
  (permissions, permissionIds) => {
    const userPermissionIds = permissions.map(p => p.id);
    return permissionIds.some(id => userPermissionIds.includes(id));
  }
);

export const selectUserHasAllPermissions = createSelector(
  [
    (state: RootState, { userId, permissionIds }: { userId: string; permissionIds: string[] }) =>
      selectEffectiveUserPermissions(state, userId),
    (_, { permissionIds }) => permissionIds,
  ],
  (permissions, permissionIds) => {
    const userPermissionIds = permissions.map(p => p.id);
    return permissionIds.every(id => userPermissionIds.includes(id));
  }
);

// Permission groups selectors
export const selectPermissionsByCategory = createSelector(
  [selectAllPermissions],
  (permissions) => {
    const byCategory: Record<string, Permission[]> = {};
    
    Object.values(permissions).forEach(permission => {
      if (!byCategory[permission.category]) {
        byCategory[permission.category] = [];
      }
      byCategory[permission.category].push(permission);
    });
    
    return byCategory;
  }
);

export const selectPermissionGroupById = (state: RootState, groupId: string) =>
  state.permissions.groups[groupId];

export const selectPermissionsForGroup = createSelector(
  [selectAllPermissions, (state: RootState, groupId: string) => selectPermissionGroupById(state, groupId)],
  (permissions, group) => {
    if (!group) return [];
    return group.permissions.map(id => permissions[id]).filter(Boolean);
  }
);

// Loading and error selectors
export const selectPermissionsLoading = (state: RootState) => state.permissions.loading;
export const selectPermissionsError = (state: RootState) => state.permissions.error;

// Cache selectors
export const selectIsPermissionsCacheValid = createSelector(
  [selectPermissionsState],
  (state) => {
    if (!state.lastFetch) return false;
    return Date.now() - state.lastFetch < state.cacheValidity;
  }
);

// Permission dependency selectors
export const selectPermissionDependencies = createSelector(
  [selectAllPermissions, (_, permissionId: string) => permissionId],
  (permissions, permissionId) => {
    const permission = permissions[permissionId];
    if (!permission) return [];
    
    return permission.dependencies.map(id => permissions[id]).filter(Boolean);
  }
);

export const selectPermissionConflicts = createSelector(
  [selectAllPermissions, (_, permissionId: string) => permissionId],
  (permissions, permissionId) => {
    const permission = permissions[permissionId];
    if (!permission) return [];
    
    return permission.conflicts.map(id => permissions[id]).filter(Boolean);
  }
);

// Check if granting a permission would cause conflicts
export const selectWouldCauseConflict = createSelector(
  [
    (state: RootState, { userId, permissionId }: { userId: string; permissionId: string }) =>
      selectEffectiveUserPermissions(state, userId),
    selectAllPermissions,
    (_, { permissionId }) => permissionId,
  ],
  (userPermissions, allPermissions, permissionId) => {
    const permission = allPermissions[permissionId];
    if (!permission) return false;
    
    const userPermissionIds = userPermissions.map(p => p.id);
    return permission.conflicts.some(conflictId => userPermissionIds.includes(conflictId));
  }
);

// Check if user has required dependencies for a permission
export const selectHasRequiredDependencies = createSelector(
  [
    (state: RootState, { userId, permissionId }: { userId: string; permissionId: string }) =>
      selectEffectiveUserPermissions(state, userId),
    selectAllPermissions,
    (_, { permissionId }) => permissionId,
  ],
  (userPermissions, allPermissions, permissionId) => {
    const permission = allPermissions[permissionId];
    if (!permission) return false;
    
    const userPermissionIds = userPermissions.map(p => p.id);
    return permission.dependencies.every(depId => userPermissionIds.includes(depId));
  }
);