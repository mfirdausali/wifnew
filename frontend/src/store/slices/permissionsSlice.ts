import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Permission, PermissionGroup, UserRole } from '@/types';
import {
  fetchPermissions,
  updateUserPermissions,
} from '../thunks/permissionThunks';

interface PermissionsState {
  // Data
  permissions: Record<string, Permission>;
  permissionIds: string[];
  
  // Permission groups
  groups: Record<string, PermissionGroup>;
  groupIds: string[];
  
  // User permissions mapping
  userPermissions: Record<string, string[]>; // userId -> permissionIds
  
  // Role permissions mapping
  rolePermissions: Record<UserRole, string[]>;
  
  // Loading & errors
  loading: boolean;
  error: string | null;
  
  // Cache
  lastFetch: number | null;
  cacheValidity: number;
}

const initialState: PermissionsState = {
  permissions: {},
  permissionIds: [],
  groups: {},
  groupIds: [],
  userPermissions: {},
  rolePermissions: {
    admin: [],
    sales_manager: [],
    finance_manager: [],
    operations_manager: [],
  },
  loading: false,
  error: null,
  lastFetch: null,
  cacheValidity: 15 * 60 * 1000, // 15 minutes
};

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    // Permission management
    setPermissions: (state, action: PayloadAction<Permission[]>) => {
      state.permissions = {};
      state.permissionIds = [];
      action.payload.forEach(permission => {
        state.permissions[permission.id] = permission;
        state.permissionIds.push(permission.id);
      });
      state.lastFetch = Date.now();
    },
    
    // Permission groups
    setPermissionGroups: (state, action: PayloadAction<PermissionGroup[]>) => {
      state.groups = {};
      state.groupIds = [];
      action.payload.forEach(group => {
        state.groups[group.id] = group;
        state.groupIds.push(group.id);
      });
    },
    
    // User permissions
    setUserPermissions: (state, action: PayloadAction<{ userId: string; permissions: string[] }>) => {
      const { userId, permissions } = action.payload;
      state.userPermissions[userId] = permissions;
    },
    
    addUserPermission: (state, action: PayloadAction<{ userId: string; permissionId: string }>) => {
      const { userId, permissionId } = action.payload;
      if (!state.userPermissions[userId]) {
        state.userPermissions[userId] = [];
      }
      if (!state.userPermissions[userId].includes(permissionId)) {
        state.userPermissions[userId].push(permissionId);
      }
    },
    
    removeUserPermission: (state, action: PayloadAction<{ userId: string; permissionId: string }>) => {
      const { userId, permissionId } = action.payload;
      if (state.userPermissions[userId]) {
        state.userPermissions[userId] = state.userPermissions[userId].filter(
          id => id !== permissionId
        );
      }
    },
    
    // Role permissions
    setRolePermissions: (state, action: PayloadAction<{ role: UserRole; permissions: string[] }>) => {
      const { role, permissions } = action.payload;
      state.rolePermissions[role] = permissions;
    },
    
    // Loading & errors
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Cache
    invalidateCache: (state) => {
      state.lastFetch = null;
    },
  },
  extraReducers: (builder) => {
    // Handle async thunks
    builder
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        // Set permissions
        state.permissions = {};
        state.permissionIds = [];
        action.payload.permissions.forEach((permission: Permission) => {
          state.permissions[permission.id] = permission;
          state.permissionIds.push(permission.id);
        });
        // Set groups
        state.groups = {};
        state.groupIds = [];
        action.payload.groups.forEach((group: PermissionGroup) => {
          state.groups[group.id] = group;
          state.groupIds.push(group.id);
        });
        state.lastFetch = Date.now();
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch permissions';
      })
      
      .addCase(updateUserPermissions.fulfilled, (state, action) => {
        const { userId, permissions } = action.payload;
        state.userPermissions[userId] = permissions;
      });
  },
});

export const {
  setPermissions,
  setPermissionGroups,
  setUserPermissions,
  addUserPermission,
  removeUserPermission,
  setRolePermissions,
  setLoading,
  setError,
  invalidateCache,
} = permissionsSlice.actions;

export default permissionsSlice.reducer;