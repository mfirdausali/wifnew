import { createAsyncThunk } from '@reduxjs/toolkit';
import { Department, CreateDepartmentDTO } from '@/types';
import { departmentService, UpdateDepartmentData } from '@/lib/api';

// Fetch all departments
export const fetchDepartments = createAsyncThunk(
  'departments/fetchDepartments',
  async () => {
    return await departmentService.getDepartments();
  }
);

// Fetch department tree
export const fetchDepartmentTree = createAsyncThunk(
  'departments/fetchTree',
  async () => {
    return await departmentService.getDepartmentTree();
  }
);

// Create department
export const createDepartment = createAsyncThunk(
  'departments/createDepartment',
  async (departmentData: CreateDepartmentDTO) => {
    return await departmentService.createDepartment(departmentData);
  }
);

// Update department
export const updateDepartment = createAsyncThunk(
  'departments/updateDepartment',
  async ({ id, changes }: { id: string; changes: UpdateDepartmentData }) => {
    return await departmentService.updateDepartment(id, changes);
  }
);

// Delete department
export const deleteDepartment = createAsyncThunk(
  'departments/deleteDepartment',
  async ({ id, options }: { id: string; options?: { reassignTo?: string; deleteMembers?: boolean } }) => {
    await departmentService.deleteDepartment(id, options);
    return id;
  }
);

// Move department
export const moveDepartment = createAsyncThunk(
  'departments/moveDepartment',
  async ({ id, newParentId }: { id: string; newParentId: string | null }) => {
    return await departmentService.moveDepartment(id, newParentId);
  }
);

// Get department members
export const fetchDepartmentMembers = createAsyncThunk(
  'departments/fetchMembers',
  async ({ departmentId, includeSubdepartments = false }: { departmentId: string; includeSubdepartments?: boolean }) => {
    const members = await departmentService.getDepartmentMembers(departmentId, includeSubdepartments);
    return { departmentId, members };
  }
);

// Get department statistics
export const fetchDepartmentStats = createAsyncThunk(
  'departments/fetchStats',
  async (departmentId: string) => {
    const stats = await departmentService.getDepartmentStats(departmentId);
    return { departmentId, stats };
  }
);