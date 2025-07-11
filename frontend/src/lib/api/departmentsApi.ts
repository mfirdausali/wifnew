import { apiClient, API_ENDPOINTS } from './client';
import { 
  ApiResponse,
  Department,
  DepartmentNode,
  CreateDepartmentDTO,
  User,
  DepartmentStats
} from './types';
import { transformUser } from './transformers/user';

export interface UpdateDepartmentData {
  name?: string;
  description?: string;
  parentId?: string;
  managerIds?: string[];
}

export class DepartmentService {
  // Get all departments
  async getDepartments(): Promise<Department[]> {
    const response = await apiClient.get<ApiResponse<Department[]>>(
      API_ENDPOINTS.departments.list
    );
    
    return response.data.data;
  }
  
  // Get department tree
  async getDepartmentTree(): Promise<DepartmentNode[]> {
    const response = await apiClient.get<ApiResponse<DepartmentNode[]>>(
      API_ENDPOINTS.departments.tree
    );
    
    return response.data.data;
  }
  
  // Get single department
  async getDepartment(id: string): Promise<Department> {
    const response = await apiClient.get<ApiResponse<Department>>(
      API_ENDPOINTS.departments.detail(id)
    );
    
    return response.data.data;
  }
  
  // Create department
  async createDepartment(data: CreateDepartmentDTO): Promise<Department> {
    const response = await apiClient.post<ApiResponse<Department>>(
      API_ENDPOINTS.departments.create,
      data
    );
    
    return response.data.data;
  }
  
  // Update department
  async updateDepartment(
    id: string,
    data: UpdateDepartmentData
  ): Promise<Department> {
    const response = await apiClient.put<ApiResponse<Department>>(
      API_ENDPOINTS.departments.update(id),
      data
    );
    
    return response.data.data;
  }
  
  // Delete department
  async deleteDepartment(
    id: string,
    options?: { reassignTo?: string; deleteMembers?: boolean }
  ): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.departments.delete(id), {
      params: options,
    });
  }
  
  // Get department members
  async getDepartmentMembers(
    id: string,
    includeSubdepartments: boolean = false
  ): Promise<User[]> {
    const response = await apiClient.get<ApiResponse<User[]>>(
      API_ENDPOINTS.departments.members(id),
      {
        params: { includeSubdepartments },
      }
    );
    
    return response.data.data.map(transformUser);
  }
  
  // Move department
  async moveDepartment(
    id: string,
    newParentId: string | null
  ): Promise<Department> {
    const response = await apiClient.post<ApiResponse<Department>>(
      API_ENDPOINTS.departments.move(id),
      { newParentId }
    );
    
    return response.data.data;
  }
  
  // Get department statistics
  async getDepartmentStats(id: string): Promise<DepartmentStats> {
    const response = await apiClient.get<ApiResponse<DepartmentStats>>(
      API_ENDPOINTS.departments.stats(id)
    );
    
    return response.data.data;
  }
}

export const departmentService = new DepartmentService();