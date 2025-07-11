import { apiClient, API_ENDPOINTS } from './client';
import { 
  ApiResponse,
  PaginatedResponse,
  ActivityLog,
  ActivityAction,
  ActivityStats,
  ActivityTimeline,
  ExportFormat,
  ActivityMetadata,
  ActivityFeedItem,
  SuspiciousActivityResult,
  ActivityReport
} from './types';

export interface ListActivitiesParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  actionCategory?: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  sessionId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  success?: boolean;
}

export class ActivityService {
  // Get activity metadata (categories, actions, etc.)
  async getMetadata(): Promise<ActivityMetadata> {
    const response = await apiClient.get<ActivityMetadata>(
      API_ENDPOINTS.activities.metadata
    );
    
    return response.data;
  }

  // Get current user's activities
  async getMyActivities(
    params: Omit<ListActivitiesParams, 'userId'> = {}
  ): Promise<PaginatedResponse<ActivityLog>> {
    const response = await apiClient.get<PaginatedResponse<ActivityLog>>(
      API_ENDPOINTS.activities.myActivities,
      { params }
    );
    
    return response.data;
  }

  // List all activities (admin only)
  async listActivities(
    params: ListActivitiesParams = {}
  ): Promise<PaginatedResponse<ActivityLog>> {
    const response = await apiClient.get<PaginatedResponse<ActivityLog>>(
      API_ENDPOINTS.activities.list,
      { params }
    );
    
    return response.data;
  }
  
  // Get user activity timeline
  async getUserActivityTimeline(
    userId: string,
    days: number = 7
  ): Promise<{ timeline: Record<string, ActivityLog[]> }> {
    const response = await apiClient.get<{ timeline: Record<string, ActivityLog[]> }>(
      API_ENDPOINTS.activities.userTimeline(userId),
      { params: { days } }
    );
    
    return response.data;
  }
  
  // Check suspicious activity for a user
  async checkSuspiciousActivity(
    userId: string
  ): Promise<SuspiciousActivityResult> {
    const response = await apiClient.get<SuspiciousActivityResult>(
      API_ENDPOINTS.activities.userSuspicious(userId)
    );
    
    return response.data;
  }
  
  // Generate activity report for a user
  async generateActivityReport(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ActivityReport> {
    const response = await apiClient.post<ActivityReport>(
      API_ENDPOINTS.activities.userReport(userId),
      null,
      { params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() } }
    );
    
    return response.data;
  }
  
  // Export activities
  async exportActivities(
    params: ListActivitiesParams & { format: ExportFormat }
  ): Promise<Blob> {
    const response = await apiClient.get(
      API_ENDPOINTS.activities.export,
      {
        params,
        responseType: 'blob',
      }
    );
    
    return response.data;
  }
  
  // Get activity statistics
  async getActivityStats(params?: {
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<ActivityStats> {
    const response = await apiClient.get<ActivityStats>(
      API_ENDPOINTS.activities.stats,
      { params }
    );
    
    return response.data;
  }
  
  // Get real-time activity feed
  async getActivityFeed(limit: number = 20): Promise<{
    activities: ActivityFeedItem[];
  }> {
    const response = await apiClient.get<{ activities: ActivityFeedItem[] }>(
      API_ENDPOINTS.activities.feed,
      { params: { limit } }
    );
    
    return response.data;
  }
}

export const activityService = new ActivityService();