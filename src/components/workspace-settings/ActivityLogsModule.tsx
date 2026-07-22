import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  FileText, CheckCircle2, AlertCircle, Clock, Search, RefreshCw, Download, 
  FileSpreadsheet, Filter, ChevronLeft, ChevronRight, Activity, Shield, Globe, Laptop, Server, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  role?: string;
  action: string;
  module: string;
  description?: string;
  httpMethod?: string;
  endpoint?: string;
  requestBody?: string;
  responseStatus?: number;
  executionTimeMs?: number;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  operatingSystem?: string;
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  targetUserId?: string;
  oldValue?: any;
  newValue?: any;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface LogStats {
  totalToday: number;
  successToday: number;
  failedToday: number;
  errorRate: number;
  activeModulesCount: number;
  avgExecutionTimeMs: number;
}

const MODULE_OPTIONS = [
  "All",
  "Authentication",
  "User Management",
  "Task Management",
  "Project Management",
  "Work Logs",
  "Daily Standups",
  "Notifications",
  "Workspace Settings",
  "API Activity",
  "Errors"
];

export const ActivityLogsModule: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<LogStats>({
    totalToday: 0,
    successToday: 0,
    failedToday: 0,
    errorRate: 0,
    activeModulesCount: 0,
    avgExecutionTimeMs: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedMethod, setSelectedMethod] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Reset pagination to page 1 whenever any filter selection changes
  useEffect(() => {
    setPage(1);
  }, [selectedModule, selectedRole, selectedMethod, selectedStatus, sortBy]);

  const fetchLogsAndStats = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search: debouncedSearch,
        module: selectedModule,
        role: selectedRole,
        httpMethod: selectedMethod,
        success: selectedStatus,
        sortOrder: sortBy
      });

      const [logsRes, statsRes] = await Promise.all([
        api.get(`/activity-logs?${queryParams.toString()}`),
        api.get('/activity-logs/stats')
      ]);

      if (logsRes.data && logsRes.data.success) {
        setLogs(logsRes.data.data || []);
        if (logsRes.data.pagination) {
          setTotalRecords(logsRes.data.pagination.total || 0);
          setTotalPages(logsRes.data.pagination.totalPages || 1);
        }
      }

      if (statsRes.data && statsRes.data.success) {
        setStats(statsRes.data.data || stats);
      }
    } catch (err: any) {
      console.error("Failed to load audit logs:", err);
      toast.error("Could not fetch audit logs. Verify permissions.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedModule, selectedRole, selectedMethod, selectedStatus, sortBy]);

  useEffect(() => {
    fetchLogsAndStats();
  }, [fetchLogsAndStats]);

  const handleRefresh = () => {
    fetchLogsAndStats();
    toast.success("Audit logs refreshed");
  };

  const handleExportCSV = async () => {
    try {
      toast.info("Preparing CSV export...");
      const res = await api.get('/activity-logs/export');
      if (!res.data || !res.data.data) throw new Error("No data returned");
      
      const records = res.data.data;
      if (records.length === 0) {
        toast.warning("No logs to export");
        return;
      }

      const headers = Object.keys(records[0]);
      const csvRows = [
        headers.join(','),
        ...records.map((row: any) => 
          headers.map(header => JSON.stringify(row[header] || '')).join(',')
        )
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV export downloaded");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export CSV");
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Preparing Excel worksheet export...");
      const res = await api.get('/activity-logs/export');
      if (!res.data || !res.data.data) throw new Error("No data returned");
      
      const records = res.data.data;
      if (records.length === 0) {
        toast.warning("No logs to export");
        return;
      }

      const headers = Object.keys(records[0]);
      let tableHtml = '<table border="1"><thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
      records.forEach((row: any) => {
        tableHtml += '<tr>' + headers.map(h => `<td>${row[h] || ''}</td>`).join('') + '</tr>';
      });
      tableHtml += '</tbody></table>';

      const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel worksheet downloaded");
    } catch (err) {
      console.error("Excel export error:", err);
      toast.error("Failed to export Excel");
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.info("Generating PDF audit report...");
      const res = await api.get('/activity-logs/export');
      if (!res.data || !res.data.data) throw new Error("No data returned");
      
      const records = res.data.data;
      if (records.length === 0) {
        toast.warning("No logs to export");
        return;
      }

      const doc = new jsPDF('landscape');
      doc.setFontSize(16);
      doc.text("Hindustaan OS - Centralized Audit Logs Report", 14, 18);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${records.length}`, 14, 25);

      const tableColumn = ["Timestamp", "User", "Role", "Module", "Action", "Method", "Status", "IP Address", "Execution"];
      const tableRows = records.map((log: any) => [
        log.Timestamp ? new Date(log.Timestamp).toLocaleString() : "",
        log.User || "N/A",
        log.Role || "N/A",
        log.Module || "N/A",
        log.Action || "N/A",
        log.Method || "N/A",
        log.Status || "N/A",
        log.IPAddress || "N/A",
        log.ExecutionTimeMs || "N/A"
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [30, 41, 59] }
      });

      doc.save(`audit_logs_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF audit report downloaded");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to generate PDF report");
    }
  };

  const getMethodBadgeStyle = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'POST': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'PUT':
      case 'PATCH': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'DELETE': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'Authentication': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50';
      case 'Task Management': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50';
      case 'Project Management': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/50';
      case 'Errors': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50';
      default: return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Centralized Activity & Audit Logs
              </h1>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Complete audit trail recording API traffic, authentication events, and administrative actions across Organization Overview.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin text-orange-500' : ''}`} />
            Refresh
          </Button>

          <Button 
            onClick={handleExportCSV} 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer shadow-sm"
          >
            <Download className="h-4 w-4 mr-1.5 text-blue-500" />
            CSV
          </Button>

          <Button 
            onClick={handleExportExcel} 
            variant="outline" 
            size="sm" 
            className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-500" />
            Excel
          </Button>

          <Button 
            onClick={handleExportPDF} 
            size="sm" 
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-orange-600 dark:hover:bg-orange-500 font-bold shadow-md cursor-pointer"
          >
            <FileText className="h-4 w-4 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Logs Today</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.totalToday.toLocaleString()}</h3>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {stats.successToday} successful operations
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Failure / Error Rate</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.errorRate}%</h3>
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {stats.failedToday} errors detected today
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Modules</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.activeModulesCount}</h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Monitored across Organization
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
              <Shield className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Response Time</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.avgExecutionTimeMs} ms</h3>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Non-blocking async persistence
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Server className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search logs by user, email, endpoint, IP address, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 focus:bg-white dark:focus:bg-slate-900 font-medium text-sm transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Module Filter */}
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="h-10 w-[170px] rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                <SelectValue placeholder="Module: All" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                {MODULE_OPTIONS.map(mod => (
                  <SelectItem key={mod} value={mod} className="font-medium text-xs">
                    {mod === "All" ? "All Modules" : mod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-10 w-[130px] rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs">
                <SelectValue placeholder="Role: All" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="All" className="font-medium text-xs">All Roles</SelectItem>
                <SelectItem value="admin" className="font-medium text-xs">Admin</SelectItem>
                <SelectItem value="manager" className="font-medium text-xs">Manager</SelectItem>
                <SelectItem value="intern" className="font-medium text-xs">Intern / Employee</SelectItem>
                <SelectItem value="guest" className="font-medium text-xs">Guest / System</SelectItem>
              </SelectContent>
            </Select>

            {/* HTTP Method Filter */}
            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
              <SelectTrigger className="h-10 w-[130px] rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs">
                <SelectValue placeholder="Method: All" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="All" className="font-medium text-xs">All Methods</SelectItem>
                <SelectItem value="GET" className="font-medium text-xs">GET</SelectItem>
                <SelectItem value="POST" className="font-medium text-xs">POST</SelectItem>
                <SelectItem value="PUT" className="font-medium text-xs">PUT</SelectItem>
                <SelectItem value="PATCH" className="font-medium text-xs">PATCH</SelectItem>
                <SelectItem value="DELETE" className="font-medium text-xs">DELETE</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-10 w-[140px] rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="All" className="font-medium text-xs">All Statuses</SelectItem>
                <SelectItem value="true" className="font-medium text-xs">Success Only</SelectItem>
                <SelectItem value="false" className="font-medium text-xs">Failed / Errors</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-10 w-[140px] rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold text-xs">
                <SelectValue placeholder="Sort: Newest" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="desc" className="font-medium text-xs">Newest First</SelectItem>
                <SelectItem value="asc" className="font-medium text-xs">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">User & Role</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action / Description</th>
                <th className="py-3 px-3">Method & Endpoint</th>
                <th className="py-3 px-3">Status & Time</th>
                <th className="py-3 px-3">Browser & Device</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm font-medium">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
                      <span className="font-bold text-sm">Loading audit trail records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <span className="font-bold text-base block">No audit logs matching filters</span>
                    <span className="text-xs text-slate-400">Try broadening your search or resetting the selected filters.</span>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedLog(log);
                      setIsModalOpen(true);
                    }}
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300 font-semibold">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString([], {
                        month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit'
                      }) : 'N/A'}
                    </td>

                    {/* User & Role */}
                    <td className="py-3 px-3 max-w-[140px] truncate">
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {log.userName || "System"}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize truncate">
                          {log.role || "guest"}
                        </span>
                      </div>
                    </td>

                    {/* Module */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getModuleColor(log.module)}`}>
                        {log.module}
                      </Badge>
                    </td>

                    {/* Action & Description */}
                    <td className="py-3 px-3 max-w-[200px] truncate">
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">
                          {log.action}
                        </span>
                        {log.description && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {log.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Method & Endpoint */}
                    <td className="py-3 px-3 max-w-[150px] truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        {log.httpMethod && (
                          <Badge variant="outline" className={`text-[10px] font-black uppercase px-1 py-0.5 rounded shrink-0 ${getMethodBadgeStyle(log.httpMethod)}`}>
                            {log.httpMethod}
                          </Badge>
                        )}
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                          {log.endpoint || "-"}
                        </span>
                      </div>
                    </td>

                    {/* Status Code & Execution Time */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          log.success 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        }`}>
                          {log.responseStatus || (log.success ? 'OK' : 'ERR')}
                        </Badge>
                        {log.executionTimeMs !== undefined && log.executionTimeMs !== null && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {log.executionTimeMs}ms
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Browser / Device / IP */}
                    <td className="py-3 px-3 max-w-[140px] truncate text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col truncate">
                        <span className="font-medium flex items-center gap-1 truncate text-xs">
                          {log.device === 'Mobile' ? <Laptop className="h-3 w-3 text-orange-500 shrink-0" /> : <Globe className="h-3 w-3 text-blue-500 shrink-0" />}
                          <span className="truncate">{log.browser || "Unknown"}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {log.ipAddress || "N/A"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/40 text-xs font-semibold text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-900 dark:text-white">{logs.length}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalRecords}</span> audit records
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <Select value={limit.toString()} onValueChange={(val) => { setLimit(parseInt(val, 10)); setPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-slate-200 dark:border-slate-800">
                  <SelectItem value="10" className="text-xs font-bold">10</SelectItem>
                  <SelectItem value="25" className="text-xs font-bold">25</SelectItem>
                  <SelectItem value="50" className="text-xs font-bold">50</SelectItem>
                  <SelectItem value="100" className="text-xs font-bold">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(p - 1, 1))} 
                disabled={page <= 1 || loading}
                className="h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 font-bold"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <span className="px-3 font-bold text-slate-900 dark:text-white">
                Page {page} of {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
                disabled={page >= totalPages || loading}
                className="h-8 px-2.5 rounded-lg border-slate-200 dark:border-slate-800 font-bold"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Inspection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                Audit Log Details
              </DialogTitle>
              {selectedLog && (
                <Badge variant="outline" className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                  selectedLog.success ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                }`}>
                  {selectedLog.success ? 'Success' : 'Failed'}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs font-medium text-slate-500">
              Complete diagnostic record of request payload, state transitions, and device fingerprints.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-5 mt-4 text-sm">
              {/* Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Log ID</span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{selectedLog.id}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Timestamp</span>
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Execution Time</span>
                  <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400">
                    {selectedLog.executionTimeMs ? `${selectedLog.executionTimeMs} ms` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">User Name</span>
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{selectedLog.userName || "System"}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">User Email</span>
                  <span className="font-medium text-xs text-slate-600 dark:text-slate-300">{selectedLog.userEmail || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Role</span>
                  <span className="font-bold text-xs capitalize text-orange-600 dark:text-orange-400">{selectedLog.role || "guest"}</span>
                </div>
              </div>

              {/* Action & Endpoint Information */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-400 block">Module & Action</span>
                    <span className="font-black text-base text-slate-900 dark:text-white">{selectedLog.action}</span>
                  </div>
                  {selectedLog.httpMethod && (
                    <Badge className={`text-xs font-black uppercase ${getMethodBadgeStyle(selectedLog.httpMethod)}`}>
                      {selectedLog.httpMethod} {selectedLog.responseStatus ? `(${selectedLog.responseStatus})` : ''}
                    </Badge>
                  )}
                </div>
                <div className="text-xs font-mono bg-slate-100 dark:bg-slate-900 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 break-all">
                  {selectedLog.endpoint || "No specific HTTP endpoint"}
                </div>
                {selectedLog.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedLog.description}
                  </p>
                )}
              </div>

              {/* Device & Network Fingerprint */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-400 block">IP Address</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.ipAddress || "Unknown"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block">Browser</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.browser || "Unknown"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block">OS</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.operatingSystem || "Unknown"}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-400 block">Device</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.device || "Desktop"}</span>
                </div>
                {selectedLog.userAgent && (
                  <div className="col-span-2 sm:col-span-4 mt-1">
                    <span className="font-bold text-slate-400 block">User Agent</span>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 break-all">
                      {selectedLog.userAgent}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Message if failed */}
              {selectedLog.errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 space-y-1">
                  <span className="text-xs font-black uppercase flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" /> Error Details
                  </span>
                  <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-40">
                    {selectedLog.errorMessage}
                  </pre>
                </div>
              )}

              {/* Old vs New Value JSON Diff */}
              {(selectedLog.oldValue || selectedLog.newValue) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Old State Value</span>
                    <pre className="text-[11px] font-mono bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl overflow-x-auto max-h-48 text-slate-700 dark:text-slate-300">
                      {typeof selectedLog.oldValue === 'object' ? JSON.stringify(selectedLog.oldValue, null, 2) : selectedLog.oldValue || "None"}
                    </pre>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                    <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider block">New State Value</span>
                    <pre className="text-[11px] font-mono bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl overflow-x-auto max-h-48 text-emerald-700 dark:text-emerald-400">
                      {typeof selectedLog.newValue === 'object' ? JSON.stringify(selectedLog.newValue, null, 2) : selectedLog.newValue || "None"}
                    </pre>
                  </div>
                </div>
              )}

              {/* Sanitized Request Body */}
              {selectedLog.requestBody && (
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sanitized Request Payload</span>
                  <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto max-h-56">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedLog.requestBody), null, 2);
                      } catch {
                        return selectedLog.requestBody;
                      }
                    })()}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityLogsModule;
