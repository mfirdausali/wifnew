import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Department, DepartmentNode } from '@/types';
import { fetchDepartments } from '../thunks/departmentThunks';

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

const initialState: DepartmentsState = {
  departments: {},
  departmentIds: [],
  rootDepartmentIds: [],
  departmentTree: [],
  loading: false,
  error: null,
  lastFetch: null,
  cacheValidity: 30 * 60 * 1000, // 30 minutes
};

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

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
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
        
        action.payload.forEach((dept: Department) => {
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