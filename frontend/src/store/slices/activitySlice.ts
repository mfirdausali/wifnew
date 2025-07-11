import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActivityLog, ActivityAction } from '@/types';
import { fetchActivities } from '../thunks/activityThunks';

interface ActivityState {
  // Activity logs
  activities: Record<string, ActivityLog>;
  activityIds: string[];
  
  // Filters
  filters: {
    userId?: string;
    action?: ActivityAction[];
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  
  // Real-time updates
  liveUpdates: boolean;
  pendingActivities: ActivityLog[];
  
  // Loading & errors
  loading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  activities: {},
  activityIds: [],
  filters: {
    dateRange: {
      start: null,
      end: null,
    },
  },
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    hasMore: false,
  },
  liveUpdates: false,
  pendingActivities: [],
  loading: false,
  error: null,
};

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    // Activity management
    setActivities: (state, action: PayloadAction<ActivityLog[]>) => {
      state.activities = {};
      state.activityIds = [];
      action.payload.forEach(activity => {
        state.activities[activity.id] = activity;
        state.activityIds.push(activity.id);
      });
    },
    
    addActivity: (state, action: PayloadAction<ActivityLog>) => {
      const activity = action.payload;
      state.activities[activity.id] = activity;
      state.activityIds.unshift(activity.id);
      state.pagination.total += 1;
    },
    
    addActivities: (state, action: PayloadAction<ActivityLog[]>) => {
      action.payload.forEach(activity => {
        state.activities[activity.id] = activity;
        state.activityIds.push(activity.id);
      });
    },
    
    // Real-time updates
    toggleLiveUpdates: (state, action: PayloadAction<boolean>) => {
      state.liveUpdates = action.payload;
    },
    
    addPendingActivity: (state, action: PayloadAction<ActivityLog>) => {
      state.pendingActivities.push(action.payload);
    },
    
    applyPendingActivities: (state) => {
      state.pendingActivities.forEach(activity => {
        state.activities[activity.id] = activity;
        state.activityIds.unshift(activity.id);
      });
      state.pagination.total += state.pendingActivities.length;
      state.pendingActivities = [];
    },
    
    clearPendingActivities: (state) => {
      state.pendingActivities = [];
    },
    
    // Filters
    setFilters: (state, action: PayloadAction<Partial<ActivityState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1;
    },
    
    clearFilters: (state) => {
      state.filters = {
        dateRange: {
          start: null,
          end: null,
        },
      };
      state.pagination.page = 1;
    },
    
    // Pagination
    setPagination: (state, action: PayloadAction<Partial<ActivityState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    nextPage: (state) => {
      if (state.pagination.hasMore) {
        state.pagination.page += 1;
      }
    },
    
    // Loading & errors
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload.page === 1) {
          // Replace all activities if first page
          state.activities = {};
          state.activityIds = [];
        }
        
        action.payload.data.forEach((activity: ActivityLog) => {
          state.activities[activity.id] = activity;
          state.activityIds.push(activity.id);
        });
        
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasMore: action.payload.hasMore,
        };
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch activities';
      });
  },
});

export const {
  setActivities,
  addActivity,
  addActivities,
  toggleLiveUpdates,
  addPendingActivity,
  applyPendingActivities,
  clearPendingActivities,
  setFilters,
  clearFilters,
  setPagination,
  nextPage,
  setLoading,
  setError,
} = activitySlice.actions;

export default activitySlice.reducer;