import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  moveDepartment,
} from '@/store/thunks/departmentThunks';
import {
  addDepartment,
  updateDepartment as updateDepartmentAction,
  removeDepartment,
} from '@/store/slices/departmentsSlice';
import { CreateDepartmentDTO, Department } from '@/types';

export const useDepartments = () => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const departments = useAppSelector(state => state.departments.departments);
  const departmentTree = useAppSelector(state => state.departments.departmentTree);
  const loading = useAppSelector(state => state.departments.loading);
  const error = useAppSelector(state => state.departments.error);
  const isCacheValid = useAppSelector(state => {
    const { lastFetch, cacheValidity } = state.departments;
    return lastFetch ? Date.now() - lastFetch < cacheValidity : false;
  });
  
  // Fetch departments on mount if cache is invalid
  useEffect(() => {
    if (!isCacheValid) {
      dispatch(fetchDepartments());
    }
  }, [dispatch, isCacheValid]);
  
  // Department management
  const handleCreateDepartment = useCallback(async (data: CreateDepartmentDTO) => {
    const result = await dispatch(createDepartment(data));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  const handleUpdateDepartment = useCallback(async (id: string, changes: Partial<Department>) => {
    const result = await dispatch(updateDepartment({ id, changes }));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  const handleDeleteDepartment = useCallback(async (id: string) => {
    const result = await dispatch(deleteDepartment(id));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  const handleMoveDepartment = useCallback(async (id: string, newParentId: string | null) => {
    const result = await dispatch(moveDepartment({ id, newParentId }));
    return result.meta.requestStatus === 'fulfilled';
  }, [dispatch]);
  
  // Get department by ID
  const getDepartmentById = useCallback((id: string) => {
    return departments[id] || null;
  }, [departments]);
  
  // Get department children
  const getDepartmentChildren = useCallback((id: string) => {
    return Object.values(departments).filter(dept => dept.parentId === id);
  }, [departments]);
  
  // Get department path
  const getDepartmentPath = useCallback((id: string): Department[] => {
    const path: Department[] = [];
    let current = departments[id];
    
    while (current) {
      path.unshift(current);
      current = current.parentId ? departments[current.parentId] : null;
    }
    
    return path;
  }, [departments]);
  
  // Refresh departments
  const refreshDepartments = useCallback(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);
  
  return {
    // Data
    departments: Object.values(departments),
    departmentTree,
    loading,
    error,
    
    // Actions
    createDepartment: handleCreateDepartment,
    updateDepartment: handleUpdateDepartment,
    deleteDepartment: handleDeleteDepartment,
    moveDepartment: handleMoveDepartment,
    
    // Utilities
    getDepartmentById,
    getDepartmentChildren,
    getDepartmentPath,
    refresh: refreshDepartments,
  };
};