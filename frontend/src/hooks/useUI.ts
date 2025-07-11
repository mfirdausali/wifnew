import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  openModal,
  closeModal,
  closeAllModals,
  toggleSidebar,
  setTheme,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  setVisibleColumns,
  toggleColumnVisibility,
} from '@/store/slices/uiSlice';
import { Notification } from '@/types';

export const useUI = () => {
  const dispatch = useAppDispatch();
  const ui = useAppSelector(state => state.ui);
  
  // Modal management
  const handleOpenModal = useCallback((modal: keyof typeof ui.modals, data?: any) => {
    dispatch(openModal({ modal, data }));
  }, [dispatch]);
  
  const handleCloseModal = useCallback((modal: keyof typeof ui.modals) => {
    dispatch(closeModal(modal));
  }, [dispatch]);
  
  const handleCloseAllModals = useCallback(() => {
    dispatch(closeAllModals());
  }, [dispatch]);
  
  // Theme
  const handleSetTheme = useCallback((theme: 'light' | 'dark' | 'system') => {
    dispatch(setTheme(theme));
  }, [dispatch]);
  
  // Sidebar
  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);
  
  // Notifications
  const handleAddNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    dispatch(addNotification(notification));
  }, [dispatch]);
  
  const handleMarkNotificationRead = useCallback((id: string) => {
    dispatch(markNotificationRead(id));
  }, [dispatch]);
  
  const handleMarkAllNotificationsRead = useCallback(() => {
    dispatch(markAllNotificationsRead());
  }, [dispatch]);
  
  const handleRemoveNotification = useCallback((id: string) => {
    dispatch(removeNotification(id));
  }, [dispatch]);
  
  // Table preferences
  const handleSetVisibleColumns = useCallback((columns: string[]) => {
    dispatch(setVisibleColumns(columns));
  }, [dispatch]);
  
  const handleToggleColumnVisibility = useCallback((column: string) => {
    dispatch(toggleColumnVisibility(column));
  }, [dispatch]);
  
  // Helper functions
  const showSuccess = useCallback((message: string, title = 'Success') => {
    dispatch(addNotification({ type: 'success', title, message }));
  }, [dispatch]);
  
  const showError = useCallback((message: string, title = 'Error') => {
    dispatch(addNotification({ type: 'error', title, message }));
  }, [dispatch]);
  
  const showWarning = useCallback((message: string, title = 'Warning') => {
    dispatch(addNotification({ type: 'warning', title, message }));
  }, [dispatch]);
  
  const showInfo = useCallback((message: string, title = 'Info') => {
    dispatch(addNotification({ type: 'info', title, message }));
  }, [dispatch]);
  
  return {
    // State
    theme: ui.theme,
    sidebarCollapsed: ui.sidebarCollapsed,
    modals: ui.modals,
    notifications: ui.notifications,
    tablePreferences: ui.tablePreferences,
    features: ui.features,
    
    // Actions
    openModal: handleOpenModal,
    closeModal: handleCloseModal,
    closeAllModals: handleCloseAllModals,
    setTheme: handleSetTheme,
    toggleSidebar: handleToggleSidebar,
    addNotification: handleAddNotification,
    markNotificationRead: handleMarkNotificationRead,
    markAllNotificationsRead: handleMarkAllNotificationsRead,
    removeNotification: handleRemoveNotification,
    setVisibleColumns: handleSetVisibleColumns,
    toggleColumnVisibility: handleToggleColumnVisibility,
    
    // Helper methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};