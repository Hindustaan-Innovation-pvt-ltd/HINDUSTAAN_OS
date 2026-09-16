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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WorkLogTableProps {
  logs: any[];
  currentUser: { role: string; id: string; name: string };
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onRowClick: (log: any) => void;
}

const getProjectColor = (project: string) => {
  const p = project.toLowerCase();
  if (p.includes('frontend')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
  if (p.includes('design')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
  if (p.includes('internal')) return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
  if (p.includes('backend')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  if (p.includes('meeting')) return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30';
  return 'bg-muted text-muted-foreground border-border';
};

const getHoursColor = (hours: number) => {
  if (hours < 2) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
  if (hours <= 4) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
  return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
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
    <TableHead 
      onClick={() => handleSort(sortKey)}
      className="px-4 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/70 transition-colors select-none"
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className={cn("h-3.5 w-3.5", sortConfig?.key === sortKey ? "text-primary" : "text-muted-foreground/50")} />
      </div>
    </TableHead>
  );

  if (logs.length === 0) {
    return (
      <div className="bg-card text-card-foreground rounded-2xl p-12 border border-border shadow-xs text-center">
        <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-foreground font-semibold text-lg">No work logs found matching your criteria.</p>
        <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or date range.</p>
      </div>
    );
  }

  return (
    <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[750px]">
          <TableHeader className="bg-muted/50 border-b border-border">
            <TableRow>
              <SortableHeader label="Employee" sortKey="name" />
              <SortableHeader label="Date" sortKey="rawDate" />
              <SortableHeader label="Project" sortKey="project" />
              <TableHead className="px-4 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Task</TableHead>
              <SortableHeader label="Hours" sortKey="hours" />
              <SortableHeader label="Status" sortKey="status" />
              <TableHead className="px-4 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {paginatedLogs.map((log) => (
              <TableRow 
                key={log.id} 
                onClick={() => onRowClick(log)}
                className="hover:bg-muted/50 transition-colors cursor-pointer group border-b border-border/60"
              >
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border shadow-2xs">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {log.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {log.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {log.date}
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", getProjectColor(log.project))}>
                    {log.project}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 min-w-[250px]">
                  <p className="text-sm font-medium text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors">
                    {log.task}
                  </p>
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <Badge variant="outline" className={cn("text-xs font-bold tracking-wider px-2 py-0.5", getHoursColor(log.hours))}>
                    <Clock className="h-3 w-3 mr-1" /> {log.hours.toFixed(1)}h
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap">
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
                    log.status === 'Approved' ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" :
                    log.status === 'Pending' ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" :
                    "bg-destructive/10 text-destructive border-destructive/30"
                  )}>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-popover text-popover-foreground border-border rounded-xl shadow-xl">
                      <DropdownMenuItem onClick={() => onRowClick(log)} className="cursor-pointer font-medium">
                        <Eye className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer font-medium">
                        <Edit className="h-4 w-4 mr-2" /> Edit Log
                      </DropdownMenuItem>
                      
                      {(currentUser.role === 'manager' || currentUser.role === 'admin') && (
                        <>
                          <DropdownMenuSeparator className="bg-border" />
                          {log.status !== 'Approved' && (
                            <DropdownMenuItem onClick={() => onStatusChange(log.id, 'Approved')} className="cursor-pointer text-emerald-600 dark:text-emerald-400 font-semibold">
                              <CheckCircle className="h-4 w-4 mr-2" /> Approve
                            </DropdownMenuItem>
                          )}
                          {log.status !== 'Rejected' && (
                            <DropdownMenuItem onClick={() => onStatusChange(log.id, 'Rejected')} className="cursor-pointer text-destructive font-semibold">
                              <XCircle className="h-4 w-4 mr-2" /> Reject
                            </DropdownMenuItem>
                          )}
                        </>
                      )}
                      
                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem onClick={() => onDelete(log.id)} className="cursor-pointer text-destructive font-semibold">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-foreground">{Math.min(currentPage * itemsPerPage, sortedLogs.length)}</span> of <span className="font-semibold text-foreground">{sortedLogs.length}</span> results
          </p>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 rounded-lg text-xs font-medium cursor-pointer"
            >
              Prev
            </Button>
            <div className="flex items-center px-3 font-semibold text-sm text-foreground">
              {currentPage} / {totalPages}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 rounded-lg text-xs font-medium cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
