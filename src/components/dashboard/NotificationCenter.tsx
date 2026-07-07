import React, { useState } from 'react';
import { 
  Bell, Check, Trash2, Settings, ExternalLink, FileText, Clock, 
  UserPlus, Calendar, Target, AlertTriangle, Video, CheckSquare, ShieldAlert 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Dummy data matching the prompt requirements
const INITIAL_NOTIFICATIONS = [
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
  },
  {
    id: 10,
    type: 'file',
    category: 'System',
    icon: '📄',
    title: 'File Uploaded',
    message: 'Tanvy uploaded Dashboard_Design.pdf',
    time: '3 days ago',
    unread: false,
    group: 'Earlier',
    actions: [
      { label: 'Open File', primary: true }
    ]
  },
  {
    id: 11,
    type: 'meeting',
    category: 'Team',
    icon: '📹',
    title: 'Meeting Reminder',
    message: 'UI Review Meeting starts in 15 minutes.',
    time: 'Just now',
    unread: true,
    group: 'Today',
    actions: [
      { label: 'Join Meeting', primary: true }
    ]
  }
];

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState('All');

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const filteredNotifications = activeTab === 'All' 
    ? notifications 
    : notifications.filter(n => n.category === activeTab);

  // Group notifications
  const grouped = filteredNotifications.reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, typeof notifications>);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          type="button" 
          className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 relative transition-colors duration-200 outline-none"
        >
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[380px] p-0 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-0 font-bold px-1.5 py-0">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={markAllAsRead}
                className="text-xs font-bold text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition-colors flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            </div>
          </div>
          
          <Tabs defaultValue="All" onValueChange={setActiveTab}>
            <TabsList className="h-8 w-full bg-slate-200/50 dark:bg-slate-800 p-0.5 grid grid-cols-5 gap-1 rounded-lg">
              {['All', 'Tasks', 'Projects', 'Team', 'System'].map(tab => (
                <TabsTrigger 
                  key={tab} 
                  value={tab}
                  className="text-[10px] font-bold rounded-md px-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-sm"
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="h-[400px]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-slate-400">
              <Bell className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm font-medium">No notifications found.</p>
            </div>
          ) : (
            <div className="p-2 space-y-4">
              {['Today', 'Yesterday', 'Earlier'].map(groupName => {
                const groupItems = grouped[groupName];
                if (!groupItems || groupItems.length === 0) return null;
                
                return (
                  <div key={groupName} className="space-y-1">
                    <div className="px-3 py-1.5 flex items-center sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur z-10">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{groupName}</span>
                    </div>
                    {groupItems.map(notification => (
                      <div 
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={cn(
                          "relative p-3 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group cursor-pointer",
                          notification.unread ? "bg-orange-50/50 dark:bg-orange-900/10" : ""
                        )}
                      >
                        {notification.unread && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-r-full" />
                        )}
                        <div className="flex gap-3">
                          <div className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base",
                            notification.unread ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700" : "bg-slate-100 dark:bg-slate-800/50 grayscale opacity-70"
                          )}>
                            {notification.icon}
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn(
                                "text-sm font-bold truncate",
                                notification.unread ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                              )}>
                                {notification.title}
                              </p>
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">{notification.time}</span>
                            </div>
                            <p className={cn(
                              "text-xs font-medium leading-relaxed",
                              notification.unread ? "text-slate-600 dark:text-slate-300" : "text-slate-500 dark:text-slate-400"
                            )}>
                              {notification.message}
                            </p>
                            
                            {notification.priority && (
                              <Badge variant="outline" className="mt-1 text-[9px] border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:bg-rose-900/20 font-bold uppercase tracking-wider">
                                Priority: {notification.priority}
                              </Badge>
                            )}

                            {notification.actions && (
                              <div className="flex items-center gap-2 mt-3">
                                {notification.actions.map((action, i) => (
                                  <Button 
                                    key={i}
                                    variant={action.primary ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                      "h-7 text-xs font-bold rounded-lg px-3",
                                      action.primary ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                    )}
                                    onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 grid grid-cols-3 gap-1">
          <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View All
          </Button>
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg">
            <Settings className="mr-1.5 h-3.5 w-3.5" /> Settings
          </Button>
        </div>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
