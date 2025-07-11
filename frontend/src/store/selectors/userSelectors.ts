import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { User, UserRole } from '@/types';

// Basic selectors
export const selectUsersState = (state: RootState) => state.users;
export const selectAllUsers = (state: RootState) => state.users.users;
export const selectUserIds = (state: RootState) => state.users.userIds;
export const selectUserById = (state: RootState, userId: string) => state.users.users[userId];

// Memoized selectors
export const selectUsersArray = createSelector(
  [selectAllUsers, selectUserIds],
  (users, userIds) => userIds.map(id => users[id]).filter(Boolean)
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
      const aValue = (a as any)[sorting.field];
      const bValue = (b as any)[sorting.field];
      
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

// Pagination selectors
export const selectPagination = (state: RootState) => state.users.pagination;
export const selectCurrentPage = (state: RootState) => state.users.pagination.page;
export const selectPageSize = (state: RootState) => state.users.pagination.limit;
export const selectTotalUsers = (state: RootState) => state.users.pagination.total;
export const selectTotalPages = (state: RootState) => state.users.pagination.totalPages;

// Filter selectors
export const selectFilters = (state: RootState) => state.users.filters;
export const selectSearchQuery = (state: RootState) => state.users.filters.search;
export const selectActiveFilters = createSelector(
  [selectFilters],
  (filters) => {
    const active: string[] = [];
    
    if (filters.search) active.push('search');
    if (filters.roles.length > 0) active.push('roles');
    if (filters.departments.length > 0) active.push('departments');
    if (filters.statuses.length > 0) active.push('statuses');
    if (filters.accessLevels.length > 0) active.push('accessLevels');
    if (filters.dateRange.start || filters.dateRange.end) active.push('dateRange');
    
    return active;
  }
);

// Sorting selectors
export const selectSorting = (state: RootState) => state.users.sorting;

// Selection selectors
export const selectSelectedUserIds = (state: RootState) => state.users.selectedUserIds;
export const selectIsUserSelected = (state: RootState, userId: string) => 
  state.users.selectedUserIds.includes(userId);
export const selectAllUsersSelected = createSelector(
  [selectUserIds, selectSelectedUserIds],
  (userIds, selectedIds) => 
    userIds.length > 0 && userIds.every(id => selectedIds.includes(id))
);

// Cache selectors
export const selectIsUsersCacheValid = createSelector(
  [selectUsersState],
  (state) => {
    if (!state.lastFetch) return false;
    return Date.now() - state.lastFetch < state.cacheValidity;
  }
);