import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '@/store';
import { ActivityLog, ExportFormat } from '@/types';
import { activityService, ListActivitiesParams } from '@/lib/api';

// Fetch activities
export const fetchActivities = createAsyncThunk(
  'activity/fetchActivities',
  async (_, { getState }) => {
    const state = getState() as RootState;
    const { pagination, filters } = state.activity;
    
    const params: ListActivitiesParams = {
      page: pagination.page,
      limit: pagination.limit,
      userId: filters.userId,
      action: filters.action,
      startDate: filters.dateRange.start ? new Date(filters.dateRange.start) : undefined,
      endDate: filters.dateRange.end ? new Date(filters.dateRange.end) : undefined,
    };
    
    return await activityService.listActivities(params);
  }
);

// Fetch user activities
export const fetchUserActivities = createAsyncThunk(
  'activity/fetchUserActivities',
  async ({ userId, params }: { userId: string; params?: Omit<ListActivitiesParams, 'userId'> }) => {
    return await activityService.getUserActivities(userId, params);
  }
);

// Fetch activity statistics
export const fetchActivityStats = createAsyncThunk(
  'activity/fetchStats',
  async (params?: { userId?: string; startDate?: Date; endDate?: Date }) => {
    return await activityService.getActivityStats(params);
  }
);

// Fetch activity timeline
export const fetchActivityTimeline = createAsyncThunk(
  'activity/fetchTimeline',
  async (params?: { userId?: string; days?: number }) => {
    return await activityService.getActivityTimeline(params);
  }
);

// Export activity logs
export const exportActivityLogs = createAsyncThunk(
  'activity/exportLogs',
  async (params: ListActivitiesParams & { format: ExportFormat }) => {
    const blob = await activityService.exportActivities(params);
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activity_logs_${Date.now()}.${params.format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return true;
  }
);