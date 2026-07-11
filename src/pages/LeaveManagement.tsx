import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  FileText,
  UploadCloud,
  Send,
  Save,
  MessageSquare,
  Calendar as CalendarIcon,
  Users,
  Loader2,
  Mail,
  MoreVertical,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, isSameDay } from 'date-fns';

// 9. Mock Data
const MOCK_LEAVES = [
  { id: 1, employee: "Tanvy Pandey", avatar: 'https://i.pravatar.cc/150?u=tanvy', department: "Engineering", type: "Sick Leave", start: "2026-07-11", end: "2026-07-13", appliedOn: "2026-07-10", reason: "Fever and medical consultation.", status: "Pending", days: 3 },
  { id: 2, employee: "Priya", avatar: 'https://i.pravatar.cc/150?u=priya', department: "Design", type: "WFH", start: "2026-07-11", end: "2026-07-11", appliedOn: "2026-07-09", reason: "Internet maintenance at home.", status: "Approved", days: 1, hrNotified: true },
  { id: 3, employee: "Rahul Sharma", avatar: 'https://i.pravatar.cc/150?u=rahul', department: "Engineering", type: "Casual Leave", start: "2026-07-15", end: "2026-07-18", appliedOn: "2026-07-05", reason: "Family function out of station.", status: "Pending", days: 4 },
  { id: 4, employee: "Amit Kumar", avatar: 'https://i.pravatar.cc/150?u=amit', department: "Marketing", type: "Casual Leave", start: "2026-07-11", end: "2026-07-12", appliedOn: "2026-07-01", reason: "Personal work.", status: "Approved", days: 2, hrNotified: true },
  { id: 5, employee: "Sara", avatar: 'https://i.pravatar.cc/150?u=sara', department: "HR", type: "Sick Leave", start: "2026-07-11", end: "2026-07-11", appliedOn: "2026-07-11", reason: "Not feeling well.", status: "Approved", days: 1, hrNotified: true },
  { id: 6, employee: "John Doe", avatar: 'https://i.pravatar.cc/150?u=john', department: "Sales", type: "Emergency Leave", start: "2026-07-11", end: "2026-07-11", appliedOn: "2026-07-11", reason: "Personal emergency.", status: "Approved", days: 1, hrNotified: true },
];

const leaveBalance = {
  casual: { total: 10, used: 2, remaining: 8 },
  sick: { total: 6, used: 2, remaining: 4 },
  overall: { total: 16, used: 4, remaining: 12 }
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

export default function LeaveManagement({ session }: { session: any }) {
  const role = session?.user?.user_metadata?.role || 'manager';
  const isManager = role === 'manager';

  const [activeTab, setActiveTab] = useState(isManager ? 'requests' : 'apply');
  const [leaveData, setLeaveData] = useState(MOCK_LEAVES);

  // Calendar State
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Comment Modal State
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 2. Email Notification Placeholder Flow - Loading States
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Leave Request Submitted', {
      description: 'Your leave request has been sent for approval.'
    });
  };

  // 10. Future Backend Integration Comments
  // Future Backend Flow:
  // Employee Applies Leave -> Manager Approves -> POST /api/leaves/:id/approve -> Backend sends email to HR -> Calendar updates automatically

  const handleApprove = (id: number) => {
    setApprovingId(id);
    // Simulate API call
    setTimeout(() => {
      setLeaveData(prev => prev.map(l => l.id === id ? { ...l, status: 'Approved', hrNotified: true } : l));
      setApprovingId(null);
      toast.success('Leave Approved Successfully.', {
        description: 'HR has been notified via email.'
      });
      // TODO: Backend API
      // POST /api/leaves/:id/approve
      // Backend will send email to HR automatically
    }, 1500);
  };

  const handleReject = (id: number) => {
    setRejectingId(id);
    // Simulate API call
    setTimeout(() => {
      setLeaveData(prev => prev.map(l => l.id === id ? { ...l, status: 'Rejected' } : l));
      setRejectingId(null);
      toast.error('Leave Rejected', {
        description: 'Employee has been notified.'
      });
      // TODO: Backend API
      // POST /api/leaves/:id/reject
    }, 1500);
  };

  const openCommentModal = (id: number) => {
    setActiveRequestId(id);
    setCommentText('');
    setCommentModalOpen(true);
  };

  const submitComment = () => {
    setCommentModalOpen(false);
    toast.success('Comment saved.');
    // TODO: POST /api/leaves/:id/comments
  };

  // Compute Calendar Indicators
  const CustomDay = (props: any) => {
    const { date } = props;
    const isTodayDate = isSameDay(date, new Date());
    const leavesOnDate = leaveData.filter(l => {
      if (l.status !== 'Approved') return false;
      const start = new Date(l.start);
      start.setHours(0,0,0,0);
      const end = new Date(l.end);
      end.setHours(23,59,59,999);
      return date >= start && date <= end;
    });

    const leaveCount = leavesOnDate.length;
    const tooltipText = leaveCount > 0 
      ? `${format(date, 'MMM d, yyyy')}\n\nEmployees on Leave:\n` + leavesOnDate.map(l => `• ${l.employee} (${l.type})`).join('\n') 
      : '';

    return (
      <div 
        title={tooltipText} 
        className={cn(
          "relative w-8 h-8 flex flex-col items-center justify-center rounded-full p-1 cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
          isTodayDate && "bg-purple-600 text-white font-bold hover:bg-purple-700 dark:hover:bg-purple-700",
          selectedDate && isSameDay(date, selectedDate) && !isTodayDate && "ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-950"
        )}
      >
        <span>{date.getDate()}</span>
        {leaveCount > 0 && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center">
            {leaveCount === 1 && <div className="w-2.5 h-2.5 bg-rose-500 rounded-full border border-white dark:border-slate-900" />}
            {leaveCount > 1 && leaveCount < 5 && (
              <Badge className="px-1 py-0 h-4 min-w-4 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white text-[9px] border border-white dark:border-slate-900 shadow-sm">{leaveCount}</Badge>
            )}
            {leaveCount >= 5 && (
              <Badge className="px-1 py-0 h-4 min-w-4 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white text-[9px] border border-white dark:border-slate-900 shadow-sm">5+</Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  // Selected date leaves
  const selectedDateLeaves = selectedDate ? leaveData.filter(l => {
    if (l.status !== 'Approved') return false;
    const start = new Date(l.start);
    start.setHours(0,0,0,0);
    const end = new Date(l.end);
    end.setHours(23,59,59,999);
    return selectedDate >= start && selectedDate <= end;
  }) : [];

  // Statistics
  const pendingRequestsCount = leaveData.filter(l => l.status === 'Pending').length;
  const approvedThisMonthCount = leaveData.filter(l => l.status === 'Approved' && new Date(l.appliedOn).getMonth() === new Date().getMonth()).length;
  
  const todayLeavesCount = leaveData.filter(l => {
    if (l.status !== 'Approved') return false;
    const start = new Date(l.start);
    start.setHours(0,0,0,0);
    const end = new Date(l.end);
    end.setHours(23,59,59,999);
    const now = new Date();
    return now >= start && now <= end;
  }).length;

  const upcomingLeavesCount = leaveData.filter(l => l.status === 'Approved' && new Date(l.start) > new Date()).length;

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20 w-full p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          Leave Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Manage your leaves, view history, and team availability.
        </p>
      </div>

      {isManager && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10 backdrop-blur-xl shadow-sm border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-700/70 dark:text-amber-400/70 uppercase tracking-wider">Pending Requests</p>
                <p className="text-2xl font-black text-amber-900 dark:text-amber-100">{pendingRequestsCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 backdrop-blur-xl shadow-sm border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700/70 dark:text-emerald-400/70 uppercase tracking-wider">Approved This Month</p>
                <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{approvedThisMonthCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/10 backdrop-blur-xl shadow-sm border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-700/70 dark:text-purple-400/70 uppercase tracking-wider">On Leave Today</p>
                <p className="text-2xl font-black text-purple-900 dark:text-purple-100">{todayLeavesCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-white/40 dark:border-slate-800/60 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10 backdrop-blur-xl shadow-sm border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-700/70 dark:text-blue-400/70 uppercase tracking-wider">Upcoming Leaves</p>
                <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{upcomingLeavesCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:w-[600px] bg-slate-100/80 dark:bg-slate-800/50 p-1 backdrop-blur-xl rounded-2xl h-12">
          {!isManager ? (
            <>
              <TabsTrigger value="apply" className="rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Apply Leave</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">My History</TabsTrigger>
              <TabsTrigger value="balance" className="rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Leave Balance</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="requests" className="rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Team Requests</TabsTrigger>
              <TabsTrigger value="calendar" className="rounded-xl font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Team Calendar</TabsTrigger>
            </>
          )}
        </TabsList>

        <div className="mt-8">
          {/* Employee: Apply Leave */}
          <TabsContent value="apply">
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 pb-6">
                <CardTitle className="text-xl font-bold">Apply for Leave</CardTitle>
                <CardDescription>Submit a new leave request. Subject to manager approval.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <form id="leave-form" onSubmit={handleApplyLeave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Leave Type</Label>
                      <Select required>
                        <SelectTrigger className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 h-12 shadow-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          <SelectItem value="casual">Casual Leave (CL)</SelectItem>
                          <SelectItem value="sick">Sick Leave (SL)</SelectItem>
                          <SelectItem value="wfh">Work From Home</SelectItem>
                          <SelectItem value="half">Half Day</SelectItem>
                          <SelectItem value="emergency">Emergency Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Emergency Contact Number</Label>
                      <Input type="tel" placeholder="+91" className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 h-12 shadow-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Start Date</Label>
                      <Input type="date" required className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 h-12 shadow-sm font-medium text-slate-900 dark:text-slate-100" />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">End Date</Label>
                      <Input type="date" required className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 h-12 shadow-sm font-medium text-slate-900 dark:text-slate-100" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Reason for Leave</Label>
                      <Textarea required placeholder="Please provide a valid reason..." className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 min-h-[120px] shadow-sm font-medium resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-bold text-slate-700 dark:text-slate-300">Attachment (Optional)</Label>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".svg,.png,.jpg,.jpeg,.pdf" />
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={cn("border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group shadow-sm", selectedFile ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/50")}
                      >
                        {selectedFile ? (
                          <>
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedFile.name}</p>
                            <p className="text-xs font-semibold text-slate-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <Button variant="ghost" size="sm" onClick={handleClearFile} className="mt-4 h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">Remove File</Button>
                          </>
                        ) : (
                          <>
                            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <UploadCloud className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Click to upload or drag and drop</p>
                            <p className="text-xs font-semibold text-slate-500 mt-1">SVG, PNG, JPG, PDF (max. 5MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="p-6 md:p-8 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                <Button variant="outline" type="button" className="rounded-xl font-bold h-12 px-6 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button type="submit" form="leave-form" className="rounded-xl font-bold h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Employee: My History */}
          <TabsContent value="history">
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80">
                <CardTitle className="text-xl font-bold">Leave History</CardTitle>
                <CardDescription>Track the status of your past and upcoming leaves.</CardDescription>
              </CardHeader>
              <div className="overflow-x-auto p-4 md:p-6">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-xs text-slate-500 font-black uppercase tracking-wider bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <tr>
                      <th className="px-6 py-4 rounded-l-xl">Applied On</th>
                      <th className="px-6 py-4">Leave Type</th>
                      <th className="px-6 py-4">Dates</th>
                      <th className="px-6 py-4">Days</th>
                      <th className="px-6 py-4 text-right rounded-r-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {leaveData.filter(l => l.employee === "Tanvy Pandey").map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                        <td className="px-6 py-5 font-semibold text-slate-600 dark:text-slate-400">{leave.appliedOn}</td>
                        <td className="px-6 py-5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          {leave.type}
                        </td>
                        <td className="px-6 py-5 font-semibold text-slate-600 dark:text-slate-400">
                          {leave.start} <span className="text-slate-400 mx-1">→</span> {leave.end}
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-900 dark:text-white">{leave.days}</td>
                        <td className="px-6 py-5 text-right">
                          {leave.status === 'Pending' && <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50 px-3 py-1 text-xs font-bold shadow-sm">Pending</Badge>}
                          {leave.status === 'Approved' && <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 px-3 py-1 text-xs font-bold shadow-sm">Approved</Badge>}
                          {leave.status === 'Rejected' && <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50 px-3 py-1 text-xs font-bold shadow-sm">Rejected</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Manager: Team Requests */}
          <TabsContent value="requests">
            <div className="space-y-6">
              <AnimatePresence>
                {leaveData.filter(l => l.status === 'Pending').length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 shadow-sm backdrop-blur-xl">
                    <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">All Caught Up!</h3>
                    <p className="text-slate-500 font-medium">There are no pending leave requests to approve.</p>
                  </motion.div>
                ) : (
                  leaveData.filter(l => l.status === 'Pending').map((req) => (
                    <motion.div 
                      key={req.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0, margin: 0, overflow: 'hidden' }}
                      className="border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-950 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden flex flex-col hover:shadow-xl transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-stretch">
                        
                        {/* Employee Info Section */}
                        <div className="p-6 lg:p-8 flex-1 flex flex-col md:flex-row gap-6 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800">
                          <Avatar className="h-16 w-16 border-4 border-white dark:border-slate-900 shadow-md">
                            <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xl">{getInitials(req.employee)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h4 className="font-black text-xl text-slate-900 dark:text-white">{req.employee}</h4>
                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">{req.department}</Badge>
                                {req.hrNotified && (
                                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
                                    <Mail className="w-3 h-3 mr-1" /> HR Notified
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Applied on {req.appliedOn}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 flex flex-col gap-1 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Leave Details</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200">{req.type}</Badge>
                                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                                    <CalendarDays className="h-4 w-4 mr-1.5 text-slate-400" />
                                    {req.days} Day{req.days > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{req.start} <span className="text-slate-400 mx-1">→</span> {req.end}</span>
                              </div>
                              
                              <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl p-4 flex flex-col gap-1 border border-amber-100/50 dark:border-amber-900/30 shadow-sm">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600/70 dark:text-amber-500/70">Reason</span>
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mt-1 leading-snug italic">
                                  "{req.reason}"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions Section */}
                        <div className="p-6 lg:p-8 flex flex-col gap-3 justify-center w-full lg:w-[280px] bg-slate-50/50 dark:bg-slate-900/30">
                          <Button 
                            className="w-full rounded-xl h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20" 
                            onClick={() => handleApprove(req.id)}
                            disabled={approvingId === req.id || rejectingId === req.id}
                          >
                            {approvingId === req.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5 mr-2" /> Approve Leave</>}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full rounded-xl h-12 font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-900/20 shadow-sm" 
                            onClick={() => handleReject(req.id)}
                            disabled={approvingId === req.id || rejectingId === req.id}
                          >
                            {rejectingId === req.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <><XCircle className="h-5 w-5 mr-2" /> Reject</>}
                          </Button>
                          <div className="relative mt-2">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-slate-50 dark:bg-[#0B1120] px-2 text-slate-500 font-bold">Or</span>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            className="w-full rounded-xl h-11 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 mt-2" 
                            onClick={() => openCommentModal(req.id)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Comment
                          </Button>
                        </div>

                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Manager: Team Calendar */}
          <TabsContent value="calendar">
            <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl rounded-3xl p-4 md:p-8 overflow-hidden">
              <div className="flex flex-col xl:flex-row gap-8 lg:gap-12">
                
                {/* Calendar Section */}
                <div className="w-full xl:w-2/3 shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Team Calendar</h3>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => { setCalendarMonth(new Date()); setSelectedDate(new Date()); }} className="h-10 rounded-xl font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm">
                        Today
                      </Button>
                      <Select value={calendarMonth.getMonth().toString()} onValueChange={v => setCalendarMonth(new Date(calendarMonth.getFullYear(), parseInt(v), 1))}>
                        <SelectTrigger className="h-10 rounded-xl font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-[140px] shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          {Array.from({length: 12}).map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>{format(new Date(2026, i, 1), 'MMMM')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={calendarMonth.getFullYear().toString()} onValueChange={v => setCalendarMonth(new Date(parseInt(v), calendarMonth.getMonth(), 1))}>
                        <SelectTrigger className="h-10 rounded-xl font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 w-[100px] shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          {[2025, 2026, 2027].map((y) => (
                            <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-4 md:p-6 shadow-inner overflow-x-auto">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => d && setSelectedDate(d)}
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      className="w-full flex justify-center"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4 w-full",
                        caption: "hidden", // We use custom header above
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full",
                        head_cell: "text-slate-500 rounded-md w-10 sm:w-14 font-black text-[11px] uppercase tracking-wider flex-1",
                        row: "flex w-full mt-2",
                        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 h-10 sm:h-14 w-10 sm:w-14 flex-1 flex items-center justify-center",
                        day: "h-full w-full p-0 font-normal aria-selected:opacity-100",
                        day_selected: "bg-transparent text-slate-900 dark:text-white hover:bg-transparent hover:text-slate-900 dark:hover:text-white focus:bg-transparent focus:text-slate-900 dark:focus:text-white",
                        day_today: "bg-transparent text-slate-900 dark:text-white",
                        day_outside: "text-slate-400 opacity-50 dark:text-slate-500",
                        day_disabled: "text-slate-400 opacity-50 dark:text-slate-500",
                        day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50",
                        day_hidden: "invisible",
                      }}
                      components={{
                        DayContent: (props) => <CustomDay date={props.date} />
                      }}
                    />
                  </div>
                </div>
                
                {/* Day Details Section */}
                <div className="w-full xl:w-1/3 flex flex-col pt-2 sm:pt-14">
                  <div className="bg-slate-50 dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex-1">
                    <h3 className="text-2xl font-black mb-1 text-slate-900 dark:text-white">
                      {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                    </h3>
                    
                    <div className="mt-8">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                        Employees on Leave
                      </p>
                      
                      <div className="space-y-4">
                        {selectedDateLeaves.length > 0 ? (
                          selectedDateLeaves.map((leave, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                              <Avatar className="h-10 w-10 shadow-sm border border-slate-200 dark:border-slate-800">
                                <AvatarFallback className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold">{getInitials(leave.employee)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{leave.employee}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase">Type:</span>
                                  <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 hover:bg-rose-100 text-[10px] font-bold py-0 h-4 border border-rose-200 dark:border-rose-800">
                                    {leave.type}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 px-4 rounded-2xl bg-white/50 dark:bg-slate-950/50 border border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-sm font-semibold text-slate-500">No employees are on leave today.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>

      {/* Comment Modal */}
      <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
              Add Comment
            </DialogTitle>
            <DialogDescription>
              Add a note to this leave request. This will be visible to the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type your comment here..."
              className="min-h-[120px] rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 resize-none font-medium text-sm focus:ring-2 focus:ring-blue-500/50 shadow-inner"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentModalOpen(false)} className="rounded-xl font-bold h-11 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">Cancel</Button>
            <Button onClick={submitComment} className="rounded-xl font-bold h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20">Save Comment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
