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
  User
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

const internNavigation = [
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
  role = 'intern',
  onNavigate = () => {},
  onSignOut
}: { 
  children: React.ReactNode;
  currentView?: string;
  role?: string;
  onNavigate?: (view: string) => void;
  onSignOut?: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const activeNavigation = role === 'manager' ? managerNavigation : internNavigation;

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
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/60 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Branding Badge */}
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-100 dark:border-slate-800 justify-between lg:justify-start">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 dark:bg-orange-500/100 text-white shadow-sm">
              <Compass className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Hindustaan OS</span>
          </div>
          <button 
            className="lg:hidden text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Vertical Navigation Rows */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
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
                  className={cn(
                    "w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200",
                    isCurrent
                      ? "bg-amber-50 text-amber-700 dark:bg-white dark:text-slate-900"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white dark:hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 shrink-0 transition-colors duration-200",
                      isCurrent ? "text-amber-600 dark:text-slate-900" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-900"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Card */}
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-700/60 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between rounded-xl p-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/40 outline-none focus:ring-2 focus:ring-orange-500/20 group">
                <div className="flex items-center text-left">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 font-bold shadow-sm ring-2 ring-white dark:ring-slate-900">
                    {role === 'manager' ? 'AG' : 'TP'}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      {role === 'manager' ? 'Aakash Gupta' : 'Tanvy Pandey'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{role === 'manager' ? 'Manager' : 'Employee'}</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-xl rounded-xl">
              <DropdownMenuLabel className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
              {onSignOut && (
                <>
                  <DropdownMenuItem 
                    onClick={onSignOut}
                    className="cursor-pointer text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400 text-sm font-bold rounded-lg flex items-center justify-between"
                  >
                    Logout
                    <LogOut className="h-4 w-4 ml-2" />
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
