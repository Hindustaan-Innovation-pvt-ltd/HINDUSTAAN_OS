import React, { useState, useMemo } from 'react';
import {
  Clock, Download, Plus, Search, Calendar as CalendarIcon,
  CheckCircle2, Filter, MoreHorizontal, FileEdit, Trash2, X, CheckCircle, AlertCircle, XCircle
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

const INITIAL_LOGS = [
  { id: '1', name: 'Anurag', initials: 'TP', date: 'Oct 12, 2026', hours: 4.5, task: 'Dashboard Analytics UI', project: 'Frontend Core', status: 'Approved' },
  { id: '2', name: 'Rahul Sharma', initials: 'RS', date: 'Oct 12, 2026', hours: 6.0, task: 'Redis Caching Setup', project: 'Backend', status: 'Approved' },
  { id: '3', name: 'Amanda Smith', initials: 'AS', date: 'Oct 11, 2026', hours: 3.5, task: 'Tailwind v4 Migration', project: 'Frontend Core', status: 'Pending' },
  { id: '4', name: 'Priya Patel', initials: 'PP', date: 'Oct 11, 2026', hours: 8.0, task: 'API Documentation', project: 'Documentation', status: 'Approved' },
  { id: '5', name: 'Preeti', initials: 'TP', date: 'Oct 10, 2026', hours: 5.0, task: 'Create User Onboarding', project: 'Product', status: 'Rejected' },
];

export default function WorkLogs({ session }: { session?: any }) {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({ name: '', project: '', task: '', hours: '', date: '' });

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.task.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.project.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  const handleStatusChange = (id: string, newStatus: string) => {
    setLogs(logs.map(log => log.id === id ? { ...log, status: newStatus } : log));
  };

  const handleDelete = (id: string) => {
    setLogs(logs.filter(log => log.id !== id));
  };

  const handleSaveLog = () => {
    if (!newLog.name || !newLog.project || !newLog.task || !newLog.hours) return;
    const initials = newLog.name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().substring(0, 2) || 'U';
    const log = {
      id: Date.now().toString(),
      name: newLog.name,
      initials,
      date: newLog.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      hours: parseFloat(newLog.hours),
      task: newLog.task,
      project: newLog.project,
      status: 'Pending'
    };
    setLogs([log, ...logs]);
    setIsLogModalOpen(false);
    setNewLog({ name: '', project: '', task: '', hours: '', date: '' });
  };

  const totalHours = useMemo(() => logs.reduce((acc, log) => acc + log.hours, 0), [logs]);
  const pendingHours = useMemo(() => logs.filter(l => l.status === 'Pending').reduce((acc, log) => acc + log.hours, 0), [logs]);

  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8 relative">
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

          <Button variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hidden md:flex">
            <Download className="h-4 w-4 mr-2 text-slate-400" /> Export
          </Button>
          <Button onClick={() => setIsLogModalOpen(true)} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20">
            <Plus className="h-4 w-4 mr-2" /> Log Hours
          </Button>
        </div>
      </div>

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

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Active Members</h3>
            <div className="flex -space-x-2">
              <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-900"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold">TP</AvatarFallback></Avatar>
              <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-900"><AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">RS</AvatarFallback></Avatar>
              <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-900"><AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-bold">AS</AvatarFallback></Avatar>
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
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
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
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                          {log.status !== 'Approved' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(log.id, 'Approved')} className="cursor-pointer text-emerald-600 font-medium">
                              <CheckCircle className="h-4 w-4 mr-2" /> Approve Log
                            </DropdownMenuItem>
                          )}
                          {log.status !== 'Rejected' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(log.id, 'Rejected')} className="cursor-pointer text-rose-600 font-medium">
                              <XCircle className="h-4 w-4 mr-2" /> Reject Log
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
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

      {/* Log Hours Modal Overlay */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Log Work Hours</h3>
                <p className="text-sm font-semibold text-slate-500 mt-1">Submit your timesheet entry.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsLogModalOpen(false)} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Employee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anurag Dubey"
                  value={newLog.name}
                  onChange={(e) => setNewLog({ ...newLog, name: e.target.value })}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Project</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Core"
                  value={newLog.project}
                  onChange={(e) => setNewLog({ ...newLog, project: e.target.value })}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Task Description</label>
                <input
                  type="text"
                  placeholder="What did you work on?"
                  value={newLog.task}
                  onChange={(e) => setNewLog({ ...newLog, task: e.target.value })}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Hours</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    step="0.5"
                    value={newLog.hours}
                    onChange={(e) => setNewLog({ ...newLog, hours: e.target.value })}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</label>
                  <input
                    type="text"
                    placeholder="Oct 12, 2026"
                    value={newLog.date}
                    onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                    className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-transparent font-bold hover:bg-slate-50 dark:hover:bg-slate-800" onClick={() => setIsLogModalOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20" onClick={handleSaveLog}>
                Submit Log
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
