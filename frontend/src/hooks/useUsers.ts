import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkUpdateUsers,
  exportUsers,
  importUsers,
} from '@/store/thunks/userThunks';
import {
  setPage,
  setLimit,
  setFilters,
  clearFilters,
  setSearch,
  setSorting,
  toggleSortOrder,
  toggleUserSelection,
  selectAllUsers,
  clearSelection,
} from '@/store/slices/usersSlice';
import {
  selectPaginatedUsers,
  selectUsersLoading,
  selectUsersErrors,
  selectPagination,
  selectFilters,
  selectSorting,
  selectSelectedUserIds,
  selectIsUsersCacheValid,
  selectUsersStats,
} from '@/store/selectors/userSelectors';
import { CreateUserDTO, UpdateUserDTO, ExportOptions, ImportOptions } from '@/types';

export const useUsers = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const users = useAppSelector(selectPaginatedUsers);
  const loading = useAppSelector(selectUsersLoading);
  const errors = useAppSelector(selectUsersErrors);
  const pagination = useAppSelector(selectPagination);
  const filters = useAppSelector(selectFilters);
  const sorting = useAppSelector(selectSorting);
  const selectedIds = useAppSelector(selectSelectedUserIds);
  const isCacheValid = useAppSelector(selectIsUsersCacheValid);
  const stats = useAppSelector(selectUsersStats);
  
  // Fetch users on mount and when dependencies change
  useEffect(() => {
    if (!isCacheValid) {
      dispatch(fetchUsers());
    }
  }, [dispatch, isCacheValid, pagination.page, pagination.limit, filters, sorting]);
  
  // User management
  const handleCreateUser = useCallback(async (userData: CreateUserDTO) => {
    const result = await dispatch(createUser(userData));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  const handleUpdateUser = useCallback(async (id: string, changes: UpdateUserDTO) => {
    const result = await dispatch(updateUser({ id, changes }));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  const handleDeleteUser = useCallback(async (id: string) => {
    const result = await dispatch(deleteUser(id));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  const handleBulkUpdate = useCallback(async (userIds: string[], changes: Partial<UpdateUserDTO>) => {
    const result = await dispatch(bulkUpdateUsers({ userIds, changes }));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  // Export/Import
  const handleExport = useCallback(async (options: ExportOptions) => {
    const result = await dispatch(exportUsers(options));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  const handleImport = useCallback(async (file: File, options: ImportOptions) => {
    const result = await dispatch(importUsers({ file, options }));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  // Pagination
  const handlePageChange = useCallback((page: number) => {
    dispatch(setPage(page));
  }, [dispatch]);
  
  const handleLimitChange = useCallback((limit: number) => {
    dispatch(setLimit(limit));
  }, [dispatch]);
  
  // Filtering
  const handleSearchChange = useCallback((search: string) => {
    dispatch(setSearch(search));
  }, [dispatch]);
  
  const handleFiltersChange = useCallback((newFilters: Partial<typeof filters>) => {
    dispatch(setFilters(newFilters));
  }, [dispatch, filters]);
  
  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
  }, [dispatch]);
  
  // Sorting
  const handleSortChange = useCallback((field: string) => {
    if (sorting.field === field) {
      dispatch(toggleSortOrder());
    } else {
      dispatch(setSorting({ field, order: 'asc' }));
    }
  }, [dispatch, sorting]);
  
  // Selection
  const handleToggleSelection = useCallback((userId: string) => {
    dispatch(toggleUserSelection(userId));
  }, [dispatch]);
  
  const handleSelectAll = useCallback(() => {
    dispatch(selectAllUsers());
  }, [dispatch]);
  
  const handleClearSelection = useCallback(() => {
    dispatch(clearSelection());
  }, [dispatch]);
  
  // Refresh data
  const refreshUsers = useCallback(() => {
    dispatch(fetchUsers());
  }, [dispatch]);
  
  return {
    // Data
    users,
    loading,
    errors,
    pagination,
    filters,
    sorting,
    selectedIds,
    stats,
    
    // Actions
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    bulkUpdate: handleBulkUpdate,
    exportUsers: handleExport,
    importUsers: handleImport,
    
    // Pagination
    setPage: handlePageChange,
    setLimit: handleLimitChange,
    
    // Filtering
    setSearch: handleSearchChange,
    setFilters: handleFiltersChange,
    clearFilters: handleClearFilters,
    
    // Sorting
    setSort: handleSortChange,
    
    // Selection
    toggleSelection: handleToggleSelection,
    selectAll: handleSelectAll,
    clearSelection: handleClearSelection,
    
    // Refresh
    refresh: refreshUsers,
  };
};