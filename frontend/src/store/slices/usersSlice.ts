import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole, UserStatus } from '@/types';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers,
} from '../thunks/userThunks';

interface OptimisticUpdate {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: Partial<User>;
  timestamp: number;
}

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
        action.payload.data.forEach((user: User) => {
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
        action.payload.forEach((user: User) => {
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