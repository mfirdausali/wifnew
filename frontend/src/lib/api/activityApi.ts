import { apiClient, API_ENDPOINTS } from './client';
import { 
  ApiResponse,
  PaginatedResponse,
  ActivityLog,
  ActivityAction,
  ActivityStats,
  ActivityTimeline,
  ExportFormat
} from './types';

export interface ListActivitiesParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: ActivityAction[];
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}

export class ActivityService {
  // List activities
  async listActivities(
    params: ListActivitiesParams = {}
  ): Promise<PaginatedResponse<ActivityLog>> {
    const response = await apiClient.get<PaginatedResponse<ActivityLog>>(
      API_ENDPOINTS.activities.list,
      { params }
    );
    
    return response.data;
  }
  
  // Get user activities
  async getUserActivities(
    userId: string,
    params?: Omit<ListActivitiesParams, 'userId'>
  ): Promise<PaginatedResponse<ActivityLog>> {
    const response = await apiClient.get<PaginatedResponse<ActivityLog>>(
      API_ENDPOINTS.activities.userActivities(userId),
      { params }
    );
    
    return response.data;
  }
  
  // Export activities
  async exportActivities(
    params: ListActivitiesParams & { format: ExportFormat }
  ): Promise<Blob> {
    const response = await apiClient.post(
      API_ENDPOINTS.activities.export,
      params,
      {
        responseType: 'blob',
      }
    );
    
    return response.data;
  }
  
  // Get activity statistics
  async getActivityStats(params?: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ActivityStats> {
    const response = await apiClient.get<ApiResponse<ActivityStats>>(
      API_ENDPOINTS.activities.stats,
      { params }
    );
    
    return response.data.data;
  }
  
  // Get activity timeline
  async getActivityTimeline(params?: {
    userId?: string;
    days?: number;
  }): Promise<ActivityTimeline[]> {
    const response = await apiClient.get<ApiResponse<ActivityTimeline[]>>(
      API_ENDPOINTS.activities.timeline,
      { params }
    );
    
    return response.data.data;
  }
}

export const activityService = new ActivityService();