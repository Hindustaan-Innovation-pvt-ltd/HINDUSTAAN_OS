import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export type NotificationType = 'task' | 'success' | 'alert' | 'warning' | 'info' | 'user' | 'request' | 'danger' | 'file' | 'meeting' | 'message';

export interface NotificationAction {
  label: string;
  primary: boolean;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  category: string;
  icon: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  group: string;
  priority?: string;
  actions?: NotificationAction[];
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => void;
  markAsRead: (id: number) => void;
  clearAll: () => void;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: 'task',
    category: 'Tasks',
    icon: '📋',
    title: 'New Task Assigned',
    message: 'Rahul assigned Authentication Module to Tanvy.',
    time: '2 minutes ago',
    unread: true,
    group: 'Today',
    actions: [
      { label: 'View Task', primary: true },
      { label: 'Dismiss', primary: false }
    ]
  },
  {
    id: 2,
    type: 'success',
    category: 'Tasks',
    icon: '✅',
    title: 'Task Completed',
    message: 'Tanvy completed Dashboard UI.',
    time: '10 minutes ago',
    unread: true,
    group: 'Today',
  },
  {
    id: 3,
    type: 'alert',
    category: 'Projects',
    icon: '🚨',
    title: 'Deadline Alert',
    message: 'Backend API deadline is tomorrow.',
    priority: 'High',
    time: '1 hour ago',
    unread: true,
    group: 'Today',
  },
  {
    id: 4,
    type: 'warning',
    category: 'Team',
    icon: '📝',
    title: 'Standup Missing',
    message: 'Priya and Aman haven\'t submitted today\'s standup.',
    time: '2 hours ago',
    unread: false,
    group: 'Today',
  },
  {
    id: 5,
    type: 'info',
    category: 'Team',
    icon: '⏱',
    title: 'Work Log Submitted',
    message: 'Rahul logged 7.5 hours today.',
    time: '5 hours ago',
    unread: false,
    group: 'Today',
  },
  {
    id: 6,
    type: 'user',
    category: 'Team',
    icon: '👤',
    title: 'New Team Member',
    message: 'Neha Sharma joined the Frontend Team.',
    time: 'Yesterday',
    unread: false,
    group: 'Yesterday',
  },
  {
    id: 7,
    type: 'request',
    category: 'Team',
    icon: '📅',
    title: 'Leave Request',
    message: 'Aman requested leave for 12 July.',
    time: 'Yesterday',
    unread: false,
    group: 'Yesterday',
    actions: [
      { label: 'Approve', primary: true },
      { label: 'Reject', primary: false }
    ]
  },
  {
    id: 8,
    type: 'success',
    category: 'Projects',
    icon: '🎯',
    title: 'Milestone Completed',
    message: 'Sprint 2 milestone completed.',
    time: '2 days ago',
    unread: false,
    group: 'Earlier',
  },
  {
    id: 9,
    type: 'danger',
    category: 'Projects',
    icon: '⚠️',
    title: 'Project Risk',
    message: 'Crime Prediction System is behind schedule.',
    time: '2 days ago',
    unread: false,
    group: 'Earlier',
  }
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('hindustaan_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    localStorage.setItem('hindustaan_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notif: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => {
    const newNotification: NotificationItem = {
      ...notif,
      id: Date.now(),
      time: 'Just now',
      unread: true,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, clearAll, setNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
