import React from 'react';
import { Clock, Download, Plus, Search, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const MOCK_LOGS = [
  { id: '1', name: 'Tanvy', initials: 'TP', date: 'Oct 12, 2026', hours: 4.5, task: 'Dashboard Analytics UI', project: 'Frontend Core', status: 'Approved' },
  { id: '2', name: 'Rahul Sharma', initials: 'RS', date: 'Oct 12, 2026', hours: 6.0, task: 'Redis Caching Setup', project: 'Backend', status: 'Approved' },
  { id: '3', name: 'Amanda Smith', initials: 'AS', date: 'Oct 11, 2026', hours: 3.5, task: 'Tailwind v4 Migration', project: 'Frontend Core', status: 'Pending' },
  { id: '4', name: 'Priya Patel', initials: 'PP', date: 'Oct 11, 2026', hours: 8.0, task: 'API Documentation', project: 'Documentation', status: 'Approved' },
  { id: '5', name: 'Tanvy', initials: 'TP', date: 'Oct 10, 2026', hours: 5.0, task: 'Create User Onboarding', project: 'Product', status: 'Approved' },
];

export default function WorkLogs({ session }: { session?: any }) {
  return (
    <div className="flex flex-col h-full w-full p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Work Logs</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Review team timesheets and logged hours.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-slate-900 px-3 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 hidden sm:flex">
            <Search className="h-4 w-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 w-48"
            />
          </div>
          <Button variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold">
            <Download className="h-4 w-4 mr-2 text-slate-400" /> Export CSV
          </Button>
          <Button className="h-10 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold">
            <Plus className="h-4 w-4 mr-2" /> Log Hours
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl p-6 text-white shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold opacity-90">Total Hours (This Week)</h3>
            <Clock className="h-5 w-5 opacity-70" />
          </div>
          <p className="text-4xl font-black">142.5h</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Pending Approvals</h3>
            <CheckCircle2 className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white">12.5h</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400">Active Members</h3>
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">ALL</AvatarFallback>
            </Avatar>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white">4</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Project</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Hours</th>
                <th className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {MOCK_LOGS.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-slate-900">
                        <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-xs">{log.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{log.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                      <CalendarIcon className="h-3.5 w-3.5" /> {log.date}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{log.project}</span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {log.task}
                  </td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                      {log.hours}h
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Badge variant="outline" className={cn(
                      "font-bold uppercase tracking-wider border-0",
                      log.status === 'Approved' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    )}>
                      {log.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
