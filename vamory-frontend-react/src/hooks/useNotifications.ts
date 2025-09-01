import { useState, useEffect, useCallback } from 'react';
import { notificationsAPI, unknownFacesAPI } from '../services/api';
import type { Notification, UnknownFace } from '../types';

export const useNotifications = (isAuthenticated: boolean = false) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unknownFaces, setUnknownFaces] = useState<UnknownFace[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unknownFacesCount, setUnknownFacesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if there are any notifications to show
  const hasNotifications = unreadCount > 0 || unknownFacesCount > 0;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationsAPI.getNotifications({
        status_filter: 'all',
        sort_by: 'notification_read',
        sort_order: 'asc',
        per_page: 20
      });
      
      setNotifications(response.notifications);
      setUnreadCount(response.notifications.filter(n => !n.notification_read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch unknown faces
  const fetchUnknownFaces = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setError(null);
      
      const response = await unknownFacesAPI.getUnknownFaces({
        per_page: 20
      });
      
      setUnknownFaces(response.data);
      setUnknownFacesCount(response.meta.total_count);
    } catch (err) {
      console.error('Failed to fetch unknown faces:', err);
      setError('Failed to load unknown faces');
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!isAuthenticated) return;
    
    try {
      await notificationsAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, notification_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, [isAuthenticated]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const unreadNotifications = notifications.filter(n => !n.notification_read);
      
      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(notification => 
          notificationsAPI.markAsRead(notification._id)
        )
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          notification_read: true,
          read_at: notification.read_at || new Date().toISOString()
        }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  }, [notifications, isAuthenticated]);

  // Initialize data (lazy loading)
  const initializeData = useCallback(async () => {
    if (!isAuthenticated || isInitialized) return;
    
    await fetchNotifications();
    await fetchUnknownFaces();
    setIsInitialized(true);
  }, [isAuthenticated, isInitialized, fetchNotifications, fetchUnknownFaces]);

  // Reset state when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnknownFaces([]);
      setUnreadCount(0);
      setUnknownFacesCount(0);
      setLoading(false);
      setError(null);
      setIsInitialized(false);
    }
  }, [isAuthenticated]);

  // Initial load - fetch unread count and unknown faces count for the bell icon
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchInitialCounts = async () => {
      try {
        // Fetch unread notifications count
        const notificationsResponse = await notificationsAPI.getNotifications({
          status_filter: 'unread',
          sort_by: 'notification_read',
          sort_order: 'asc',
          per_page: 1
        });
        setUnreadCount(notificationsResponse.total_count);

        // Fetch unknown faces count
        const unknownFacesResponse = await unknownFacesAPI.getUnknownFaces({
          per_page: 1
        });
        setUnknownFacesCount(unknownFacesResponse.meta.total_count);
      } catch (err) {
        console.error('Failed to fetch initial counts:', err);
      }
    };

    fetchInitialCounts();
  }, [isAuthenticated]);

  return {
    notifications,
    unknownFaces,
    unreadCount,
    unknownFacesCount,
    hasNotifications,
    loading,
    error,
    fetchNotifications,
    fetchUnknownFaces,
    markAsRead,
    markAllAsRead,
    initializeData,
  };
};
