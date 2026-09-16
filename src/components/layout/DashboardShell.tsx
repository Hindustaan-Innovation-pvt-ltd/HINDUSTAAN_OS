import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Flag,
  Clock,
  BarChart2,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Info,
  CalendarDays,
  Mic,
  Trophy,
  Users,
  Settings,
  ChevronDown,
  User,
  ChevronRight,
  LifeBuoy,
  CalendarRange,
  PanelLeftClose,
  PanelLeftOpen,
  UserCircle, Shield, Sliders, Building, Lock, Link, BellRing, Megaphone, Mail, ShieldCheck, Activity, FileText, History
} from 'lucide-react';
import AttendanceHistoryModal from '../attendance/AttendanceHistoryModal';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { GlobalSearch } from '../../features/dashboard/components/GlobalSearch';
import { NotificationBell } from '../dashboard/NotificationBell';
import { EmployeeNotificationBell } from '../dashboard/EmployeeNotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/lib/auth';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BrandLogo } from '@/components/ui/BrandLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { getBrowserCoordinates } from '@/lib/geo';

const employeeNavigation = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'My Tasks', icon: CheckSquare },
  { name: 'Work Logs', icon: Clock },
  { name: 'Attendance Logs', icon: History },
  { name: 'Leave Management', icon: CalendarRange },
  { name: 'Projects', icon: FolderKanban },
  // { name: 'Milestones', icon: Flag },
  { name: 'Settings', icon: Settings },
];

const managerNavigation = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Projects', icon: FolderKanban },
  { name: 'Tasks', icon: CheckSquare },
  { name: 'Gantt Timeline', icon: CalendarDays },
  { name: 'Progress Tracker', icon: BarChart2 },
  { name: 'Work Logs', icon: Clock },
  { name: 'Attendance Logs', icon: History },
  { name: 'Leave Management', icon: CalendarRange },
  { name: 'Team Members', icon: Users },
  { name: 'Email Logs', icon: Mail },
  {
    name: 'Workspace Settings',
    icon: Building,
    items: [
      { name: 'General', id: 'Workspace Settings - General', icon: Settings },
      { name: 'Security & Access', id: 'Workspace Settings - Security & Access', icon: ShieldCheck },
      { name: 'Appearance', id: 'Workspace Settings - Appearance', icon: Settings }
    ]
  },
  { name: 'Settings', icon: Settings },
];

const adminNavigationGroups = [
  { name: 'Dashboard', icon: LayoutDashboard },
  {
    name: 'Organization Overview',
    icon: Building,
    items: [
      { name: 'Projects', icon: FolderKanban },
      { name: 'Tasks', icon: CheckSquare },
      { name: 'Team Members', icon: Users },
      { name: 'Attendance Logs', icon: History },
      { name: 'Gantt Timeline', icon: CalendarDays },
      { name: 'Leave Management', icon: CalendarRange }
    ]
  },
  {
    name: 'User Management',
    icon: Users,
    items: [
      { name: 'Interns', icon: User },
      { name: 'Managers', icon: UserCircle },
      { name: 'Roles & Permissions', icon: Shield },
    ]
  },
  {
    name: 'Workspace Settings',
    icon: Settings,
    items: [
      { name: 'General', id: 'Workspace Settings - General', icon: Settings },
      { name: 'Security & Access', id: 'Workspace Settings - Security & Access', icon: ShieldCheck },
      { name: 'Appearance', id: 'Workspace Settings - Appearance', icon: Settings }
    ]
  },
  {
    name: 'Notifications',
    icon: Bell,
    badge: 3,
    items: [
      { name: 'System Notifications', icon: BellRing },
      { name: 'Announcement Center', icon: Bell },
      { name: 'Email Logs', icon: Mail },
      { name: 'Delivery Channels', icon: Settings },
    ]
  },
  {
    name: 'Activity Logs',
    icon: FileText,
    items: [
      { name: 'Activity Logs', id: 'Activity Logs', icon: FileText }
    ]
  },
  {
    name: 'Profile',
    icon: User,
    items: [
      { name: 'My Profile', icon: UserCircle },
    ]
  }
];


import { toast } from 'sonner';
import api from '@/lib/api';

const SidebarContent = ({ isDark, currentView, role, onNavigate, setSidebarOpen, activeNavigation, onSignOut, sidebarWidth, startResizing, isMobile, toggleSidebar }: any) => {
  const { user } = useUser();
  const userName = user?.name || 'Loading...';
  const userInitials = userName !== 'Loading...' ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '';
  const userRole = user?.role || role;
  const avatarUrl = user?.avatar;

  const collapsed = !isMobile && sidebarWidth < 150;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    if (activeNavigation) {
      const parentGroup = activeNavigation.find((item: any) => 
        item.items && item.items.some((sub: any) => currentView === (sub.id || sub.name))
      );
      if (parentGroup) {
        setOpenGroups(prev => ({ ...prev, [parentGroup.name]: true }));
      }
    }
  }, [currentView, activeNavigation]);

  const toggleGroup = (groupName: string) => {
    if (collapsed && !isMobile) {
      toggleSidebar();
    }
    setOpenGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };
  const handleCheckInOut = async (type: 'checkin' | 'checkout') => {
    try {
      let payload: Record<string, any> = {};
      if (type === 'checkin') {
        try {
          const coords = await getBrowserCoordinates();
          payload = { latitude: coords.latitude, longitude: coords.longitude };
        } catch (geoErr: any) {
          toast.error(geoErr.message || 'Location access is required for attendance check-in.');
          return;
        }
      }
      const res = await api.post(`/auth/${type}`, payload);
      if (res.data?.success) {
        toast.success(res.data.message);
        try {
          const uId = user?.id || 'default';
          localStorage.removeItem(`manager_dashboard_data_${uId}`);
          localStorage.removeItem(`intern_dashboard_data_${uId}`);
          localStorage.removeItem('manager_dashboard_data');
          localStorage.removeItem('intern_dashboard_data');
        } catch (e) {}
        window.dispatchEvent(new Event('auth_status_changed'));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${type}`);
    }
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground overflow-hidden relative">
      {/* Branding Badge */}
      <div className={cn("flex shrink-0 items-center border-b border-sidebar-border py-4 relative", collapsed ? "justify-center px-0 h-22.5 flex-col gap-2" : "justify-between px-4 min-h-22.5")}>
        <div className="flex items-center group cursor-pointer transition-all duration-300 hover:scale-[1.03]" onClick={() => onNavigate('Dashboard')}>
          {collapsed ? (
            <BrandLogo variant="minimized" />
          ) : (
            <BrandLogo variant="sidebar" />
          )}
        </div>

        {!isMobile && (
          <div
            onMouseDown={startResizing}
            className="absolute -right-1 top-0 bottom-0 h-screen w-2 cursor-col-resize z-40 flex items-center justify-center group"
          >
            <div className="h-16 w-1 rounded-full bg-sidebar-border opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        {isMobile && (
          <button
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Vertical Navigation Rows */}
      <div className="flex flex-1 flex-col overflow-y-auto py-4 px-3 custom-scrollbar">
        <style>{`.custom-scrollbar::-webkit-scrollbar{width:4px;display:none}.custom-scrollbar:hover::-webkit-scrollbar{display:block}.custom-scrollbar::-webkit-scrollbar-thumb{background:var(--sidebar-border);border-radius:10px}`}</style>
        <nav className="flex-1 space-y-1">
          <TooltipProvider delayDuration={0}>
            {activeNavigation.map((item: any) => {
              const Icon = item.icon;
              const hasSubItems = !!item.items;
              const isCurrent = currentView === item.name || (hasSubItems && item.items.some((sub: any) => currentView === sub.name));
              const isGroupOpen = openGroups[item.name];

              const NavItemContent = (
                <div
                  onClick={() => {
                    if (hasSubItems) {
                      toggleGroup(item.name);
                    } else {
                      onNavigate(item.name);
                      if (isMobile) setSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    "group flex items-center justify-between font-medium rounded-lg transition-all duration-200 py-2.5 relative w-full cursor-pointer",
                    collapsed ? "justify-center px-0 h-11 mb-1" : "px-3",
                    isCurrent && !hasSubItems
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-xs"
                      : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <div className="flex items-center overflow-hidden">
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors duration-200",
                        !collapsed && "mr-3",
                        isCurrent && !hasSubItems ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="truncate text-sm whitespace-nowrap overflow-hidden"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                  {!collapsed && hasSubItems && (
                    <ChevronRight className={cn("h-4 w-4 shrink-0 text-sidebar-foreground/50 transition-transform duration-200", isGroupOpen && "rotate-90")} />
                  )}

                  {item.badge && !collapsed && !hasSubItems && (
                    <Badge variant="destructive" className="ml-auto">{item.badge}</Badge>
                  )}
                  {item.badge && collapsed && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </div>
              );

              return (
                <div key={item.name} className="w-full mb-1">
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{NavItemContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={16} className="bg-popover text-popover-foreground border-border font-medium z-50">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    NavItemContent
                  )}

                  <AnimatePresence>
                    {hasSubItems && isGroupOpen && !collapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden ml-4 pl-4 border-l-2 border-sidebar-border space-y-1 mt-1"
                      >
                        {item.items.map((subItem: any) => {
                          const SubIcon = subItem.icon;
                          const isSubCurrent = currentView === (subItem.id || subItem.name);
                          return (
                            <button
                              key={subItem.name}
                              onClick={() => {
                                onNavigate(subItem.id || subItem.name);
                                if (isMobile) setSidebarOpen(false);
                              }}
                              className={cn(
                                "flex items-center font-medium rounded-lg transition-all duration-200 py-2 px-3 w-full text-xs cursor-pointer",
                                isSubCurrent
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-xs"
                                  : "text-sidebar-foreground/70 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
                              )}
                            >
                              <SubIcon className={cn("h-4 w-4 mr-3 shrink-0", isSubCurrent ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60")} />
                              <span className="truncate whitespace-nowrap overflow-hidden">{subItem.name}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </TooltipProvider>
        </nav>
      </div>

      {/* User Profile Card */}
      <div className="shrink-0 p-3 mb-2 mt-auto border-t border-sidebar-border sticky bottom-0 bg-sidebar z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn("w-full flex items-center rounded-lg transition-all hover:bg-sidebar-accent outline-none group p-2 cursor-pointer", collapsed ? "justify-center" : "justify-between")}>
              <div className="flex items-center text-left">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-muted-foreground font-bold shrink-0 overflow-hidden border-2 border-sidebar-border group-hover:border-primary transition-colors shadow-xs">
                  {avatarUrl ? <img src={avatarUrl} className="h-full w-full object-cover" alt={userName} /> : userInitials}
                </div>

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 overflow-hidden whitespace-nowrap"
                    >
                      <p className="text-sm font-semibold text-sidebar-foreground truncate">
                        {userName}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground capitalize truncate">
                        {userRole}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {!collapsed && (
                <ChevronDown className="h-4 w-4 text-sidebar-foreground/50 group-hover:text-sidebar-foreground transition-colors shrink-0 ml-2" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={collapsed ? "end" : "center"}
            side="top"
            sideOffset={12}
            className="w-64 bg-popover text-popover-foreground border border-border shadow-xl rounded-xl p-1.5 animate-in fade-in zoom-in-95 duration-200"
          >
            {userRole !== 'admin' && onNavigate && (
              <DropdownMenuItem
                onClick={() => {
                  onNavigate('My Profile');
                  if (isMobile) setSidebarOpen(false);
                }}
                className="cursor-pointer text-popover-foreground focus:bg-accent focus:text-accent-foreground text-sm font-medium rounded-lg flex items-center justify-between py-2.5 transition-colors mb-1"
              >
                My Profile
                <User className="h-4 w-4 ml-2 text-muted-foreground" />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => handleCheckInOut('checkin')}
              className="cursor-pointer text-emerald-600 dark:text-emerald-400 focus:bg-emerald-500/10 text-sm font-medium rounded-lg flex items-center justify-between py-2.5 transition-colors mb-1"
            >
              Check In
              <Activity className="h-4 w-4 ml-2" />
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleCheckInOut('checkout')}
              className="cursor-pointer text-amber-600 dark:text-amber-400 focus:bg-amber-500/10 text-sm font-medium rounded-lg flex items-center justify-between py-2.5 transition-colors mb-1"
            >
              Check Out
              <Activity className="h-4 w-4 ml-2" />
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onNavigate('Attendance Logs');
                if (isMobile) setSidebarOpen(false);
              }}
              className="cursor-pointer text-primary focus:bg-primary/10 text-sm font-medium rounded-lg flex items-center justify-between py-2.5 transition-colors mb-1"
            >
              Attendance Logs
              <History className="h-4 w-4 ml-2" />
            </DropdownMenuItem>
            {onSignOut && (
              <DropdownMenuItem
                onClick={onSignOut}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive text-sm font-medium rounded-lg flex items-center justify-between py-2.5 transition-colors"
              >
                Logout
                <LogOut className="h-4 w-4 ml-2" />
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AttendanceHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  );
};

interface DashboardShellProps {
  isMinimized?: boolean;
  onMinimizeChange?: (minimized: boolean) => void;
  onSignOut?: () => void;
}

export default function DashboardShell({
  isMinimized = false,
  onMinimizeChange = () => { },
  onSignOut
}: DashboardShellProps) {
  const { user } = useUser();
  const role = user?.role || getCurrentUser()?.role || localStorage.getItem('role') || 'employee';
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    switch (view) {
      case 'My Profile': navigate('/profile'); break;
      case 'Edit Profile': navigate('/profile/edit'); break;
      case 'Leave Management': navigate(role === 'admin' ? '/admin/leave-management' : role === 'manager' ? '/manager/leave-management' : '/employee/leave'); break;
      case 'Subscription Management': navigate('/admin/subscriptions'); break;
      case 'Dashboard': navigate(`/${role}/dashboard`); break;
      case 'Tasks':
      case 'My Tasks': navigate('/tasks'); break;
      case 'Projects': navigate('/projects'); break;
      case 'Gantt Timeline':
      case 'Timeline': navigate('/timeline'); break;
      case 'Progress Tracker':
      case 'Performance': navigate('/performance'); break;
      case 'Milestones': navigate('/milestones'); break;
      case 'Settings':
      case 'Workspace Settings - Appearance': navigate('/settings'); break;
      case 'Interns': navigate('/admin/users/interns'); break;
      case 'Managers': navigate('/admin/users/managers'); break;
      case 'Team Members':
      case 'Team': navigate('/team'); break;
      case 'Work Logs': navigate('/work-logs'); break;
      case 'Attendance Logs': navigate('/attendance-logs'); break;
      case 'Roles & Permissions': navigate('/roles'); break;
      case 'Workspace Settings - General': navigate('/admin/workspace/general'); break;
      case 'Workspace Settings - Security & Access': navigate('/security'); break;
      case 'System Notifications': navigate('/admin/workspace/notifications'); break;
      case 'Announcement Center': navigate('/admin/workspace/announcements');
        break;
      case 'Email Logs': navigate(role === 'manager' ? '/manager/email' : '/admin/workspace/email'); break;
      case 'Delivery Channels': navigate('/admin/workspace/channels'); break;
      case 'Activity Logs': navigate('/admin/workspace/activity-logs'); break;
      default: navigate(`/${role}/dashboard`);
    }
  };

  const currentView = React.useMemo(() => {
    const path = location.pathname;
    if (path === '/profile') return 'My Profile';
    if (path === '/profile/edit') return 'Edit Profile';
    if (path === '/admin/leave-management' || path === '/admin/leaves' || path === '/manager/leave-management' || path === '/employee/leave') return 'Leave Management';
    if (path === '/admin/subscriptions') return 'Subscription Management';
    if (path === '/tasks') return role === 'employee' ? 'My Tasks' : 'Tasks';
    if (path === '/projects') return 'Projects';
    if (path === '/timeline') return 'Gantt Timeline';
    if (path === '/performance') return 'Progress Tracker';
    if (path === '/milestones') return 'Milestones';
    if (path === '/settings') return 'Settings';
    if (path === '/team') return 'Team Members';
    if (path === '/work-logs') return 'Work Logs';
    if (path === '/attendance-logs' || path === '/attendance') return 'Attendance Logs';
    if (path === '/roles') return 'Roles & Permissions';
    if (path === '/admin/users/interns') return 'Interns';
    if (path === '/admin/users/managers') return 'Managers';
    if (path === '/admin/workspace/general') return 'Workspace Settings - General';
    if (path === '/security') return 'Workspace Settings - Security & Access';
    if (path === '/admin/workspace/notifications') return 'System Notifications';
    if (path === '/admin/workspace/announcements') return 'Announcement Center';
    if (path === '/admin/workspace/email' || path === '/manager/email') return 'Email Logs';
    if (path === '/admin/workspace/channels') return 'Delivery Channels';
    if (path === '/admin/workspace/activity-logs' || path === '/admin/activity-logs') return 'Activity Logs';
    return 'Dashboard';
  }, [location.pathname, role]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(isMinimized ? 88 : 280);
  const [isDragging, setIsDragging] = useState(false);
  const isResizing = useRef(false);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = React.useCallback(() => {
    if (isResizing.current) {
      isResizing.current = false;
      setIsDragging(false);
      document.body.style.cursor = 'default';
      setSidebarWidth(prev => {
        if (prev < 150) {
          onMinimizeChange(true);
          return 88;
        }
        onMinimizeChange(false);
        return prev > 400 ? 400 : prev;
      });
    }
  }, [onMinimizeChange]);

  const resize = React.useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing.current) {
        let newWidth = mouseMoveEvent.clientX;
        if (newWidth < 88) newWidth = 88;
        if (newWidth > 400) newWidth = 400;
        setSidebarWidth(newWidth);
      }
    },
    []
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  useEffect(() => {
    if (!isResizing.current) {
      setSidebarWidth(isMinimized ? 88 : 280);
    }
  }, [isMinimized]);

  const toggleSidebar = React.useCallback(() => {
    setSidebarWidth(prev => {
      if (prev < 150) {
        onMinimizeChange(false);
        return 280;
      }
      onMinimizeChange(true);
      return 88;
    });
  }, [onMinimizeChange]);

  const { theme, toggleTheme, accentColor } = useTheme();
  const isDark = theme === 'dark';

  // Apply accent color to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    ['theme-orange', 'theme-blue', 'theme-emerald', 'theme-rose', 'theme-purple', 'theme-cosmic'].forEach(c => root.classList.remove(c));
    root.classList.add(`theme-${accentColor}`);
  }, [accentColor]);

  // Ensure sidebar open state resets on resize to desktop/tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeNavigation = role === 'admin' ? adminNavigationGroups : (role === 'manager' ? managerNavigation : employeeNavigation);

  const getMainModuleName = () => {
    for (const group of activeNavigation) {
      if (group.name === currentView) return group.name;
      const g = group as any;
      if (g.items) {
        for (const subItem of g.items) {
          if (subItem.name === currentView || subItem.id === currentView) {
            return group.name;
          }
        }
      }
    }
    return currentView;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      {/* Left Desktop Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={isDragging ? { duration: 0 } : { duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex inset-y-0 left-0 z-40 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0 relative select-none"
      >
        <SidebarContent isDark={isDark} currentView={currentView} role={role} onNavigate={handleNavigate} setSidebarOpen={setSidebarOpen} activeNavigation={activeNavigation} onSignOut={onSignOut} sidebarWidth={sidebarWidth} startResizing={startResizing} isMobile={false} toggleSidebar={toggleSidebar} />

        {/* Toggle Button (Desktop) - Seamlessly attached outside */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-7 top-8 z-50 flex h-8 w-7 items-center justify-center rounded-r-md rounded-l-none border border-l-0 border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-xs cursor-pointer transition-all duration-200"
          title={sidebarWidth < 150 ? "Expand Sidebar" : "Shrink Sidebar"}
        >
          {sidebarWidth < 150 ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </motion.div>

      {/* Main Context Body */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0 w-full max-w-full">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 flex flex-col justify-center border-b border-border bg-background/80 px-4 shadow-xs backdrop-blur-md sm:px-6 lg:px-8 md:h-16 h-auto py-3 md:py-0">
          <div className="flex items-center justify-between w-full gap-x-4">
            <div className="flex items-center gap-x-4">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-foreground hover:bg-accent"
                  >
                    <span className="sr-only">Open sidebar</span>
                    <Menu className="h-6 w-6" aria-hidden="true" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" showCloseButton={false} className="p-0 w-72 sm:w-80 border-r border-sidebar-border bg-sidebar flex flex-col">
                  <SidebarContent isDark={isDark} currentView={currentView} role={role} onNavigate={handleNavigate} setSidebarOpen={setSidebarOpen} activeNavigation={activeNavigation} onSignOut={onSignOut} sidebarWidth={280} startResizing={() => { }} isMobile={true} toggleSidebar={toggleSidebar} />
                </SheetContent>
              </Sheet>

              {/* Navbar Logo for Mobile/Tablet */}
              <div className="flex items-center lg:hidden cursor-pointer transition-all duration-300 hover:scale-[1.03]" onClick={() => handleNavigate('Dashboard')}>
                <BrandLogo variant="sidebar" />
              </div>

              {/* Greeting Desktop */}
              <div className="hidden lg:flex items-center">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {getMainModuleName()}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6">
              {/* Desktop Global Search */}
              <div className="relative hidden md:block w-64" onClick={() => setIsSearchOpen(true)}>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div
                  className="flex items-center justify-between h-9 w-full rounded-lg border border-input bg-muted/40 pl-10 pr-3 text-sm text-muted-foreground hover:bg-muted/70 transition-all shadow-xs cursor-text"
                >
                  <span className="truncate">Search workspace...</span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              >
                <span className="sr-only">Toggle dark mode</span>
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {role === 'admin' ? (
                <NotificationBell onNavigate={handleNavigate} />
              ) : (
                <EmployeeNotificationBell onNavigate={handleNavigate} />
              )}
            </div>
          </div>

          {/* Mobile Search Input */}
          <div className="mt-3 md:hidden w-full relative" onClick={() => setIsSearchOpen(true)}>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="flex items-center justify-between h-10 w-full rounded-lg border border-input bg-muted/40 pl-10 pr-3 text-sm text-muted-foreground hover:bg-muted/70 transition-all cursor-text shadow-xs">
              <span className="truncate">Search workspace...</span>
            </div>
          </div>
        </header>

        {/* Viewport Container */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-background relative z-0">
          <div className="mx-auto max-w-screen-2xl flex-1 w-full overflow-x-hidden px-4 py-6 md:px-6 lg:px-8">
            <Outlet />
          </div>
          {/* Global Footer */}
          <footer className="w-full py-4 px-6 mt-auto border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium text-muted-foreground bg-card/40 shrink-0">
            <p>Hindustaan Innovations Pvt. Ltd.</p>
            <p>&copy; 2026 Hindustaan Innovation All rights reserved</p>
          </footer>
        </main>

        <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </div>
    </div>
  );
}
