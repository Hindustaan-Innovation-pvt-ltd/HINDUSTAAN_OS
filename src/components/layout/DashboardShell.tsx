import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { GlobalSearch } from '../dashboard/GlobalSearch';
import { NotificationCenter } from '../dashboard/NotificationCenter';
import { EmployeeNotificationCenter } from '../dashboard/EmployeeNotificationCenter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const employeeNavigation = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'My Tasks', icon: CheckSquare },
  { name: 'Work Logs', icon: Clock },
  { name: 'Daily Standup', icon: Mic },
  { name: 'My Projects', icon: FolderKanban },
  { name: 'Milestones', icon: Flag },
  { name: 'My Performance', icon: Trophy },
  { name: 'My Profile', icon: User },
  { name: 'Settings', icon: Settings },
];

const managerNavigation = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Projects', icon: FolderKanban },
  { name: 'Tasks', icon: CheckSquare },
  { name: 'Gantt Timeline', icon: CalendarDays },
  { name: 'Progress Tracker', icon: BarChart2 },
  { name: 'Work Logs', icon: Clock },
  { name: 'Daily Standups', icon: Mic },
  { name: 'Contribution Scores', icon: Trophy },
  { name: 'Team Members', icon: Users },
  { name: 'Settings', icon: Settings },
];

export default function DashboardShell({ 
  children,
  currentView = 'Time Tracking',
  role = 'employee',
  onNavigate = () => {},
  isMinimized = false,
  onMinimizeChange = () => {},
  onSignOut
}: { 
  children: React.ReactNode;
  currentView?: string;
  role?: string;
  onNavigate?: (view: string) => void;
  isMinimized?: boolean;
  onMinimizeChange?: (minimized: boolean) => void;
  onSignOut?: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar_width');
    if (saved) return parseInt(saved, 10);
    return 288; // Default w-72 equivalent
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sidebarWidthRef = React.useRef(sidebarWidth);
  sidebarWidthRef.current = sidebarWidth;

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Sync the initial minimized state to the parent based on the initial sidebarWidth
  useEffect(() => {
    onMinimizeChange(sidebarWidth <= 200);
  }, [onMinimizeChange]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = e.clientX;
      if (newWidth < 200) {
        newWidth = 200;
      } else if (newWidth > 480) {
        newWidth = 480;
      }
      setSidebarWidth(newWidth);
      onMinimizeChange(newWidth <= 200);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem('sidebar_width', sidebarWidthRef.current.toString());
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onMinimizeChange]);

  const activeNavigation = role === 'manager' ? managerNavigation : employeeNavigation;
  const isSidebarCollapsed = sidebarWidth <= 200;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950 transition-colors duration-500">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Desktop Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60 lg:static lg:translate-x-0 relative",
          isDragging ? "transition-none" : "transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          isMobile && "w-72"
        )}
        style={{
          width: !isMobile ? `${sidebarWidth}px` : undefined,
        }}
      >
        {/* Branding Badge */}
        <div className={cn(
          "flex min-h-[90px] shrink-0 items-center border-b border-slate-100 dark:border-slate-800 justify-between",
          isSidebarCollapsed ? "px-4 justify-center py-3" : "px-6 py-4 lg:justify-start"
        )}>
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onNavigate('Dashboard')}>
            <img
              src={isDark ? "/icon-dark.png" : "/icon.png"}
              alt="Hindustaan OS"
              className={cn(
                "h-auto object-contain transition-all duration-200 group-hover:scale-105 group-hover:drop-shadow-[0_0_12px_rgba(255,153,0,0.5)] shrink-0 rounded-full",
                isSidebarCollapsed ? "w-10 md:w-11 lg:w-12" : "w-[46px] md:w-[52px] lg:w-[60px]"
              )}
            />
            {!isSidebarCollapsed && (
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight animate-in fade-in duration-200">
                Hindustaan <span className="text-green-500">OS</span>
              </h1>
            )}
          </div>
          <button 
            className="lg:hidden text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Vertical Navigation Rows */}
        <div className={cn(
          "flex flex-1 flex-col overflow-y-auto py-6",
          isSidebarCollapsed ? "px-2" : "px-4"
        )}>
          <nav className="flex-1 space-y-1">
            {activeNavigation.map((item) => {
              const isCurrent = currentView === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    onNavigate(item.name);
                    setSidebarOpen(false);
                  }}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={cn(
                    "w-full group flex items-center text-sm font-medium rounded-xl transition-all duration-200",
                    isSidebarCollapsed ? "px-3 py-3 justify-center" : "px-3 py-2.5",
                    isCurrent
                      ? "bg-amber-50 text-amber-700 dark:bg-white dark:text-slate-900"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white dark:hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors duration-200",
                      !isSidebarCollapsed && "mr-3",
                      isCurrent ? "text-amber-600 dark:text-slate-900" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-900"
                    )}
                    aria-hidden="true"
                  />
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card */}
        <div className={cn(
          "shrink-0 border-t border-slate-200 dark:border-slate-700/60",
          isSidebarCollapsed ? "p-2" : "p-4"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40 outline-none focus:ring-2 focus:ring-orange-500/20 group",
                isSidebarCollapsed ? "p-1.5 justify-center" : "p-2 justify-between"
              )}>
                <div className="flex items-center text-left">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold shadow-sm ring-2 ring-white dark:ring-slate-900 shrink-0">
                    {role === 'manager' ? 'AG' : 'TP'}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                        {role === 'manager' ? 'Aakash Gupta' : 'Tanvy Pandey'}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{role === 'manager' ? 'Manager' : 'Employee'}</p>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side={isSidebarCollapsed ? "right" : "top"} sideOffset={12} className="w-64 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xl rounded-xl p-2">
              <DropdownMenuLabel className="font-normal p-0">
                <div className="flex flex-col space-y-1 p-2 pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                      <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <AvatarFallback className="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold">
                          {role === 'manager' ? 'AG' : 'TP'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                        {role === 'manager' ? 'Aakash Gupta' : 'Tanvy Pandey'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {role === 'manager' ? 'manager@hindustaan.in' : 'employee@hindustaan.in'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center mt-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-500/20">
                      {role === 'manager' ? 'Manager' : 'Employee'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 -mx-2" />
              <DropdownMenuItem 
                onClick={() => { onNavigate('My Profile'); setSidebarOpen(false); }}
                className="cursor-pointer text-slate-700 dark:text-slate-300 focus:bg-slate-50 dark:focus:bg-slate-800 text-sm font-bold rounded-lg flex items-center py-2.5 mt-1"
              >
                <User className="h-4 w-4 mr-3 text-slate-400" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => { onNavigate('Settings'); setSidebarOpen(false); }}
                className="cursor-pointer text-slate-700 dark:text-slate-300 focus:bg-slate-50 dark:focus:bg-slate-800 text-sm font-bold rounded-lg flex items-center py-2.5"
              >
                <Settings className="h-4 w-4 mr-3 text-slate-400" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 -mx-2" />
              {onSignOut && (
                <DropdownMenuItem 
                  onClick={onSignOut}
                  className="cursor-pointer text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400 text-sm font-bold rounded-lg flex items-center justify-between py-2.5 mb-1"
                >
                  Logout
                  <LogOut className="h-4 w-4 ml-2" />
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Resize Handle */}
        {!isMobile && (
          <div
            onMouseDown={startResizing}
            className="absolute top-0 -right-1 bottom-0 w-2 cursor-col-resize group/resize z-50"
          >
            <div className={cn(
              "w-1 h-full mx-auto transition-colors duration-200",
              isDragging ? "bg-orange-500" : "bg-transparent group-hover/resize:bg-orange-500/30"
            )} />
          </div>
        )}
      </div>

      {/* Main Context Body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
          
          <button
            type="button"
            className="-m-2.5 p-2.5 text-slate-700 dark:text-slate-200 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>

          <div className="flex flex-1 items-center justify-between gap-x-4 self-stretch lg:gap-x-6">
            
            {/* Greeting */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white hidden sm:block">
                {currentView}
              </h1>
            </div>

            {/* Global Search & Notifications */}
            <div className="flex items-center gap-x-4 lg:gap-x-6 w-full sm:w-auto">
              
              <div className="relative w-full sm:w-64" onClick={() => setIsSearchOpen(true)}>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </div>
                <div
                  className="flex items-center justify-between h-9 w-full rounded-full border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 pl-10 pr-3 text-sm text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm cursor-text cursor-pointer"
                >
                  <span className="truncate">Search workspace...</span>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-x-4 lg:gap-x-6">
                
                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="-m-2.5 p-2.5 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 relative transition-colors duration-200"
                >
                  <span className="sr-only">Toggle dark mode</span>
                  {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                </button>

                {role === 'manager' ? <NotificationCenter /> : <EmployeeNotificationCenter />}
              </div>
              
            </div>
          </div>
        </header>

        {/* Viewport Container */}
        <main className="flex-1 overflow-y-auto flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
          <div className="mx-auto max-w-screen-2xl flex-1 w-full">
            {children}
          </div>
          {/* Global Footer */}
          <footer className="w-full py-4 px-6 mt-auto border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-white/30 dark:bg-slate-950/30 shrink-0">
            <p>Hindustaan Innovations Pvt. Ltd.</p>
            <p>&copy; 2026 @hindustaanOS All rights reserved</p>
          </footer>
        </main>

        <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </div>
    </div>
  );
}
