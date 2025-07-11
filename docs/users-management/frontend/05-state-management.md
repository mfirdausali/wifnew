# Users Management - State Management Detailed Specification

## Overview
This document provides comprehensive specifications for state management in the Users Management feature using Redux Toolkit, including store configuration, slices, selectors, middleware, and data flow patterns.

## Table of Contents
1. [Store Configuration](#store-configuration)
2. [Users Slice](#users-slice)
3. [Permissions Slice](#permissions-slice)
4. [Departments Slice](#departments-slice)
5. [Activity Slice](#activity-slice)
6. [UI Slice](#ui-slice)
7. [Selectors](#selectors)
8. [Middleware](#middleware)
9. [Thunks & Async Actions](#thunks--async-actions)
10. [State Persistence](#state-persistence)

---

## 1. Store Configuration

### 1.1 Root Store Setup
```typescript
// store/index.ts
import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Slices
import usersReducer from './slices/usersSlice';
import permissionsReducer from './slices/permissionsSlice';
import departmentsReducer from './slices/departmentsSlice';
import activityReducer from './slices/activitySlice';
import uiReducer from './slices/uiSlice';

// API Services
import { usersApi } from './api/usersApi';
import { permissionsApi } from './api/permissionsApi';
import { departmentsApi } from './api/departmentsApi';

// Middleware
import { errorMiddleware } from './middleware/errorMiddleware';
import { analyticsMiddleware } from './middleware/analyticsMiddleware';
import { optimisticUpdateMiddleware } from './middleware/optimisticUpdateMiddleware';

// Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['ui'], // Only persist UI preferences
  blacklist: ['users', 'permissions', 'departments', 'activity'], // Don't persist data
};

const rootReducer = {
  users: usersReducer,
  permissions: permissionsReducer,
  departments: departmentsReducer,
  activity: activityReducer,
  ui: uiReducer,
  // RTK Query reducers
  [usersApi.reducerPath]: usersApi.reducer,
  [permissionsApi.reducerPath]: permissionsApi.reducer,
  [departmentsApi.reducerPath]: departmentsApi.reducer,
};

const persistedReducer = persistReducer(persistConfig, combineReducers(rootReducer));

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: ['register', 'rehydrate'],
      },
    })
      .concat(usersApi.middleware)
      .concat(permissionsApi.middleware)
      .concat(departmentsApi.middleware)
      .concat(errorMiddleware)
      .concat(analyticsMiddleware)
      .concat(optimisticUpdateMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Setup listeners for RTK Query
setupListeners(store.dispatch);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// Typed hooks
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### 1.2 Store Provider Setup
```typescript
// providers/StoreProvider.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
};
```

---

## 2. Users Slice

### 2.1 State Interface
```typescript
// slices/usersSlice.ts
interface UsersState {
  // Data
  users: Record<string, User>;
  userIds: string[];
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  
  // Filters
  filters: {
    search: string;
    roles: UserRole[];
    departments: string[];
    statuses: UserStatus[];
    accessLevels: number[];
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
  
  // Sorting
  sorting: {
    field: string;
    order: 'asc' | 'desc';
  };
  
  // Selection
  selectedUserIds: string[];
  
  // Loading states
  loading: {
    list: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    bulkAction: boolean;
  };
  
  // Errors
  errors: {
    list: string | null;
    create: string | null;
    update: string | null;
    delete: string | null;
    bulkAction: string | null;
  };
  
  // Cache
  lastFetch: number | null;
  cacheValidity: number; // milliseconds
  
  // Optimistic updates
  optimisticUpdates: OptimisticUpdate[];
}

interface OptimisticUpdate {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: Partial<User>;
  timestamp: number;
}
```

### 2.2 Initial State
```typescript
const initialState: UsersState = {
  users: {},
  userIds: [],
  pagination: {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: {
    search: '',
    roles: [],
    departments: [],
    statuses: [],
    accessLevels: [],
    dateRange: {
      start: null,
      end: null,
    },
  },
  sorting: {
    field: 'createdAt',
    order: 'desc',
  },
  selectedUserIds: [],
  loading: {
    list: false,
    create: false,
    update: false,
    delete: false,
    bulkAction: false,
  },
  errors: {
    list: null,
    create: null,
    update: null,
    delete: null,
    bulkAction: null,
  },
  lastFetch: null,
  cacheValidity: 5 * 60 * 1000, // 5 minutes
  optimisticUpdates: [],
};
```

### 2.3 Slice Definition
```typescript
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    // User management
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = {};
      state.userIds = [];
      action.payload.forEach(user => {
        state.users[user.id] = user;
        state.userIds.push(user.id);
      });
      state.lastFetch = Date.now();
    },
    
    addUser: (state, action: PayloadAction<User>) => {
      const user = action.payload;
      state.users[user.id] = user;
      if (!state.userIds.includes(user.id)) {
        state.userIds.unshift(user.id);
        state.pagination.total += 1;
      }
    },
    
    updateUser: (state, action: PayloadAction<{ id: string; changes: Partial<User> }>) => {
      const { id, changes } = action.payload;
      if (state.users[id]) {
        state.users[id] = { ...state.users[id], ...changes };
      }
    },
    
    removeUser: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.users[id];
      state.userIds = state.userIds.filter(userId => userId !== id);
      state.selectedUserIds = state.selectedUserIds.filter(userId => userId !== id);
      state.pagination.total -= 1;
    },
    
    // Bulk operations
    updateMultipleUsers: (state, action: PayloadAction<{ ids: string[]; changes: Partial<User> }>) => {
      const { ids, changes } = action.payload;
      ids.forEach(id => {
        if (state.users[id]) {
          state.users[id] = { ...state.users[id], ...changes };
        }
      });
    },
    
    removeMultipleUsers: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach(id => {
        delete state.users[id];
      });
      state.userIds = state.userIds.filter(id => !action.payload.includes(id));
      state.selectedUserIds = state.selectedUserIds.filter(id => !action.payload.includes(id));
      state.pagination.total -= action.payload.length;
    },
    
    // Pagination
    setPagination: (state, action: PayloadAction<Partial<UsersState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page
    },
    
    // Filters
    setFilters: (state, action: PayloadAction<Partial<UsersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    
    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload;
      state.pagination.page = 1;
    },
    
    // Sorting
    setSorting: (state, action: PayloadAction<{ field: string; order: 'asc' | 'desc' }>) => {
      state.sorting = action.payload;
      state.pagination.page = 1;
    },
    
    toggleSortOrder: (state) => {
      state.sorting.order = state.sorting.order === 'asc' ? 'desc' : 'asc';
    },
    
    // Selection
    setSelectedUsers: (state, action: PayloadAction<string[]>) => {
      state.selectedUserIds = action.payload;
    },
    
    toggleUserSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedUserIds.includes(id)) {
        state.selectedUserIds = state.selectedUserIds.filter(userId => userId !== id);
      } else {
        state.selectedUserIds.push(id);
      }
    },
    
    selectAllUsers: (state) => {
      state.selectedUserIds = state.userIds;
    },
    
    clearSelection: (state) => {
      state.selectedUserIds = [];
    },
    
    // Loading states
    setLoading: (state, action: PayloadAction<{ type: keyof UsersState['loading']; value: boolean }>) => {
      state.loading[action.payload.type] = action.payload.value;
    },
    
    // Errors
    setError: (state, action: PayloadAction<{ type: keyof UsersState['errors']; error: string | null }>) => {
      state.errors[action.payload.type] = action.payload.error;
    },
    
    clearErrors: (state) => {
      state.errors = initialState.errors;
    },
    
    // Cache
    invalidateCache: (state) => {
      state.lastFetch = null;
    },
    
    // Optimistic updates
    addOptimisticUpdate: (state, action: PayloadAction<Omit<OptimisticUpdate, 'timestamp'>>) => {
      state.optimisticUpdates.push({
        ...action.payload,
        timestamp: Date.now(),
      });
    },
    
    removeOptimisticUpdate: (state, action: PayloadAction<string>) => {
      state.optimisticUpdates = state.optimisticUpdates.filter(
        update => update.id !== action.payload
      );
    },
    
    clearOptimisticUpdates: (state) => {
      state.optimisticUpdates = [];
    },
  },
  extraReducers: (builder) => {
    // Handle async thunks
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading.list = true;
        state.errors.list = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading.list = false;
        state.users = {};
        state.userIds = [];
        action.payload.data.forEach(user => {
          state.users[user.id] = user;
          state.userIds.push(user.id);
        });
        state.pagination = action.payload.meta.pagination;
        state.lastFetch = Date.now();
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading.list = false;
        state.errors.list = action.error.message || 'Failed to fetch users';
      })
      
      // Create user
      .addCase(createUser.pending, (state) => {
        state.loading.create = true;
        state.errors.create = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading.create = false;
        const user = action.payload;
        state.users[user.id] = user;
        state.userIds.unshift(user.id);
        state.pagination.total += 1;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading.create = false;
        state.errors.create = action.error.message || 'Failed to create user';
      })
      
      // Update user
      .addCase(updateUser.pending, (state) => {
        state.loading.update = true;
        state.errors.update = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading.update = false;
        const user = action.payload;
        state.users[user.id] = user;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading.update = false;
        state.errors.update = action.error.message || 'Failed to update user';
      })
      
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.loading.delete = true;
        state.errors.delete = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading.delete = false;
        const id = action.payload;
        delete state.users[id];
        state.userIds = state.userIds.filter(userId => userId !== id);
        state.selectedUserIds = state.selectedUserIds.filter(userId => userId !== id);
        state.pagination.total -= 1;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading.delete = false;
        state.errors.delete = action.error.message || 'Failed to delete user';
      })
      
      // Bulk actions
      .addCase(bulkUpdateUsers.pending, (state) => {
        state.loading.bulkAction = true;
        state.errors.bulkAction = null;
      })
      .addCase(bulkUpdateUsers.fulfilled, (state, action) => {
        state.loading.bulkAction = false;
        action.payload.forEach(user => {
          state.users[user.id] = user;
        });
      })
      .addCase(bulkUpdateUsers.rejected, (state, action) => {
        state.loading.bulkAction = false;
        state.errors.bulkAction = action.error.message || 'Bulk update failed';
      });
  },
});

// Export actions
export const {
  setUsers,
  addUser,
  updateUser,
  removeUser,
  updateMultipleUsers,
  removeMultipleUsers,
  setPagination,
  setPage,
  setLimit,
  setFilters,
  clearFilters,
  setSearch,
  setSorting,
  toggleSortOrder,
  setSelectedUsers,
  toggleUserSelection,
  selectAllUsers,
  clearSelection,
  setLoading,
  setError,
  clearErrors,
  invalidateCache,
  addOptimisticUpdate,
  removeOptimisticUpdate,
  clearOptimisticUpdates,
} = usersSlice.actions;

// Export reducer
export default usersSlice.reducer;
```

---

## 3. Permissions Slice

### 3.1 State Interface
```typescript
// slices/permissionsSlice.ts
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

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  dependencies: string[];
  conflicts: string[];
  requiredRole?: UserRole;
  requiredAccessLevel?: number;
}

interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  icon?: string;
}
```

### 3.2 Slice Definition
```typescript
const permissionsSlice = createSlice({
  name: 'permissions',
  initialState: {
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
  } as PermissionsState,
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
        action.payload.permissions.forEach(permission => {
          state.permissions[permission.id] = permission;
          state.permissionIds.push(permission.id);
        });
        // Set groups
        state.groups = {};
        state.groupIds = [];
        action.payload.groups.forEach(group => {
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
```

---

## 4. Departments Slice

### 4.1 State Interface
```typescript
// slices/departmentsSlice.ts
interface DepartmentsState {
  // Data
  departments: Record<string, Department>;
  departmentIds: string[];
  
  // Hierarchy
  rootDepartmentIds: string[];
  departmentTree: DepartmentNode[];
  
  // Loading & errors
  loading: boolean;
  error: string | null;
  
  // Cache
  lastFetch: number | null;
  cacheValidity: number;
}

interface Department {
  id: string;
  name: string;
  description?: string;
  parentId: string | null;
  managerIds: string[];
  memberCount: number;
  path: string[]; // Materialized path for efficient queries
  level: number;
  createdAt: string;
  updatedAt: string;
}

interface DepartmentNode {
  id: string;
  department: Department;
  children: DepartmentNode[];
}
```

### 4.2 Slice Definition
```typescript
const departmentsSlice = createSlice({
  name: 'departments',
  initialState: {
    departments: {},
    departmentIds: [],
    rootDepartmentIds: [],
    departmentTree: [],
    loading: false,
    error: null,
    lastFetch: null,
    cacheValidity: 30 * 60 * 1000, // 30 minutes
  } as DepartmentsState,
  reducers: {
    // Department management
    setDepartments: (state, action: PayloadAction<Department[]>) => {
      state.departments = {};
      state.departmentIds = [];
      state.rootDepartmentIds = [];
      
      action.payload.forEach(dept => {
        state.departments[dept.id] = dept;
        state.departmentIds.push(dept.id);
        if (!dept.parentId) {
          state.rootDepartmentIds.push(dept.id);
        }
      });
      
      // Build tree structure
      state.departmentTree = buildDepartmentTree(
        action.payload,
        state.rootDepartmentIds
      );
      
      state.lastFetch = Date.now();
    },
    
    addDepartment: (state, action: PayloadAction<Department>) => {
      const dept = action.payload;
      state.departments[dept.id] = dept;
      state.departmentIds.push(dept.id);
      
      if (!dept.parentId) {
        state.rootDepartmentIds.push(dept.id);
      }
      
      // Rebuild tree
      state.departmentTree = buildDepartmentTree(
        Object.values(state.departments),
        state.rootDepartmentIds
      );
    },
    
    updateDepartment: (state, action: PayloadAction<{ id: string; changes: Partial<Department> }>) => {
      const { id, changes } = action.payload;
      if (state.departments[id]) {
        state.departments[id] = { ...state.departments[id], ...changes };
        
        // Rebuild tree if parent changed
        if ('parentId' in changes) {
          state.departmentTree = buildDepartmentTree(
            Object.values(state.departments),
            state.rootDepartmentIds
          );
        }
      }
    },
    
    removeDepartment: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.departments[id];
      state.departmentIds = state.departmentIds.filter(deptId => deptId !== id);
      state.rootDepartmentIds = state.rootDepartmentIds.filter(deptId => deptId !== id);
      
      // Update children to have no parent
      Object.values(state.departments).forEach(dept => {
        if (dept.parentId === id) {
          dept.parentId = null;
          state.rootDepartmentIds.push(dept.id);
        }
      });
      
      // Rebuild tree
      state.departmentTree = buildDepartmentTree(
        Object.values(state.departments),
        state.rootDepartmentIds
      );
    },
    
    // Member count updates
    incrementMemberCount: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.departments[id]) {
        state.departments[id].memberCount += 1;
      }
    },
    
    decrementMemberCount: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.departments[id]) {
        state.departments[id].memberCount = Math.max(0, state.departments[id].memberCount - 1);
      }
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
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = {};
        state.departmentIds = [];
        state.rootDepartmentIds = [];
        
        action.payload.forEach(dept => {
          state.departments[dept.id] = dept;
          state.departmentIds.push(dept.id);
          if (!dept.parentId) {
            state.rootDepartmentIds.push(dept.id);
          }
        });
        
        state.departmentTree = buildDepartmentTree(
          action.payload,
          state.rootDepartmentIds
        );
        
        state.lastFetch = Date.now();
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch departments';
      });
  },
});

// Helper function to build tree
function buildDepartmentTree(
  departments: Department[],
  rootIds: string[]
): DepartmentNode[] {
  const departmentMap = new Map(departments.map(d => [d.id, d]));
  
  function buildNode(id: string): DepartmentNode {
    const dept = departmentMap.get(id)!;
    const children = departments
      .filter(d => d.parentId === id)
      .map(d => buildNode(d.id));
    
    return {
      id,
      department: dept,
      children,
    };
  }
  
  return rootIds.map(buildNode);
}

export const {
  setDepartments,
  addDepartment,
  updateDepartment,
  removeDepartment,
  incrementMemberCount,
  decrementMemberCount,
  setLoading,
  setError,
  invalidateCache,
} = departmentsSlice.actions;

export default departmentsSlice.reducer;
```

---

## 5. Activity Slice

### 5.1 State Interface
```typescript
// slices/activitySlice.ts
interface ActivityState {
  // Activity logs
  activities: Record<string, ActivityLog>;
  activityIds: string[];
  
  // Filters
  filters: {
    userId?: string;
    action?: ActivityAction[];
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  
  // Real-time updates
  liveUpdates: boolean;
  pendingActivities: ActivityLog[];
  
  // Loading & errors
  loading: boolean;
  error: string | null;
}

interface ActivityLog {
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

type ActivityAction = 
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
```

### 5.2 Slice Definition
```typescript
const activitySlice = createSlice({
  name: 'activity',
  initialState: {
    activities: {},
    activityIds: [],
    filters: {
      dateRange: {
        start: null,
        end: null,
      },
    },
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      hasMore: false,
    },
    liveUpdates: false,
    pendingActivities: [],
    loading: false,
    error: null,
  } as ActivityState,
  reducers: {
    // Activity management
    setActivities: (state, action: PayloadAction<ActivityLog[]>) => {
      state.activities = {};
      state.activityIds = [];
      action.payload.forEach(activity => {
        state.activities[activity.id] = activity;
        state.activityIds.push(activity.id);
      });
    },
    
    addActivity: (state, action: PayloadAction<ActivityLog>) => {
      const activity = action.payload;
      state.activities[activity.id] = activity;
      state.activityIds.unshift(activity.id);
      state.pagination.total += 1;
    },
    
    addActivities: (state, action: PayloadAction<ActivityLog[]>) => {
      action.payload.forEach(activity => {
        state.activities[activity.id] = activity;
        state.activityIds.push(activity.id);
      });
    },
    
    // Real-time updates
    toggleLiveUpdates: (state, action: PayloadAction<boolean>) => {
      state.liveUpdates = action.payload;
    },
    
    addPendingActivity: (state, action: PayloadAction<ActivityLog>) => {
      state.pendingActivities.push(action.payload);
    },
    
    applyPendingActivities: (state) => {
      state.pendingActivities.forEach(activity => {
        state.activities[activity.id] = activity;
        state.activityIds.unshift(activity.id);
      });
      state.pagination.total += state.pendingActivities.length;
      state.pendingActivities = [];
    },
    
    clearPendingActivities: (state) => {
      state.pendingActivities = [];
    },
    
    // Filters
    setFilters: (state, action: PayloadAction<Partial<ActivityState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    
    clearFilters: (state) => {
      state.filters = {
        dateRange: {
          start: null,
          end: null,
        },
      };
      state.pagination.page = 1;
    },
    
    // Pagination
    setPagination: (state, action: PayloadAction<Partial<ActivityState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    nextPage: (state) => {
      if (state.pagination.hasMore) {
        state.pagination.page += 1;
      }
    },
    
    // Loading & errors
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload.page === 1) {
          // Replace all activities if first page
          state.activities = {};
          state.activityIds = [];
        }
        
        action.payload.data.forEach(activity => {
          state.activities[activity.id] = activity;
          state.activityIds.push(activity.id);
        });
        
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasMore: action.payload.hasMore,
        };
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch activities';
      });
  },
});

export const {
  setActivities,
  addActivity,
  addActivities,
  toggleLiveUpdates,
  addPendingActivity,
  applyPendingActivities,
  clearPendingActivities,
  setFilters,
  clearFilters,
  setPagination,
  nextPage,
  setLoading,
  setError,
} = activitySlice.actions;

export default activitySlice.reducer;
```

---

## 6. UI Slice

### 6.1 State Interface
```typescript
// slices/uiSlice.ts
interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Layout
  sidebarCollapsed: boolean;
  tableCompact: boolean;
  
  // Modals
  modals: {
    createUser: boolean;
    editUser: { isOpen: boolean; userId: string | null };
    deleteUser: { isOpen: boolean; userId: string | null };
    bulkAction: { isOpen: boolean; action: string | null };
    importUsers: boolean;
    exportUsers: boolean;
  };
  
  // Table preferences
  tablePreferences: {
    visibleColumns: string[];
    columnWidths: Record<string, number>;
    defaultPageSize: number;
  };
  
  // Notifications
  notifications: Notification[];
  notificationPreferences: {
    showToasts: boolean;
    playSound: boolean;
    desktopNotifications: boolean;
  };
  
  // Tour
  tourCompleted: boolean;
  tourStep: number;
  
  // Feature flags
  features: {
    advancedFilters: boolean;
    bulkOperations: boolean;
    realTimeUpdates: boolean;
    darkMode: boolean;
  };
}

interface Notification {
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
```

### 6.2 Slice Definition
```typescript
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'system',
    sidebarCollapsed: false,
    tableCompact: false,
    modals: {
      createUser: false,
      editUser: { isOpen: false, userId: null },
      deleteUser: { isOpen: false, userId: null },
      bulkAction: { isOpen: false, action: null },
      importUsers: false,
      exportUsers: false,
    },
    tablePreferences: {
      visibleColumns: [
        'name',
        'email',
        'role',
        'department',
        'status',
        'lastLogin',
        'actions',
      ],
      columnWidths: {},
      defaultPageSize: 25,
    },
    notifications: [],
    notificationPreferences: {
      showToasts: true,
      playSound: true,
      desktopNotifications: false,
    },
    tourCompleted: false,
    tourStep: 0,
    features: {
      advancedFilters: true,
      bulkOperations: true,
      realTimeUpdates: true,
      darkMode: true,
    },
  } as UIState,
  reducers: {
    // Theme
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload;
    },
    
    // Layout
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    toggleTableCompact: (state) => {
      state.tableCompact = !state.tableCompact;
    },
    
    // Modals
    openModal: (state, action: PayloadAction<{ modal: keyof UIState['modals']; data?: any }>) => {
      const { modal, data } = action.payload;
      
      switch (modal) {
        case 'createUser':
        case 'importUsers':
        case 'exportUsers':
          state.modals[modal] = true;
          break;
        case 'editUser':
        case 'deleteUser':
          state.modals[modal] = { isOpen: true, userId: data?.userId || null };
          break;
        case 'bulkAction':
          state.modals[modal] = { isOpen: true, action: data?.action || null };
          break;
      }
    },
    
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      const modal = action.payload;
      
      switch (modal) {
        case 'createUser':
        case 'importUsers':
        case 'exportUsers':
          state.modals[modal] = false;
          break;
        case 'editUser':
        case 'deleteUser':
          state.modals[modal] = { isOpen: false, userId: null };
          break;
        case 'bulkAction':
          state.modals[modal] = { isOpen: false, action: null };
          break;
      }
    },
    
    closeAllModals: (state) => {
      state.modals = {
        createUser: false,
        editUser: { isOpen: false, userId: null },
        deleteUser: { isOpen: false, userId: null },
        bulkAction: { isOpen: false, action: null },
        importUsers: false,
        exportUsers: false,
      };
    },
    
    // Table preferences
    setVisibleColumns: (state, action: PayloadAction<string[]>) => {
      state.tablePreferences.visibleColumns = action.payload;
    },
    
    toggleColumnVisibility: (state, action: PayloadAction<string>) => {
      const column = action.payload;
      const { visibleColumns } = state.tablePreferences;
      
      if (visibleColumns.includes(column)) {
        state.tablePreferences.visibleColumns = visibleColumns.filter(c => c !== column);
      } else {
        state.tablePreferences.visibleColumns.push(column);
      }
    },
    
    setColumnWidth: (state, action: PayloadAction<{ column: string; width: number }>) => {
      const { column, width } = action.payload;
      state.tablePreferences.columnWidths[column] = width;
    },
    
    setDefaultPageSize: (state, action: PayloadAction<number>) => {
      state.tablePreferences.defaultPageSize = action.payload;
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: generateId(),
        timestamp: Date.now(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => {
        n.read = true;
      });
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    setNotificationPreferences: (state, action: PayloadAction<Partial<UIState['notificationPreferences']>>) => {
      state.notificationPreferences = {
        ...state.notificationPreferences,
        ...action.payload,
      };
    },
    
    // Tour
    setTourCompleted: (state, action: PayloadAction<boolean>) => {
      state.tourCompleted = action.payload;
    },
    
    setTourStep: (state, action: PayloadAction<number>) => {
      state.tourStep = action.payload;
    },
    
    nextTourStep: (state) => {
      state.tourStep += 1;
    },
    
    // Feature flags
    setFeatureFlag: (state, action: PayloadAction<{ feature: keyof UIState['features']; enabled: boolean }>) => {
      const { feature, enabled } = action.payload;
      state.features[feature] = enabled;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  toggleTableCompact,
  openModal,
  closeModal,
  closeAllModals,
  setVisibleColumns,
  toggleColumnVisibility,
  setColumnWidth,
  setDefaultPageSize,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
  setNotificationPreferences,
  setTourCompleted,
  setTourStep,
  nextTourStep,
  setFeatureFlag,
} = uiSlice.actions;

export default uiSlice.reducer;
```

---

## 7. Selectors

### 7.1 User Selectors
```typescript
// selectors/userSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';

// Basic selectors
export const selectUsersState = (state: RootState) => state.users;
export const selectAllUsers = (state: RootState) => state.users.users;
export const selectUserIds = (state: RootState) => state.users.userIds;
export const selectUserById = (state: RootState, userId: string) => state.users.users[userId];

// Memoized selectors
export const selectUsersArray = createSelector(
  [selectAllUsers, selectUserIds],
  (users, userIds) => userIds.map(id => users[id])
);

export const selectFilteredUsers = createSelector(
  [selectUsersArray, selectUsersState],
  (users, { filters }) => {
    return users.filter(user => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !user.fullName.toLowerCase().includes(searchLower) &&
          !user.email.toLowerCase().includes(searchLower) &&
          !user.position?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }
      
      // Role filter
      if (filters.roles.length > 0 && !filters.roles.includes(user.role)) {
        return false;
      }
      
      // Department filter
      if (filters.departments.length > 0 && !filters.departments.includes(user.departmentId)) {
        return false;
      }
      
      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(user.status)) {
        return false;
      }
      
      // Access level filter
      if (filters.accessLevels.length > 0 && !filters.accessLevels.includes(user.accessLevel)) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        const userDate = new Date(user.createdAt);
        if (filters.dateRange.start && userDate < new Date(filters.dateRange.start)) {
          return false;
        }
        if (filters.dateRange.end && userDate > new Date(filters.dateRange.end)) {
          return false;
        }
      }
      
      return true;
    });
  }
);

export const selectSortedUsers = createSelector(
  [selectFilteredUsers, selectUsersState],
  (users, { sorting }) => {
    const sorted = [...users].sort((a, b) => {
      const aValue = a[sorting.field];
      const bValue = b[sorting.field];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sorting.order === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }
);

export const selectPaginatedUsers = createSelector(
  [selectSortedUsers, selectUsersState],
  (users, { pagination }) => {
    const start = (pagination.page - 1) * pagination.limit;
    const end = start + pagination.limit;
    return users.slice(start, end);
  }
);

export const selectSelectedUsers = createSelector(
  [selectAllUsers, (state: RootState) => state.users.selectedUserIds],
  (users, selectedIds) => selectedIds.map(id => users[id]).filter(Boolean)
);

export const selectUsersLoading = createSelector(
  [selectUsersState],
  (state) => Object.values(state.loading).some(loading => loading)
);

export const selectUsersErrors = createSelector(
  [selectUsersState],
  (state) => Object.entries(state.errors)
    .filter(([_, error]) => error !== null)
    .map(([type, error]) => ({ type, error }))
);

export const selectUsersByRole = createSelector(
  [selectUsersArray],
  (users) => {
    const byRole: Record<UserRole, User[]> = {
      admin: [],
      sales_manager: [],
      finance_manager: [],
      operations_manager: [],
    };
    
    users.forEach(user => {
      byRole[user.role].push(user);
    });
    
    return byRole;
  }
);

export const selectUsersByDepartment = createSelector(
  [selectUsersArray],
  (users) => {
    const byDepartment: Record<string, User[]> = {};
    
    users.forEach(user => {
      if (user.departmentId) {
        if (!byDepartment[user.departmentId]) {
          byDepartment[user.departmentId] = [];
        }
        byDepartment[user.departmentId].push(user);
      }
    });
    
    return byDepartment;
  }
);

export const selectActiveUsers = createSelector(
  [selectUsersArray],
  (users) => users.filter(user => user.status === 'active')
);

export const selectUsersStats = createSelector(
  [selectUsersArray],
  (users) => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    neverLoggedIn: users.filter(u => !u.lastLoginAt).length,
    loggedInToday: users.filter(u => {
      if (!u.lastLoginAt) return false;
      const today = new Date();
      const lastLogin = new Date(u.lastLoginAt);
      return (
        lastLogin.getDate() === today.getDate() &&
        lastLogin.getMonth() === today.getMonth() &&
        lastLogin.getFullYear() === today.getFullYear()
      );
    }).length,
  })
);
```

### 7.2 Permission Selectors
```typescript
// selectors/permissionSelectors.ts
export const selectPermissionsState = (state: RootState) => state.permissions;
export const selectAllPermissions = (state: RootState) => state.permissions.permissions;
export const selectPermissionGroups = (state: RootState) => state.permissions.groups;

export const selectUserPermissions = createSelector(
  [selectPermissionsState, (_, userId: string) => userId],
  (state, userId) => {
    const permissionIds = state.userPermissions[userId] || [];
    return permissionIds.map(id => state.permissions[id]).filter(Boolean);
  }
);

export const selectRolePermissions = createSelector(
  [selectPermissionsState, (_, role: UserRole) => role],
  (state, role) => {
    const permissionIds = state.rolePermissions[role] || [];
    return permissionIds.map(id => state.permissions[id]).filter(Boolean);
  }
);

export const selectEffectiveUserPermissions = createSelector(
  [
    selectUserPermissions,
    selectRolePermissions,
    (state: RootState, userId: string) => selectUserById(state, userId),
  ],
  (userPermissions, rolePermissions, user) => {
    if (!user) return [];
    
    // Combine user-specific and role-based permissions
    const combined = new Map<string, Permission>();
    
    rolePermissions.forEach(p => combined.set(p.id, p));
    userPermissions.forEach(p => combined.set(p.id, p));
    
    return Array.from(combined.values());
  }
);

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
```

### 7.3 Department Selectors
```typescript
// selectors/departmentSelectors.ts
export const selectDepartmentsState = (state: RootState) => state.departments;
export const selectAllDepartments = (state: RootState) => state.departments.departments;
export const selectDepartmentTree = (state: RootState) => state.departments.departmentTree;

export const selectDepartmentById = createSelector(
  [selectAllDepartments, (_, departmentId: string) => departmentId],
  (departments, departmentId) => departments[departmentId]
);

export const selectDepartmentPath = createSelector(
  [selectAllDepartments, (_, departmentId: string) => departmentId],
  (departments, departmentId) => {
    const path: Department[] = [];
    let current = departments[departmentId];
    
    while (current) {
      path.unshift(current);
      current = current.parentId ? departments[current.parentId] : null;
    }
    
    return path;
  }
);

export const selectDepartmentChildren = createSelector(
  [selectAllDepartments, (_, departmentId: string) => departmentId],
  (departments, departmentId) => {
    return Object.values(departments).filter(d => d.parentId === departmentId);
  }
);

export const selectDepartmentDescendants = createSelector(
  [selectAllDepartments, (_, departmentId: string) => departmentId],
  (departments, departmentId) => {
    const descendants: Department[] = [];
    
    function collectDescendants(id: string) {
      const children = Object.values(departments).filter(d => d.parentId === id);
      children.forEach(child => {
        descendants.push(child);
        collectDescendants(child.id);
      });
    }
    
    collectDescendants(departmentId);
    return descendants;
  }
);
```

### 7.4 UI Selectors
```typescript
// selectors/uiSelectors.ts
export const selectUIState = (state: RootState) => state.ui;
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectModals = (state: RootState) => state.ui.modals;
export const selectNotifications = (state: RootState) => state.ui.notifications;

export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(n => !n.read)
);

export const selectActiveModal = createSelector(
  [selectModals],
  (modals) => {
    for (const [modal, state] of Object.entries(modals)) {
      if (typeof state === 'boolean' && state) {
        return modal;
      } else if (typeof state === 'object' && state.isOpen) {
        return modal;
      }
    }
    return null;
  }
);

export const selectIsAnyModalOpen = createSelector(
  [selectModals],
  (modals) => {
    return Object.values(modals).some(modal => 
      typeof modal === 'boolean' ? modal : modal.isOpen
    );
  }
);

export const selectFeatureFlags = (state: RootState) => state.ui.features;

export const selectIsFeatureEnabled = createSelector(
  [selectFeatureFlags, (_, feature: keyof UIState['features']) => feature],
  (features, feature) => features[feature]
);
```

---

## 8. Middleware

### 8.1 Error Middleware
```typescript
// middleware/errorMiddleware.ts
import { isRejectedWithValue, Middleware } from '@reduxjs/toolkit';
import { addNotification } from '@/store/slices/uiSlice';

export const errorMiddleware: Middleware = (store) => (next) => (action) => {
  // Handle rejected actions
  if (isRejectedWithValue(action)) {
    const error = action.payload as any;
    
    store.dispatch(
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'An unexpected error occurred',
      })
    );
  }
  
  return next(action);
};
```

### 8.2 Analytics Middleware
```typescript
// middleware/analyticsMiddleware.ts
import { Middleware } from '@reduxjs/toolkit';
import { analytics } from '@/lib/analytics';

const trackedActions = [
  'users/createUser/fulfilled',
  'users/updateUser/fulfilled',
  'users/deleteUser/fulfilled',
  'users/bulkUpdateUsers/fulfilled',
];

export const analyticsMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  
  if (trackedActions.includes(action.type)) {
    analytics.track('user_management_action', {
      action: action.type,
      payload: action.payload,
      timestamp: Date.now(),
    });
  }
  
  return result;
};
```

### 8.3 Optimistic Update Middleware
```typescript
// middleware/optimisticUpdateMiddleware.ts
import { Middleware } from '@reduxjs/toolkit';
import { 
  addOptimisticUpdate, 
  removeOptimisticUpdate,
  updateUser,
  removeUser,
} from '@/store/slices/usersSlice';

export const optimisticUpdateMiddleware: Middleware = (store) => (next) => (action) => {
  // Handle optimistic updates
  if (action.type.endsWith('/pending')) {
    const [slice, thunk] = action.type.split('/');
    
    if (slice === 'users' && action.meta?.arg) {
      const optimisticId = `optimistic_${Date.now()}`;
      
      switch (thunk) {
        case 'updateUser':
          store.dispatch(updateUser({
            id: action.meta.arg.id,
            changes: action.meta.arg.changes,
          }));
          store.dispatch(addOptimisticUpdate({
            id: optimisticId,
            type: 'update',
            data: action.meta.arg,
          }));
          break;
          
        case 'deleteUser':
          store.dispatch(removeUser(action.meta.arg));
          store.dispatch(addOptimisticUpdate({
            id: optimisticId,
            type: 'delete',
            data: { id: action.meta.arg },
          }));
          break;
      }
      
      // Store optimistic ID in action meta for cleanup
      action.meta.optimisticId = optimisticId;
    }
  }
  
  // Cleanup optimistic updates on success/failure
  if (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')) {
    if (action.meta?.optimisticId) {
      store.dispatch(removeOptimisticUpdate(action.meta.optimisticId));
    }
  }
  
  return next(action);
};
```

---

## 9. Thunks & Async Actions

### 9.1 User Thunks
```typescript
// thunks/userThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '@/services/api';
import { RootState } from '@/store';

// Fetch users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { pagination, filters, sorting } = state.users;
    
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sorting.field,
      sortOrder: sorting.order,
      ...filters,
    };
    
    const response = await api.get('/users', { params });
    return response.data;
  }
);

// Create user
export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData: CreateUserDTO) => {
    const response = await api.post('/users', userData);
    return response.data;
  }
);

// Update user
export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ id, changes }: { id: string; changes: Partial<User> }) => {
    const response = await api.put(`/users/${id}`, changes);
    return response.data;
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (id: string) => {
    await api.delete(`/users/${id}`);
    return id;
  }
);

// Bulk update users
export const bulkUpdateUsers = createAsyncThunk(
  'users/bulkUpdateUsers',
  async ({ userIds, changes }: { userIds: string[]; changes: Partial<User> }) => {
    const response = await api.post('/users/bulk-update', {
      userIds,
      changes,
    });
    return response.data;
  }
);

// Export users
export const exportUsers = createAsyncThunk(
  'users/exportUsers',
  async (options: ExportOptions) => {
    const response = await api.post('/users/export', options, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users_export_${Date.now()}.${options.format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return true;
  }
);

// Import users
export const importUsers = createAsyncThunk(
  'users/importUsers',
  async ({ file, options }: { file: File; options: ImportOptions }) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });
    
    const response = await api.post('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data;
  }
);
```

### 9.2 Permission Thunks
```typescript
// thunks/permissionThunks.ts
export const fetchPermissions = createAsyncThunk(
  'permissions/fetchPermissions',
  async () => {
    const response = await api.get('/permissions');
    return response.data;
  }
);

export const fetchUserPermissions = createAsyncThunk(
  'permissions/fetchUserPermissions',
  async (userId: string) => {
    const response = await api.get(`/users/${userId}/permissions`);
    return { userId, permissions: response.data };
  }
);

export const updateUserPermissions = createAsyncThunk(
  'permissions/updateUserPermissions',
  async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
    const response = await api.put(`/users/${userId}/permissions`, {
      permissions,
    });
    return { userId, permissions: response.data };
  }
);
```

### 9.3 Department Thunks
```typescript
// thunks/departmentThunks.ts
export const fetchDepartments = createAsyncThunk(
  'departments/fetchDepartments',
  async () => {
    const response = await api.get('/departments');
    return response.data;
  }
);

export const createDepartment = createAsyncThunk(
  'departments/createDepartment',
  async (departmentData: CreateDepartmentDTO) => {
    const response = await api.post('/departments', departmentData);
    return response.data;
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/updateDepartment',
  async ({ id, changes }: { id: string; changes: Partial<Department> }) => {
    const response = await api.put(`/departments/${id}`, changes);
    return response.data;
  }
);
```

### 9.4 Activity Thunks
```typescript
// thunks/activityThunks.ts
export const fetchActivities = createAsyncThunk(
  'activity/fetchActivities',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { pagination, filters } = state.activity;
    
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...filters,
    };
    
    const response = await api.get('/activities', { params });
    return response.data;
  }
);

export const fetchUserActivities = createAsyncThunk(
  'activity/fetchUserActivities',
  async (userId: string) => {
    const response = await api.get(`/users/${userId}/activities`);
    return response.data;
  }
);
```

---

## 10. State Persistence

### 10.1 Persistence Configuration
```typescript
// store/persistence.ts
import { createMigrate } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Migration functions
const migrations = {
  0: (state: any) => {
    // Migration from version 0 to 1
    return {
      ...state,
      ui: {
        ...state.ui,
        features: {
          advancedFilters: true,
          bulkOperations: true,
          realTimeUpdates: true,
          darkMode: true,
        },
      },
    };
  },
};

export const persistConfig = {
  key: 'users-management',
  version: 1,
  storage,
  whitelist: ['ui'], // Only persist UI state
  blacklist: ['users', 'permissions', 'departments', 'activity'],
  migrate: createMigrate(migrations, { debug: true }),
  stateReconciler: autoMergeLevel2,
};

// Persistence utilities
export const purgePersistedState = async () => {
  await storage.removeItem(`persist:${persistConfig.key}`);
};

export const getPersistedState = async () => {
  const persistedState = await storage.getItem(`persist:${persistConfig.key}`);
  return persistedState ? JSON.parse(persistedState) : null;
};
```

### 10.2 Cache Management
```typescript
// store/cache.ts
import { AppDispatch, RootState } from '@/store';
import { invalidateCache as invalidateUsersCache } from './slices/usersSlice';
import { invalidateCache as invalidatePermissionsCache } from './slices/permissionsSlice';
import { invalidateCache as invalidateDepartmentsCache } from './slices/departmentsSlice';

export const invalidateAllCaches = () => (dispatch: AppDispatch) => {
  dispatch(invalidateUsersCache());
  dispatch(invalidatePermissionsCache());
  dispatch(invalidateDepartmentsCache());
};

export const checkCacheValidity = (state: RootState) => {
  const now = Date.now();
  const caches = [
    { name: 'users', lastFetch: state.users.lastFetch, validity: state.users.cacheValidity },
    { name: 'permissions', lastFetch: state.permissions.lastFetch, validity: state.permissions.cacheValidity },
    { name: 'departments', lastFetch: state.departments.lastFetch, validity: state.departments.cacheValidity },
  ];
  
  return caches.map(cache => ({
    ...cache,
    isValid: cache.lastFetch ? now - cache.lastFetch < cache.validity : false,
    expiresIn: cache.lastFetch ? Math.max(0, cache.validity - (now - cache.lastFetch)) : 0,
  }));
};
```

---

## Usage Examples

### Basic Usage
```tsx
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  selectPaginatedUsers, 
  selectUsersLoading,
  fetchUsers,
  setPage,
  toggleUserSelection,
} from '@/store';

function UsersList() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectPaginatedUsers);
  const loading = useAppSelector(selectUsersLoading);
  
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);
  
  const handlePageChange = (page: number) => {
    dispatch(setPage(page));
    dispatch(fetchUsers());
  };
  
  const handleUserSelect = (userId: string) => {
    dispatch(toggleUserSelection(userId));
  };
  
  return (
    // Component JSX
  );
}
```

### With Custom Selectors
```tsx
function DepartmentUserCount({ departmentId }: { departmentId: string }) {
  const usersByDepartment = useAppSelector(selectUsersByDepartment);
  const count = usersByDepartment[departmentId]?.length || 0;
  
  return <span>{count} users</span>;
}
```

### Modal Management
```tsx
function UserActions() {
  const dispatch = useAppDispatch();
  const { createUser, editUser } = useAppSelector(selectModals);
  
  return (
    <>
      <Button onClick={() => dispatch(openModal({ modal: 'createUser' }))}>
        Create User
      </Button>
      
      <UserCreateModal
        isOpen={createUser}
        onClose={() => dispatch(closeModal('createUser'))}
      />
    </>
  );
}
```

---

This completes the comprehensive state management specification for the Users Management feature. The Redux Toolkit setup provides a robust, scalable foundation for managing complex application state with excellent TypeScript support and developer experience.