import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '@/types';

interface UIState {
  // Theme
  theme: 'light' | 'dark' | 'system';
  
  // Layout
  sidebarCollapsed: boolean;
  tableCompact: boolean;
  
  // Modals
  modals: {
    createUser: boolean;
    editUser: { isOpen: boolean; userId: string | null };
    deleteUser: { isOpen: boolean; userId: string | null };
    bulkAction: { isOpen: boolean; action: string | null };
    importUsers: boolean;
    exportUsers: boolean;
  };
  
  // Table preferences
  tablePreferences: {
    visibleColumns: string[];
    columnWidths: Record<string, number>;
    defaultPageSize: number;
  };
  
  // Notifications
  notifications: Notification[];
  notificationPreferences: {
    showToasts: boolean;
    playSound: boolean;
    desktopNotifications: boolean;
  };
  
  // Tour
  tourCompleted: boolean;
  tourStep: number;
  
  // Feature flags
  features: {
    advancedFilters: boolean;
    bulkOperations: boolean;
    realTimeUpdates: boolean;
    darkMode: boolean;
  };
}

// Utility function to generate ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialState: UIState = {
  theme: 'system',
  sidebarCollapsed: false,
  tableCompact: false,
  modals: {
    createUser: false,
    editUser: { isOpen: false, userId: null },
    deleteUser: { isOpen: false, userId: null },
    bulkAction: { isOpen: false, action: null },
    importUsers: false,
    exportUsers: false,
  },
  tablePreferences: {
    visibleColumns: [
      'name',
      'email',
      'role',
      'department',
      'status',
      'lastLogin',
      'actions',
    ],
    columnWidths: {},
    defaultPageSize: 25,
  },
  notifications: [],
  notificationPreferences: {
    showToasts: true,
    playSound: true,
    desktopNotifications: false,
  },
  tourCompleted: false,
  tourStep: 0,
  features: {
    advancedFilters: true,
    bulkOperations: true,
    realTimeUpdates: true,
    darkMode: true,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload;
    },
    
    // Layout
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    toggleTableCompact: (state) => {
      state.tableCompact = !state.tableCompact;
    },
    
    // Modals
    openModal: (state, action: PayloadAction<{ modal: keyof UIState['modals']; data?: any }>) => {
      const { modal, data } = action.payload;
      
      switch (modal) {
        case 'createUser':
        case 'importUsers':
        case 'exportUsers':
          state.modals[modal] = true;
          break;
        case 'editUser':
        case 'deleteUser':
          state.modals[modal] = { isOpen: true, userId: data?.userId || null };
          break;
        case 'bulkAction':
          state.modals[modal] = { isOpen: true, action: data?.action || null };
          break;
      }
    },
    
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      const modal = action.payload;
      
      switch (modal) {
        case 'createUser':
        case 'importUsers':
        case 'exportUsers':
          state.modals[modal] = false;
          break;
        case 'editUser':
        case 'deleteUser':
          state.modals[modal] = { isOpen: false, userId: null };
          break;
        case 'bulkAction':
          state.modals[modal] = { isOpen: false, action: null };
          break;
      }
    },
    
    closeAllModals: (state) => {
      state.modals = {
        createUser: false,
        editUser: { isOpen: false, userId: null },
        deleteUser: { isOpen: false, userId: null },
        bulkAction: { isOpen: false, action: null },
        importUsers: false,
        exportUsers: false,
      };
    },
    
    // Table preferences
    setVisibleColumns: (state, action: PayloadAction<string[]>) => {
      state.tablePreferences.visibleColumns = action.payload;
    },
    
    toggleColumnVisibility: (state, action: PayloadAction<string>) => {
      const column = action.payload;
      const { visibleColumns } = state.tablePreferences;
      
      if (visibleColumns.includes(column)) {
        state.tablePreferences.visibleColumns = visibleColumns.filter(c => c !== column);
      } else {
        state.tablePreferences.visibleColumns.push(column);
      }
    },
    
    setColumnWidth: (state, action: PayloadAction<{ column: string; width: number }>) => {
      const { column, width } = action.payload;
      state.tablePreferences.columnWidths[column] = width;
    },
    
    setDefaultPageSize: (state, action: PayloadAction<number>) => {
      state.tablePreferences.defaultPageSize = action.payload;
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: generateId(),
        timestamp: Date.now(),
        read: false,
      };
      state.notifications.unshift(notification);
      
      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => {
        n.read = true;
      });
    },
    
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    setNotificationPreferences: (state, action: PayloadAction<Partial<UIState['notificationPreferences']>>) => {
      state.notificationPreferences = {
        ...state.notificationPreferences,
        ...action.payload,
      };
    },
    
    // Tour
    setTourCompleted: (state, action: PayloadAction<boolean>) => {
      state.tourCompleted = action.payload;
    },
    
    setTourStep: (state, action: PayloadAction<number>) => {
      state.tourStep = action.payload;
    },
    
    nextTourStep: (state) => {
      state.tourStep += 1;
    },
    
    // Feature flags
    setFeatureFlag: (state, action: PayloadAction<{ feature: keyof UIState['features']; enabled: boolean }>) => {
      const { feature, enabled } = action.payload;
      state.features[feature] = enabled;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  toggleTableCompact,
  openModal,
  closeModal,
  closeAllModals,
  setVisibleColumns,
  toggleColumnVisibility,
  setColumnWidth,
  setDefaultPageSize,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
  setNotificationPreferences,
  setTourCompleted,
  setTourStep,
  nextTourStep,
  setFeatureFlag,
} = uiSlice.actions;

export default uiSlice.reducer;