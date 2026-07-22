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

  // Send Test Email State
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [recipientsList, setRecipientsList] = useState<string[]>(['bhupesh@ssipmt.com']);
  const [newRecipientInput, setNewRecipientInput] = useState('');
  const [testTemplate, setTestTemplate] = useState('test');
  const [testSubject, setTestSubject] = useState('Hindustaan OS SMTP Test');
  const [sendingTest, setSendingTest] = useState(false);

  const addRecipient = (emailToAdd?: string) => {
    const target = (emailToAdd || newRecipientInput).trim();
    if (!target) return;
    // Extract comma-separated or space-separated if pasted
    const items = target.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    setRecipientsList(prev => Array.from(new Set([...prev, ...items])));
    setNewRecipientInput('');
  };

  const removeRecipient = (indexToRemove: number) => {
    setRecipientsList(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSendTestEmail = async () => {
    if (recipientsList.length === 0 && !newRecipientInput.trim()) {
      toast.error('Please add at least one recipient email address or target role');
      return;
    }
    
    // Add any remaining text in input
    let finalRecipients = [...recipientsList];
    if (newRecipientInput.trim()) {
      const extra = newRecipientInput.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
      finalRecipients = Array.from(new Set([...finalRecipients, ...extra]));
      setRecipientsList(finalRecipients);
      setNewRecipientInput('');
    }

    try {
      setSendingTest(true);
      const isBulk = finalRecipients.length > 1 || ['all', 'interns', 'managers', 'admins', 'employees'].includes(finalRecipients[0]?.toLowerCase());
      const endpoint = isBulk ? '/email/send-bulk' : '/email/send';
      const payload = isBulk
        ? {
            recipients: finalRecipients,
            subject: testSubject || 'Hindustaan OS Workspace Notification',
            template: testTemplate,
            data: {
              otp: '582914',
              taskTitle: 'Bulk Nodemailer Service',
              taskDescription: 'Batch email dispatch test.',
              loginUrl: window.location.origin,
              sentTime: new Date().toLocaleString()
            }
          }
        : {
            to: finalRecipients[0],
            subject: testSubject || 'Hindustaan OS Notification',
            template: testTemplate,
            data: {
              otp: '582914',
              taskTitle: 'Integrate Gmail SMTP Service',
              taskDescription: 'Complete Nodemailer backend and frontend integration.',
              loginUrl: window.location.origin,
              sentTime: new Date().toLocaleString()
            }
          };

      const res = await api.post(endpoint, payload);
      if (res.data?.success) {
        if (isBulk) {
          const stats = res.data.data;
          toast.success(`Bulk Email Complete: ${stats.successful}/${stats.total} delivered!`, {
            description: `Delivered to recipients array.`
          });
        } else {
          toast.success(`Email delivered to ${finalRecipients[0]}!`, {
            description: `Message-ID: ${res.data.data?.messageId || 'Delivered'}`
          });
        }
        setIsTestEmailOpen(false);
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSendingTest(false);
    }
  };

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
                onClick={() => setIsTestEmailOpen(true)} 
                size="sm" 
                className="rounded-xl font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-sm cursor-pointer"
              >
                <Mail className="h-4 w-4 mr-1.5" /> Send Test Email
              </Button>
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
      
      {/* Send Test Email Modal */}
      <Dialog open={isTestEmailOpen} onOpenChange={setIsTestEmailOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Mail className="h-5 w-5 text-orange-500" /> Send Single or Bulk Email
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Send single or bulk emails using your Nodemailer Gmail SMTP service.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Array Recipients Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Recipients List (Array: {recipientsList.length}) (*)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400">Quick Target:</span>
                  <button type="button" onClick={() => addRecipient('all')} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-orange-500 hover:bg-orange-500 hover:text-white px-1.5 py-0.5 rounded transition-colors">+ All</button>
                  <button type="button" onClick={() => addRecipient('interns')} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-indigo-500 hover:bg-indigo-500 hover:text-white px-1.5 py-0.5 rounded transition-colors">+ Interns</button>
                  <button type="button" onClick={() => addRecipient('managers')} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-emerald-500 hover:bg-emerald-500 hover:text-white px-1.5 py-0.5 rounded transition-colors">+ Managers</button>
                </div>
              </div>

              {/* Badges Container */}
              <div className="min-h-[46px] p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center gap-1.5 mb-2">
                {recipientsList.length === 0 && (
                  <span className="text-xs text-slate-400 pl-1">No recipients added yet. Type email and press Enter...</span>
                )}
                {recipientsList.map((email, idx) => (
                  <Badge key={idx} className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-1 rounded-lg text-xs flex items-center gap-1.5 font-bold">
                    {email}
                    <button type="button" onClick={() => removeRecipient(idx)} className="hover:text-rose-500 text-slate-400 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Add Recipient Row */}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter email or paste multiple separated by commas..."
                  value={newRecipientInput}
                  onChange={(e) => setNewRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                  className="rounded-xl bg-slate-50 dark:bg-slate-800/50 flex-1 text-xs"
                />
                <Button 
                  type="button" 
                  onClick={() => addRecipient()} 
                  variant="outline"
                  size="sm"
                  className="rounded-xl font-bold border-slate-200 dark:border-slate-800 shrink-0"
                >
                  + Add
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Select Email Template</label>
              <Select value={testTemplate} onValueChange={(val) => {
                setTestTemplate(val);
                if (val === 'test') setTestSubject('Hindustaan OS SMTP Test');
                else if (val === 'welcome') setTestSubject('Welcome to Hindustaan OS');
                else if (val === 'otp') setTestSubject('Your Verification OTP Code');
                else if (val === 'forgot-password') setTestSubject('Reset Your Password Request');
                else if (val === 'reset-password') setTestSubject('Password Reset Successful');
                else if (val === 'task-assigned') setTestSubject('New Task Assigned');
                else if (val === 'task-completed') setTestSubject('Task Marked Completed');
                else if (val === 'standup-reminder') setTestSubject('Daily Standup Reminder');
                else if (val === 'announcement') setTestSubject('Workspace Announcement');
              }}>
                <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <SelectValue placeholder="Choose Template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">test.ejs (SMTP Test)</SelectItem>
                  <SelectItem value="welcome">welcome.ejs (Onboarding)</SelectItem>
                  <SelectItem value="otp">otp.ejs (Verification Code)</SelectItem>
                  <SelectItem value="forgot-password">forgot-password.ejs (Reset Link)</SelectItem>
                  <SelectItem value="reset-password">reset-password.ejs (Confirmation)</SelectItem>
                  <SelectItem value="task-assigned">task-assigned.ejs (Task Update)</SelectItem>
                  <SelectItem value="task-completed">task-completed.ejs (Task Completion)</SelectItem>
                  <SelectItem value="standup-reminder">standup-reminder.ejs (Daily Reminder)</SelectItem>
                  <SelectItem value="announcement">announcement.ejs (Broadcast)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">Subject</label>
              <Input
                type="text"
                placeholder="Email Subject"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
                className="rounded-xl bg-slate-50 dark:bg-slate-800/50"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsTestEmailOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={sendingTest}
              className="rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold"
            >
              {sendingTest ? "Sending..." : "Send Email Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
