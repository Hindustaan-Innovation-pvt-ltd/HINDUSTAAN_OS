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
  ChevronLeft,
  ChevronRight,
  LifeBuoy
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/lib/auth';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BrandLogo } from '@/components/ui/BrandLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const employeeNavigation = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'My Tasks', icon: CheckSquare },
  { name: 'Work Logs', icon: Clock },
  { name: 'Daily Standup', icon: Mic },
  { name: 'My Projects', icon: FolderKanban },
  { name: 'Milestones', icon: Flag },
  { name: 'My Performance', icon: Trophy },
  { name: 'Help & Support', icon: LifeBuoy },
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
  { name: 'Help & Support', icon: LifeBuoy },
];


import { useUser } from '@/context/UserContext';

const SidebarContent = ({ isDark, currentView, role, onNavigate, setSidebarOpen, activeNavigation, onSignOut, sidebarWidth, startResizing, isMobile }: any) => {
  const { user } = useUser();
  const userName = user?.name || 'Loading...';
  const userInitials = userName !== 'Loading...' ? userName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '';
  const userRole = user?.role || role;
  const avatarUrl = user?.avatar;

  const collapsed = !isMobile && sidebarWidth < 150;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-900 overflow-hidden relative">
        {/* Branding Badge */}
        <div className={cn("flex shrink-0 items-center border-b border-slate-100 dark:border-[#5B7CFF]/20 py-4 relative", collapsed ? "justify-center px-0 h-[90px]" : "justify-between px-4 min-h-[90px]")}>
          <div className="flex items-center group cursor-pointer transition-all duration-300 hover:scale-[1.03]" onClick={() => onNavigate('Dashboard')}>
            {collapsed ? (
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#5B7CFF] to-[#A855F7] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(91,124,255,0.4)]">
                P
              </div>
            ) : (
              <BrandLogo variant="sidebar" />
            )}
          </div>
          
          {!isMobile && (
            <div 
              onMouseDown={startResizing}
              className="absolute -right-[4px] top-0 bottom-0 h-screen w-[8px] cursor-col-resize z-50 flex items-center justify-center group"
            >
              <div className="h-16 w-[4px] rounded-full bg-[#5B7CFF]/50 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          {isMobile && (
            <button 
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Vertical Navigation Rows */}
        <div className="flex flex-1 flex-col overflow-y-auto py-6 px-3 custom-scrollbar">
          <style>{`.custom-scrollbar::-webkit-scrollbar{width:4px;display:none}.custom-scrollbar:hover::-webkit-scrollbar{display:block}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(91,124,255,0.3);border-radius:10px}`}</style>
          <nav className="flex-1 space-y-1">
            <TooltipProvider delayDuration={0}>
              {activeNavigation.map((item: { name: string, icon: any }) => {
                const Icon = item.icon;
                const isCurrent = currentView === item.name;
                
                const NavItem = (
                  <button
                    key={item.name}
                    onClick={() => {
                      onNavigate(item.name);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    className={cn(
                      "group flex items-center font-bold rounded-xl transition-all duration-300 py-3 relative w-full",
                      collapsed ? "justify-center px-0 h-12 mb-1" : "px-3",
                      isCurrent
                        ? "bg-gradient-to-r from-[#5B7CFF] to-[#A855F7] text-white shadow-[0_0_15px_rgba(91,124,255,0.4)]"
                        : "text-slate-600 dark:text-slate-400 hover:bg-[#5B7CFF]/10 dark:hover:bg-[#5B7CFF]/10 hover:text-[#5B7CFF] dark:hover:text-[#5B7CFF]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors duration-200",
                        !collapsed && "mr-3",
                        isCurrent ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-[#5B7CFF] dark:group-hover:text-[#5B7CFF]"
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
                  </button>
                );

                if (collapsed) {
                  return (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={16} className="bg-slate-900 text-white border-slate-800 font-medium">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return NavItem;
              })}
            </TooltipProvider>
          </nav>
        </div>

        {/* User Profile Card */}
        <div className="shrink-0 p-3 mb-2 mt-auto border-t border-slate-100 dark:border-[#5B7CFF]/20 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn("w-full flex items-center rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 outline-none group p-2", collapsed ? "justify-center" : "justify-between")}>
                <div className="flex items-center text-left">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold shrink-0 overflow-hidden border-2 border-white dark:border-slate-800 group-hover:border-[#5B7CFF] transition-colors shadow-sm">
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
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {userName}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize truncate">
                          {userRole}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {!collapsed && (
                  <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors shrink-0 ml-2" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align={collapsed ? "end" : "center"} 
              side="top" 
              sideOffset={12} 
              className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 shadow-2xl rounded-[18px] p-2 animate-in fade-in zoom-in-95 duration-200"
            >
              <DropdownMenuItem 
                onClick={() => { onNavigate('My Profile'); setSidebarOpen(false); }}
                className="cursor-pointer text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800/80 text-sm font-medium rounded-xl flex items-center py-2.5 transition-colors"
              >
                <User className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => { onNavigate('Settings'); setSidebarOpen(false); }}
                className="cursor-pointer text-slate-700 dark:text-slate-200 focus:bg-slate-100 dark:focus:bg-slate-800/80 text-sm font-medium rounded-xl flex items-center py-2.5 transition-colors"
              >
                <Settings className="h-4 w-4 mr-3 text-slate-500 dark:text-slate-400" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200/50 dark:bg-slate-700/50 my-1 -mx-2" />
              {onSignOut && (
                <DropdownMenuItem 
                  onClick={onSignOut}
                  className="cursor-pointer text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400 text-sm font-medium rounded-xl flex items-center justify-between py-2.5 transition-colors"
                >
                  Logout
                  <LogOut className="h-4 w-4 ml-2" />
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
    </div>
  );
};

interface DashboardShellProps {
  children: React.ReactNode;
  currentView?: string;
  role?: string;
  onNavigate?: (view: string) => void;
  isMinimized?: boolean;
  onMinimizeChange?: (minimized: boolean) => void;
  onSignOut?: () => void;
}

export default function DashboardShell({ 
  children,
  currentView = 'Time Tracking',
  role = 'employee',
  onNavigate = () => {},
  isMinimized = false,
  onMinimizeChange = () => {},
  onSignOut
}: DashboardShellProps) {
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
  
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

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

  const activeNavigation = role === 'manager' ? managerNavigation : employeeNavigation;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50 dark:bg-slate-950 transition-colors duration-500">
      {/* Left Desktop Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={isDragging ? { duration: 0 } : { duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex inset-y-0 left-0 z-50 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60 shrink-0 relative select-none"
      >
        <SidebarContent isDark={isDark} currentView={currentView} role={role} onNavigate={onNavigate} setSidebarOpen={setSidebarOpen} activeNavigation={activeNavigation} onSignOut={onSignOut} sidebarWidth={sidebarWidth} startResizing={startResizing} isMobile={false} />
      </motion.div>

      {/* Main Context Body */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0 w-full max-w-full">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-[#5B7CFF]/20 bg-white/80 dark:bg-[#050816]/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
          
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="-m-2.5 p-2.5 text-slate-700 dark:text-slate-200 lg:hidden"
              >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] border-r border-slate-200 dark:border-[#5B7CFF]/20 flex flex-col">
              <SidebarContent isDark={isDark} currentView={currentView} role={role} onNavigate={onNavigate} setSidebarOpen={setSidebarOpen} activeNavigation={activeNavigation} onSignOut={onSignOut} sidebarWidth={280} startResizing={() => {}} isMobile={true} />
            </SheetContent>
          </Sheet>

          {/* Navbar Logo for Mobile/Tablet */}
          <div className="flex items-center lg:hidden ml-2 cursor-pointer transition-all duration-300 hover:scale-[1.03]" onClick={() => onNavigate('Dashboard')}>
            <BrandLogo variant="sidebar" />
          </div>

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
        <main className="flex-1 overflow-y-auto flex flex-col bg-slate-50/50 dark:bg-transparent relative z-0">
          <div className="mx-auto max-w-screen-2xl flex-1 w-full max-w-full overflow-x-hidden px-4 py-6 md:px-6 lg:px-8">
            {children}
          </div>
          {/* Global Footer */}
          <footer className="w-full py-4 px-6 mt-auto border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-white/30 dark:bg-slate-950/30 shrink-0">
            <p>Hindustaan Innovations Pvt. Ltd.</p>
            <p>&copy; 2026 Project OS All rights reserved</p>
          </footer>
        </main>

        <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </div>
    </div>
  );
}
