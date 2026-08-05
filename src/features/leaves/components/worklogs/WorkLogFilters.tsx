import React from 'react';
import { Search, Calendar as CalendarIcon, Filter, Download, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WorkLogFiltersProps {
  isEmployee: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  projectFilter: string;
  setProjectFilter: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  employeeFilter: string;
  setEmployeeFilter: (val: string) => void;
  dateFilter: Date | undefined;
  setDateFilter: (val: Date | undefined) => void;
  uniqueProjects: string[];
  uniqueEmployees: string[];
  onExport?: (type: 'csv' | 'pdf') => void;
}

export const WorkLogFilters = ({
  isEmployee,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  projectFilter,
  setProjectFilter,
  roleFilter,
  setRoleFilter,
  employeeFilter,
  setEmployeeFilter,
  dateFilter,
  setDateFilter,
  uniqueProjects,
  uniqueEmployees,
  onExport
}: WorkLogFiltersProps) => {

  const hasActiveFilters = dateFilter || searchQuery || projectFilter !== 'All' || statusFilter !== 'All' || employeeFilter !== 'All' || roleFilter !== 'All';

  return (
    <div className={cn(
      "bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/60 dark:border-slate-800 shadow-sm transition-all rounded-2xl p-4 sm:p-5 flex flex-col gap-4 mb-6"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm sm:text-base tracking-tight">
          <div className="h-6 w-6 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Filter className="h-3.5 w-3.5" />
          </div>
          Logs Filter
        </h3>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              type="text"
              placeholder="Search tasks, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
              <DropdownMenuItem className="font-semibold cursor-pointer" onClick={() => onExport?.('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem className="font-semibold cursor-pointer" onClick={() => onExport?.('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(
              "rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-300 justify-start hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors shadow-sm",
              "w-full sm:w-44 h-10"
            )}>
              <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
              {dateFilter ? format(dateFilter, "do MMMM yyyy") : <span>All Dates</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl" align="start">
            <CalendarComponent
              mode="single"
              selected={dateFilter}
              onSelect={setDateFilter}
              className="text-slate-900 dark:text-white rounded-2xl p-3"
            />
          </PopoverContent>
        </Popover>

        {!isEmployee && (
          <>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-36 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-indigo-500/20">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
                <SelectItem value="All" className="font-semibold">All Roles</SelectItem>
                <SelectItem value="manager" className="font-medium text-purple-600">Manager</SelectItem>
                <SelectItem value="intern" className="font-medium text-orange-600">Intern</SelectItem>
                <SelectItem value="employee" className="font-medium text-blue-600">Employee</SelectItem>
              </SelectContent>
            </Select>

            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-indigo-500/20">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
                <SelectItem value="My Logs" className="font-semibold text-indigo-600 dark:text-indigo-400">My Logs</SelectItem>
                <SelectItem value="All" className="font-semibold">All Employees</SelectItem>
                {uniqueEmployees.map(e => <SelectItem key={e} value={e} className="font-medium">{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-indigo-500/20">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
            <SelectItem value="All" className="font-semibold">All Projects</SelectItem>
            {uniqueProjects.map(p => <SelectItem key={p} value={p} className="font-medium">{p}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold focus:ring-indigo-500/20">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl">
            <SelectItem value="All" className="font-semibold">All Statuses</SelectItem>
            <SelectItem value="Approved" className="font-medium text-emerald-600">Approved</SelectItem>
            <SelectItem value="Pending" className="font-medium text-amber-600">Pending</SelectItem>
            <SelectItem value="Rejected" className="font-medium text-rose-600">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            onClick={() => {
              setDateFilter(undefined);
              setSearchQuery('');
              setProjectFilter('All');
              setStatusFilter('All');
              setRoleFilter('All');
              setEmployeeFilter('All');
            }}
            className="h-10 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold px-3 rounded-xl transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
