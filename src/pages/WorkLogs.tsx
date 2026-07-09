import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock, Download, Plus, Search, Calendar as CalendarIcon,
  CheckCircle2, Filter, MoreHorizontal, FileEdit, Trash2, X, CheckCircle, AlertCircle, XCircle, Play, Square, Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { GLOBAL_LOGS, INITIAL_TASKS } from '@/data/mockData';

const ONLINE_TEAM_MEMBERS = [
  { id: 'u-1', name: 'Amanda Smith', initials: 'AS', role: 'Frontend Lead', task: 'Component Refactoring', project: 'Frontend Core', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' },
  { id: 'u-2', name: 'Rahul Sharma', initials: 'RS', role: 'Backend Developer', task: 'Database Optimization', project: 'Backend Core', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' },
  { id: 'u-3', name: 'Priya Patel', initials: 'PP', role: 'Technical Writer', task: 'API Documentation V2', project: 'Documentation', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
  { id: 'u-4', name: 'Tanvy Pandey', initials: 'TP', role: 'Intern Developer', task: 'Kanban Board & Work Logs', project: 'Frontend Core', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' },
];

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

export default function WorkLogs({ session }: { session?: any }) {
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('work_logs_list');
    return saved ? JSON.parse(saved) : GLOBAL_LOGS;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isActiveMembersModalOpen, setIsActiveMembersModalOpen] = useState(false);

  const isMounted = React.useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    localStorage.setItem('work_logs_list', JSON.stringify(logs));
  }, [logs]);

  // Resolve current user based on session
  const role = session?.user?.user_metadata?.role || 'manager';
  const email = session?.user?.email || 'user@hindustaan.in';
  
  let currentUserId = 'manager-1';
  let currentUserName = 'Admin User';
  
  if (role === 'intern') {
    if (email.toLowerCase().includes('amanda')) {
      currentUserId = 'u-1';
      currentUserName = 'Amanda Smith';
    } else if (email.toLowerCase().includes('rahul')) {
      currentUserId = 'u-2';
      currentUserName = 'Rahul Sharma';
    } else if (email.toLowerCase().includes('priya')) {
      currentUserId = 'u-3';
      currentUserName = 'Priya Patel';
    } else {
      currentUserId = 'u-4';
      currentUserName = 'Tanvy Pandey';
    }
  }

  const currentUser = {
    id: currentUserId,
    role: role as 'manager' | 'intern',
    name: currentUserName
  };

  // Active session timer for logged-in user
  const loginKey = `login_time_${currentUser.id}`;
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (currentUser.role !== 'intern') return;

    let loginTime = localStorage.getItem(loginKey);
    if (!loginTime) {
      loginTime = Date.now().toString();
      localStorage.setItem(loginKey, loginTime);
    }
    const startTime = parseInt(loginTime, 10);

    const updateTimer = () => {
      setSecondsElapsed(Math.floor((Date.now() - startTime) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentUser.id, loginKey, currentUser.role]);

  const [activeSessions, setActiveSessions] = useState<{ [key: string]: { time: number; isOnline: boolean } }>({});

  useEffect(() => {
    const teamMembers = [
      { id: 'u-1', defaultOffset: 2 * 3600 + 15 * 60 + 30 }, // Amanda Smith
      { id: 'u-2', defaultOffset: 3600 + 45 * 60 + 12 },    // Rahul Sharma
      { id: 'u-3', defaultOffset: 45 * 60 + 5 },            // Priya Patel
      { id: 'u-4', defaultOffset: 3 * 3600 + 10 * 60 + 40 } // Tanvy Pandey
    ];

    const updateSessions = () => {
      const sessions: { [key: string]: { time: number; isOnline: boolean } } = {};
      teamMembers.forEach(member => {
        const isCurrentUserIntern = member.id === currentUser.id && currentUser.role === 'intern';
        const loginTimeStr = localStorage.getItem(`login_time_${member.id}`);
        
        if (isCurrentUserIntern) {
          sessions[member.id] = { time: secondsElapsed, isOnline: true };
        } else if (loginTimeStr) {
          const startTime = parseInt(loginTimeStr, 10);
          sessions[member.id] = { time: Math.floor((Date.now() - startTime) / 1000), isOnline: true };
        } else {
          sessions[member.id] = { time: member.defaultOffset, isOnline: true };
        }
      });
      setActiveSessions(sessions);
    };

    updateSessions();
    const interval = setInterval(updateSessions, 1000);
    return () => clearInterval(interval);
  }, [currentUser.id, secondsElapsed, currentUser.role]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const userBaseLogs = useMemo(() => {
    return currentUser.role === 'intern'
      ? logs.filter((log: any) => log.name.toLowerCase().includes(currentUser.name.split(' ')[0].toLowerCase()))
      : logs;
  }, [logs, currentUser]);

  const filteredLogs = useMemo(() => {
    return userBaseLogs.filter((log: any) => {
      const matchesSearch = log.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [userBaseLogs, searchQuery, statusFilter]);

  const handleStatusChange = (id: string, newStatus: string) => {
    setLogs(logs.map((log: any) => log.id === id ? { ...log, status: newStatus } : log));
  };

  const handleDelete = (id: string) => {
    setLogs(logs.filter((log: any) => log.id !== id));
  };

  const totalHours = useMemo(() => userBaseLogs.reduce((acc: number, log: any) => acc + log.hours, 0), [userBaseLogs]);
  const pendingHours = useMemo(() => userBaseLogs.filter((l: any) => l.status === 'Pending').reduce((acc: number, log: any) => acc + log.hours, 0), [userBaseLogs]);

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8 relative animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Work Logs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review team timesheets and efficiently manage logged hours.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 hidden sm:flex">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 w-48"
            />
          </div>

          {currentUser.role === 'manager' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">
                  <Filter className="h-4 w-4 mr-2 text-slate-400" />
                  {statusFilter === 'All' ? 'Status: All' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DropdownMenuItem onClick={() => setStatusFilter('All')} className="cursor-pointer font-medium">All Statuses</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Approved')} className="cursor-pointer font-medium text-emerald-600">Approved</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Pending')} className="cursor-pointer font-medium text-amber-600">Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('Rejected')} className="cursor-pointer font-medium text-rose-600">Rejected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hidden md:flex">
            <Download className="h-4 w-4 mr-2 text-slate-400" /> Export
          </Button>
        </div>
      </div>

      {/* Employee Active Session Timer Widget */}
      {currentUser.role === 'intern' && (
        <div className="mb-8 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/15 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/20 rounded-2xl border border-white/20">
              <Clock className="h-7 w-7 text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Active Work Session</h3>
              <p className="text-xs text-orange-100 mt-0.5 font-medium">Session started automatically upon login.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="flex flex-col text-right">
              <span className="text-3xl font-black font-mono tracking-widest">{formatTime(secondsElapsed)}</span>
              <span className="text-[10px] font-bold text-orange-100 uppercase tracking-widest mt-1">Logged Time Today</span>
            </div>
            <div className="h-10 w-[1px] bg-white/20 hidden md:block" />
            <div className="px-3.5 py-1.5 bg-white/20 border border-white/20 rounded-xl flex items-center gap-1.5 text-xs font-bold">
              <span className="h-2.5 w-2.5 bg-emerald-400 rounded-full animate-ping" />
              <span>Session Running</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Employee Sessions (Manager Only) */}
      {currentUser.role === 'manager' && (
        <div className="mb-8">
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-4 flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
            Live Active Sessions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {ONLINE_TEAM_MEMBERS.map(member => {
              const sessionInfo = activeSessions[member.id];
              const isOnline = !!sessionInfo?.isOnline;
              const sessionTime = sessionInfo?.time || 0;

              // Resolve in-progress task for this member
              const savedTasksStr = localStorage.getItem('hindustaan_tasks_list');
              const allTasks = savedTasksStr ? JSON.parse(savedTasksStr) : INITIAL_TASKS;
              const inProgressTask = allTasks.find((t: any) => 
                (t.assignee_id === member.id || t.assignee_name.toLowerCase().includes(member.name.split(' ')[0].toLowerCase())) &&
                t.status === 'In Progress'
              );

              const currentTaskName = inProgressTask ? inProgressTask.title : 'No active task';
              const currentProjectName = inProgressTask ? inProgressTask.project_tag : 'Idle';

              return (
                <div 
                  key={member.id} 
                  className={cn(
                    "bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all relative overflow-hidden group",
                    !isOnline && "opacity-75 bg-slate-50/50 dark:bg-slate-900/40"
                  )}
                >
                  {isOnline ? (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 transform origin-left transition-transform duration-1000" />
                  ) : (
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800" />
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className={cn("h-10 w-10 border-2 border-white dark:border-slate-900", member.color)}>
                          <AvatarFallback className="font-bold">{member.initials}</AvatarFallback>
                        </Avatar>
                        {isOnline ? (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
                        ) : (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-slate-300 dark:bg-slate-600 rounded-full border-2 border-white dark:border-slate-900" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{member.name}</h4>
                        <p className="text-xs font-semibold text-slate-500">{member.role}</p>
                      </div>
                    </div>
                    {isOnline ? (
                      <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center space-x-1.5 animate-pulse">
                        <Timer className="h-3.5 w-3.5" />
                        <span className="text-sm font-bold font-mono tracking-wider">{formatTime(sessionTime)}</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 rounded-lg flex items-center space-x-1.5">
                        <Timer className="h-3.5 w-3.5 text-slate-300 dark:text-slate-650" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Offline</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Working On</span>
                      <Badge variant="secondary" className={cn(
                        "text-[10px] uppercase font-black tracking-wider",
                        isOnline && inProgressTask
                          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      )}>
                        {currentProjectName}
                      </Badge>
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{currentTaskName}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="text-sm font-bold opacity-90">Total Hours (All Time)</h3>
            <div className="p-2 bg-white/20 rounded-lg"><Clock className="h-5 w-5 text-white" /></div>
          </div>
          <p className="text-4xl font-black relative z-10">{totalHours.toFixed(1)}h</p>
          <p className="text-xs font-semibold text-blue-100 mt-2 relative z-10">Across {logs.length} logged entries</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Pending Approvals</h3>
            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg"><CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-500" /></div>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white">{pendingHours.toFixed(1)}h</p>
          <p className="text-xs font-semibold text-slate-500 mt-2">Requires manager review</p>
        </div>

        <div 
          onClick={() => setIsActiveMembersModalOpen(true)}
          className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-emerald-500/30 group/card active:scale-98"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 group-hover/card:text-emerald-500 transition-colors">Active Members</h3>
            <div className="flex -space-x-2">
              <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-900 shadow-sm"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">TP</AvatarFallback></Avatar>
              <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-900 shadow-sm"><AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">RS</AvatarFallback></Avatar>
              <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-900 shadow-sm"><AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-bold">AS</AvatarFallback></Avatar>
            </div>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white">4</p>
          <p className="text-xs font-semibold text-slate-500 mt-2">Contributing this sprint</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-sm z-10 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Hours</th>
                {currentUser.role === 'manager' && (
                  <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
                )}
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={currentUser.role === 'manager' ? 7 : 6} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-slate-900 shadow-sm">
                          <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">{log.initials}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{log.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 w-fit px-2.5 py-1 rounded-md">
                        <CalendarIcon className="h-3.5 w-3.5 text-blue-500" /> {log.date}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full shadow-sm">{log.project}</span>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {log.task}
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-sm font-black shadow-sm">
                        {log.hours.toFixed(1)}h
                      </span>
                    </td>
                    {currentUser.role === 'manager' && (
                      <td className="p-4 text-right">
                        <Badge variant="outline" className={cn(
                          "font-bold uppercase tracking-wider border-0 shadow-sm",
                          log.status === 'Approved' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
                          log.status === 'Pending' && "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
                          log.status === 'Rejected' && "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                        )}>
                          {log.status}
                        </Badge>
                      </td>
                    )}
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {currentUser.role === 'manager' && log.status !== 'Approved' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(log.id, 'Approved')} className="cursor-pointer text-emerald-600 font-medium">
                              <CheckCircle className="h-4 w-4 mr-2" /> Approve Log
                            </DropdownMenuItem>
                          )}
                          {currentUser.role === 'manager' && log.status !== 'Rejected' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(log.id, 'Rejected')} className="cursor-pointer text-rose-600 font-medium">
                              <XCircle className="h-4 w-4 mr-2" /> Reject Log
                            </DropdownMenuItem>
                          )}
                          {currentUser.role === 'manager' && (
                            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                          )}
                          <DropdownMenuItem onClick={() => handleDelete(log.id)} className="cursor-pointer text-red-600 font-medium">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete Entry
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Members Modal */}
      {isActiveMembersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsActiveMembersModalOpen(false)}
          />
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Team Members</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Currently contributing in the workspace</p>
              </div>
              <button 
                onClick={() => setIsActiveMembersModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[300px] overflow-y-auto space-y-4">
              {ONLINE_TEAM_MEMBERS.map((member) => {
                const isOnline = activeSessions[member.id]?.isOnline;
                return (
                <div key={member.id} className={cn("flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 border border-transparent hover:border-slate-100 dark:hover:border-slate-850 transition-all", !isOnline && "opacity-75 grayscale")}>
                  <div className="flex items-center gap-3">
                    <Avatar className={cn("h-9 w-9 border-2 border-white dark:border-slate-900", member.color)}>
                      <AvatarFallback className="font-bold text-xs">{member.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{member.name}</span>
                      <span className="text-xs text-slate-500 font-medium">{member.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isOnline ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Online</span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="text-xs font-bold text-slate-500">Offline</span>
                      </>
                    )}
                  </div>
                </div>
              )})}
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button onClick={() => setIsActiveMembersModalOpen(false)} className="rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-white font-bold px-4 py-2 cursor-pointer">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
