import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

export type NotificationType = 'task' | 'success' | 'alert' | 'warning' | 'info' | 'user' | 'request' | 'danger' | 'file' | 'meeting' | 'message';

export interface NotificationAction {
  label: string;
  primary?: boolean;
  actionType?: string;
}

export interface NotificationItem {
  id: string | number;
  type: NotificationType;
  category: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  timestamp?: number;
  unread: boolean;
  group: string;
  priority?: string;
  metadata?: any;
  actions?: NotificationAction[];
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => void;
  markAsRead: (id: string | number) => void;
  clearNotification: (id: string | number) => void;
  clearAll: () => void;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  fetchNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchNotifications = async () => {
    // Only fetch if a user session exists in local/session storage
    const hasSession = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
    if (!hasSession) {
      return;
    }

    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        const mapped = res.data.data.map((n: any) => {
          // Format date to readable time
          const date = new Date(n.createdAt);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.round(diffMs / 60000);
          
          let timeStr = 'Just now';
          if (diffMins > 0 && diffMins < 60) timeStr = `${diffMins} minutes ago`;
          else if (diffMins >= 60 && diffMins < 1440) timeStr = `${Math.floor(diffMins / 60)} hours ago`;
          else if (diffMins >= 1440) timeStr = `${Math.floor(diffMins / 1440)} days ago`;

          // Map types to icons and categories (simplified)
          let icon = '🔔';
          let category = 'System';
          
          if (n.type === 'task') { icon = '📋'; category = 'Tasks'; }
          if (n.type === 'alert') { icon = '🚨'; category = 'Alerts'; }
          if (n.type === 'info') { icon = 'ℹ️'; category = 'Info'; }
          if (n.type === 'success') { icon = '✅'; category = 'Success'; }

          return {
            id: n.id,
            type: n.type || 'info',
            category,
            icon,
            title: n.title,
            message: n.message || n.description || n.text || '',
            time: timeStr,
            timestamp: date.getTime(),
            unread: !n.isRead,
            group: diffMins < 1440 ? 'Today' : 'Earlier',
          };
        });
        setNotifications(mapped);
      }
    } catch (err) {
      // Silently handle notification poll errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = (notif: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => {
    const newNotification: NotificationItem = {
      ...notif,
      id: Date.now(),
      time: 'Just now',
      timestamp: Date.now(),
      unread: true,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = async (id: string | number) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
    try {
      if (typeof id === 'string') {
        await api.patch(`/notifications/${id}/read`);
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
      // Revert if error (omitted for brevity)
    }
  };

  const clearNotification = async (id: string | number) => {
    // Optimistic update
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      if (typeof id === 'string') {
        await api.delete(`/notifications/${id}`);
      }
    } catch (err) {
      console.error("Failed to clear notification", err);
    }
  };

  const clearAll = async () => {
    setNotifications([]);
    try {
      await api.delete('/notifications');
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearNotification, clearAll, setNotifications, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    return {
      notifications: [],
      addNotification: () => {},
      markAsRead: () => {},
      clearNotification: () => {},
      clearAll: () => {},
      setNotifications: () => {},
      fetchNotifications: () => {}
    };
  }
  return context;
};
