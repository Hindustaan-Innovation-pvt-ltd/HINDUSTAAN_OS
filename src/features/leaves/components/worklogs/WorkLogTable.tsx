import React, { useState, useMemo } from 'react';
import { 
  MoreHorizontal, CheckCircle, XCircle, Trash2, Edit, Eye,
  ArrowUpDown, Clock, Calendar as CalendarIcon, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface WorkLogTableProps {
  logs: any[];
  currentUser: { role: string; id: string; name: string };
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onRowClick: (log: any) => void;
}

const getProjectColor = (project: string) => {
  const p = project.toLowerCase();
  if (p.includes('frontend')) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
  if (p.includes('design')) return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30';
  if (p.includes('internal')) return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30';
  if (p.includes('backend')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
  if (p.includes('meeting')) return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
};

const getHoursColor = (hours: number) => {
  if (hours < 2) return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
  if (hours <= 4) return 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/30';
  return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
};

export const WorkLogTable = ({ logs, currentUser, onStatusChange, onDelete, onRowClick }: WorkLogTableProps) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const sortedLogs = useMemo(() => {
    let sortable = [...logs];
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'date' || sortConfig.key === 'rawDate') {
          valA = new Date(a.rawDate || a.date).getTime();
          valB = new Date(b.rawDate || b.date).getTime();
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [logs, sortConfig]);

  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const paginatedLogs = sortedLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => (
    <th 
      onClick={() => handleSort(sortKey)}
      className="px-4 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors select-none"
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className={cn("h-3.5 w-3.5", sortConfig?.key === sortKey ? "text-indigo-500" : "text-slate-300 dark:text-slate-600")} />
      </div>
    </th>
  );

  if (logs.length === 0) {
    return (
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-12 border border-slate-200/60 dark:border-slate-800 shadow-sm text-center">
        <FileText className="h-12 w-12 text-slate-400 dark:text-slate-600 opacity-50 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">No work logs found matching your criteria.</p>
        <p className="text-sm text-slate-400 mt-1">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-200/60 dark:border-slate-800">
            <tr>
              <SortableHeader label="Employee" sortKey="name" />
              <SortableHeader label="Date" sortKey="rawDate" />
              <SortableHeader label="Project" sortKey="project" />
              <th className="px-4 py-4 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Task</th>
              <SortableHeader label="Hours" sortKey="hours" />
              <SortableHeader label="Status" sortKey="status" />
              <th className="px-4 py-4 text-right text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {paginatedLogs.map((log) => (
              <tr 
                key={log.id} 
                onClick={() => onRowClick(log)}
                className="hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-white dark:border-slate-800 shadow-sm">
                      <AvatarFallback className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                        {log.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {log.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {log.date}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", getProjectColor(log.project))}>
                    {log.project}
                  </Badge>
                </td>
                <td className="px-4 py-3 min-w-[250px]">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 line-clamp-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {log.task}
                  </p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant="outline" className={cn("text-xs font-black tracking-wider px-2 py-0.5", getHoursColor(log.hours))}>
                    <Clock className="h-3 w-3 mr-1" /> {log.hours.toFixed(1)}h
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2 py-0.5",
                    log.status === 'Approved' ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" :
                    log.status === 'Pending' ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30" :
                    "bg-rose-50 text-rose-600 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30"
                  )}>
                    {log.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
                      <DropdownMenuItem onClick={() => onRowClick(log)} className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                        <Eye className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                        <Edit className="h-4 w-4 mr-2" /> Edit Log
                      </DropdownMenuItem>
                      
                      {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
                        <>
                          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                          {log.status !== 'Approved' && (
                            <DropdownMenuItem onClick={() => onStatusChange(log.id, 'Approved')} className="cursor-pointer text-emerald-600 font-bold">
                              <CheckCircle className="h-4 w-4 mr-2" /> Approve
                            </DropdownMenuItem>
                          )}
                          {log.status !== 'Rejected' && (
                            <DropdownMenuItem onClick={() => onStatusChange(log.id, 'Rejected')} className="cursor-pointer text-rose-600 font-bold">
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      
                      <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                      <DropdownMenuItem onClick={() => onDelete(log.id)} className="cursor-pointer text-rose-600 font-bold">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-200/60 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing <span className="font-bold text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, sortedLogs.length)}</span> of <span className="font-bold text-slate-900 dark:text-white">{sortedLogs.length}</span> results
          </p>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
            >
              Prev
            </Button>
            <div className="flex items-center px-3 font-bold text-sm text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
