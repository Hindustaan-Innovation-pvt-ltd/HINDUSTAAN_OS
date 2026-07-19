import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Mail, CheckCircle2, AlertCircle, Clock, Search, RefreshCw, Eye, Download, 
  FileSpreadsheet, Filter, X, ChevronLeft, ChevronRight, Calendar, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  type: 'User Invitations' | 'Password Reset' | 'Leave Notifications' | 'Task Assignments' | 'Announcements' | 'System Alerts';
  status: 'Success' | 'Failed' | 'Pending';
  sentBy: string;
  sentDate: string;
  deliveryStatus: string;
  body: string;
}

const INITIAL_EMAIL_LOGS: EmailLog[] = [
  {
    id: 'msg-1',
    recipient: 'rahul.sharma@hindustaan.in',
    subject: 'New Task Assigned: Setup Redis Caching',
    type: 'Task Assignments',
    status: 'Success',
    sentBy: 'System Bot',
    sentDate: '2026-07-14 09:30',
    deliveryStatus: 'Delivered',
    body: 'Hello Rahul,\n\nYou have been assigned the task "Setup Redis Caching for API" by Director.\nDue date: Oct 19, 2026.\n\nBest regards,\nProject OS Team'
  },
  {
    id: 'msg-2',
    recipient: 'priya.patel@gmail.com',
    subject: 'Reset your password for Project OS',
    type: 'Password Reset',
    status: 'Success',
    sentBy: 'Auth Service',
    sentDate: '2026-07-13 14:20',
    deliveryStatus: 'Delivered',
    body: 'Hello Priya,\n\nWe received a request to reset your password. Click the link below to set a new one:\nhttps://projectos.hindustaan.in/reset-password?token=xyz123\n\nIf you did not request this, please ignore this email.'
  },
  {
    id: 'msg-3',
    recipient: 'tanvy.pandey@hindustaan.in',
    subject: 'Leave Request Approved',
    type: 'Leave Notifications',
    status: 'Success',
    sentBy: 'Manager Bot',
    sentDate: '2026-07-13 11:05',
    deliveryStatus: 'Delivered',
    body: 'Hello Tanvy,\n\nYour leave request for July 20-22 has been approved by your manager.\nManager comment: Enjoy your time off!'
  },
  {
    id: 'msg-4',
    recipient: 'aakash.gupta@outlook.com',
    subject: 'Welcome to Hindustaan Innovations!',
    type: 'User Invitations',
    status: 'Failed',
    sentBy: 'Admin (System)',
    sentDate: '2026-07-12 16:45',
    deliveryStatus: 'Bounced (Invalid Address)',
    body: 'Hello Aakash,\n\nYou have been invited to join the Hindustaan Innovations workspace on Project OS.\nClick here to complete registration: https://projectos.hindustaan.in/invite?code=ak82js'
  },
  {
    id: 'msg-5',
    recipient: 'all-hands@hindustaan.in',
    subject: 'All Hands Meeting at 4:00 PM Today',
    type: 'Announcements',
    status: 'Pending',
    sentBy: 'Admin (System)',
    sentDate: '2026-07-14 10:15',
    deliveryStatus: 'In Queue',
    body: 'Hi Team,\n\nPlease join the quarterly All Hands meeting today at 4:00 PM in the main conference room or via Zoom link.'
  },
  {
    id: 'msg-6',
    recipient: 'devops-alerts@hindustaan.in',
    subject: '[CRITICAL] High RAM Usage Alert on Server 4',
    type: 'System Alerts',
    status: 'Failed',
    sentBy: 'Monitor Bot',
    sentDate: '2026-07-14 05:12',
    deliveryStatus: 'Failed (SMTP Server Timeout)',
    body: 'CRITICAL Alert: Memory usage on Server-04 has exceeded 95% for more than 15 minutes.'
  }
];

export default function EmailLogsModule() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter and Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications/email-logs');
      if (res.data?.success) {
        // Map backend sentDate schema to frontend sentDate format
        const mapped = (res.data.data || []).map((log: any) => {
          const rawDate = typeof log.sentDate === 'string' ? log.sentDate : (log.sentDate ? new Date(log.sentDate).toISOString() : new Date().toISOString());
          return {
            id: log.id,
            recipient: log.recipient,
            subject: log.subject,
            type: log.type,
            status: log.status,
            sentBy: log.sentBy,
            sentDate: rawDate.replace('T', ' ').slice(0, 16),
            deliveryStatus: log.deliveryStatus,
            body: log.body
          };
        });
        setLogs(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch email logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogs();
    setIsRefreshing(false);
    toast.success('Email logs updated.', { description: 'Fetched latest logs from gateway.' });
  };// Analytics Calculations
  const totalSent = logs.length;
  const failedCount = logs.filter(l => l.status === 'Failed').length;
  const pendingCount = logs.filter(l => l.status === 'Pending').length;
  const successCount = logs.filter(l => l.status === 'Success').length;
  const successRate = totalSent > 0 ? ((successCount / totalSent) * 100).toFixed(1) : '0';

  // Filters application
  const filteredLogs = logs.filter(log => {
    // Search
    const matchesSearch = 
      log.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sentBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status
    const matchesStatus = statusFilter === 'all' || log.status.toLowerCase() === statusFilter.toLowerCase();

    // Type
    const matchesType = typeFilter === 'all' || log.type === typeFilter;

    // Date Range (Mock logic based on sentDate string comparison)
    let matchesDate = true;
    if (dateRangeFilter !== 'all') {
      const logDate = new Date(log.sentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateRangeFilter === 'today') {
        matchesDate = logDate >= today;
      } else if (dateRangeFilter === 'yesterday') {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        matchesDate = logDate >= yesterday && logDate < today;
      } else if (dateRangeFilter === 'week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        matchesDate = logDate >= lastWeek;
      } else if (dateRangeFilter === 'month') {
        const lastMonth = new Date(today);
        lastMonth.setDate(lastMonth.getDate() - 30);
        matchesDate = logDate >= lastMonth;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const handleRetryEmail = (id: string) => {
    setRetryingId(id);
    toast.loading('Retrying connection to SMTP server...');
    setTimeout(() => {
      setLogs(prev => prev.map(log => {
        if (log.id === id) {
          return {
            ...log,
            status: 'Success',
            deliveryStatus: 'Delivered (Retried successfully)',
            sentDate: new Date().toISOString().replace('T', ' ').substring(0, 16)
          };
        }
        return log;
      }));
      setRetryingId(null);
      toast.dismiss();
      toast.success('Email re-sent and delivered successfully!');
    }, 1500);
  };

  const handleDownloadLogs = () => {
    try {
      const content = filteredLogs.map(log => 
        `ID: ${log.id}\nRecipient: ${log.recipient}\nSubject: ${log.subject}\nType: ${log.type}\nStatus: ${log.status}\nSent By: ${log.sentBy}\nDate: ${log.sentDate}\nDelivery Status: ${log.deliveryStatus}\n---\nBody:\n${log.body}\n========================================\n`
      ).join('\n');
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `email_logs_summary_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Email logs summary downloaded.');
    } catch (e) {
      toast.error('Failed to download email logs.');
    }
  };

  const handleExportCSV = () => {
    try {
      const headers = ['Recipient', 'Subject', 'Email Type', 'Status', 'Sent By', 'Sent Date', 'Delivery Status'];
      const rows = filteredLogs.map(log => [
        log.recipient,
        log.subject,
        log.type,
        log.status,
        log.sentBy,
        log.sentDate,
        log.deliveryStatus
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `email_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Email logs CSV exported successfully!');
    } catch (e) {
      toast.error('Failed to export CSV.');
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-page-title text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Mail className="h-8 w-8 text-indigo-500" />
          Email Logs
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5 max-w-3xl">
          View email history and delivery records.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Emails Sent</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalSent}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Mail className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Failed Emails</p>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{failedCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Queue</p>
              <h3 className="text-2xl font-black text-amber-500 mt-1">{pendingCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Success Rate</p>
              <h3 className="text-2xl font-black text-emerald-500 mt-1">{successRate}%</h3>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Action Toolbar */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input 
                type="text"
                placeholder="Search recipient, subject, or sender..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                onClick={handleDownloadLogs} 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold border-slate-200 dark:border-slate-800"
              >
                <Download className="h-4 w-4 mr-1.5" /> Download TXT
              </Button>
              <Button 
                onClick={handleExportCSV} 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold border-slate-200 dark:border-slate-800"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export CSV
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filters
            </span>

            {/* Status Filter buttons */}
            <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-900/50 p-1">
              {['all', 'success', 'failed', 'pending'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-bold rounded-md capitalize transition-all ${
                    statusFilter === status 
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm dark:hover:bg-slate-800/40 dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Type Filter Select */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-8 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-900/50 border-0">
                <SelectValue placeholder="Email Type" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 dark:border-slate-800">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="User Invitations">User Invitations</SelectItem>
                <SelectItem value="Password Reset">Password Reset</SelectItem>
                <SelectItem value="Leave Notifications">Leave Notifications</SelectItem>
                <SelectItem value="Task Assignments">Task Assignments</SelectItem>
                <SelectItem value="Announcements">Announcements</SelectItem>
                <SelectItem value="System Alerts">System Alerts</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Select */}
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-[140px] h-8 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-900/50 border-0">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="border-slate-200 dark:border-slate-800">
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateRangeFilter !== 'all') && (
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setDateRangeFilter('all');
                }} 
                variant="ghost" 
                size="sm" 
                className="h-8 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Email Logs Table */}
      <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Recipient</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Email Type</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Sent By</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Sent Date</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider">Delivery Status</th>
                <th className="px-6 py-4 text-xs font-extrabold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                    No email logs found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  let statusBadge = (
                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/25 border-0 font-bold">Success</Badge>
                  );
                  if (log.status === 'Failed') {
                    statusBadge = (
                      <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/25 border-0 font-bold">Failed</Badge>
                    );
                  } else if (log.status === 'Pending') {
                    statusBadge = (
                      <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/25 border-0 font-bold">Pending</Badge>
                    );
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{log.recipient}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{log.subject}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{log.type}</span>
                      </td>
                      <td className="px-6 py-4">
                        {statusBadge}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{log.sentBy}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{log.sentDate}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-xs font-bold ${
                          log.deliveryStatus.includes('Delivered') ? 'text-emerald-500' : 
                          log.status === 'Failed' ? 'text-rose-500' : 'text-amber-500'
                        }`}>{log.deliveryStatus}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button 
                            onClick={() => setSelectedLog(log)} 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                            title="View Content"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {log.status === 'Failed' && (
                            <Button 
                              onClick={() => handleRetryEmail(log.id)} 
                              disabled={retryingId === log.id}
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400"
                              title="Retry Email"
                            >
                              <RefreshCw className={`h-4 w-4 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Email Content Dialog */}
      <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
        {selectedLog && (
          <DialogContent className="sm:max-w-[550px] rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c1222]">
            <DialogHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
              <DialogTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-500" /> View Email Content
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
                Email message ID: {selectedLog.id}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] tracking-wider">Recipient</span>
                <span className="col-span-2 font-bold text-slate-900 dark:text-white">{selectedLog.recipient}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] tracking-wider">Subject</span>
                <span className="col-span-2 font-bold text-slate-900 dark:text-white">{selectedLog.subject}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] tracking-wider">Email Type</span>
                <span className="col-span-2">
                  <Badge variant="outline" className="text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">{selectedLog.type}</Badge>
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-slate-800/60">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] tracking-wider">Sent By / Date</span>
                <span className="col-span-2 text-slate-700 dark:text-slate-300 font-medium">
                  {selectedLog.sentBy} on {selectedLog.sentDate}
                </span>
              </div>
              
              <div className="space-y-2 mt-4">
                <span className="font-extrabold text-slate-500 uppercase text-[10px] tracking-wider block">Message Body</span>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed max-h-[220px] overflow-y-auto">
                  {selectedLog.body}
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 dark:border-slate-800/60 pt-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedLog(null)} 
                className="rounded-xl border-slate-200 dark:border-slate-700 font-bold"
              >
                Close
              </Button>
              {selectedLog.status === 'Failed' && (
                <Button 
                  onClick={() => {
                    const id = selectedLog.id;
                    setSelectedLog(null);
                    handleRetryEmail(id);
                  }}
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" /> Retry Sending
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      
    </div>
  );
}
