import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Check, XCircle, Loader2, Mail, Activity, MessageSquare } from 'lucide-react';
import type { LeaveComment } from '@/components/dashboard/LeaveCommentHistory';
import { cn } from '@/lib/utils';
import { toast as sonnerToast } from 'sonner';

const toast = ({ title, description }: { title: string; description: string }) => {
  sonnerToast.success(title, { description });
};

export interface LeaveRequest {
  id: number;
  employee: string;
  avatar?: string;
  department: string;
  type: string;
  start: string;
  end: string;
  appliedOn: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  days: number;
  hrNotified?: boolean;
}

interface LeaveRequestDialogProps {
  request: LeaveRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number) => Promise<void>;
}

export default function LeaveRequestDialog({
  request,
  isOpen,
  onOpenChange,
  onApprove,
  onReject
}: LeaveRequestDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [leaveComments, setLeaveComments] = useState<LeaveComment[]>([]);
  React.useEffect(() => {
    if (isOpen && request) {
      const stored = localStorage.getItem('hindustaan_leave_comments');
      if (stored) {
        setLeaveComments(JSON.parse(stored).filter((c: any) => c.leaveId === request.id));
      }
    }
  }, [isOpen, request]);

  if (!request) return null;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleApprove = async () => {
    setIsPending(true);
    try {
      await onApprove(request.id);
      onOpenChange(false);
      toast({
        title: "Action Completed",
        description: "Leave request status updated successfully."
      });
    } catch (error) {
      sonnerToast.error('Failed to approve leave request.');
    } finally {
      setIsPending(false);
    }
  };

  const handleReject = async () => {
    setIsPending(true);
    try {
      await onReject(request.id);
      onOpenChange(false);
      toast({
        title: "Action Completed",
        description: "Leave request status updated successfully."
      });
    } catch (error) {
      sonnerToast.error('Failed to reject leave request.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-200 dark:border-slate-800 shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">Leave Request Details</DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-500 dark:text-slate-400">
            Review and take action on the submitted leave application.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Employee Info Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-4 border-slate-200 dark:border-slate-800 shadow-md">
              <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xl">
                {getInitials(request.employee)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xl text-slate-900 dark:text-slate-900 dark:text-white">{request.employee}</h4>
                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-0 font-bold">
                  {request.department}
                </Badge>
              </div>
              <p className="text-label font-bold text-slate-500 dark:text-slate-400  ">
                APPLIED ON {request.appliedOn}
              </p>
            </div>
          </div>

          {/* Sub-cards: Details and Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Leave Details Sub-card */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 flex flex-col gap-1 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold   text-slate-500 dark:text-slate-400">Leave Details</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-blue-900/30 text-blue-400 border-0 hover:bg-blue-900/40">
                  {request.type}
                </Badge>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1.5 text-slate-500" />
                  {request.days} Day{request.days > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-400 mt-1">
                {request.start} <span className="text-slate-500 mx-1">→</span> {request.end}
              </span>
            </div>

            {/* Reason Sub-card */}
            <div className="bg-amber-50 dark:bg-amber-950/10 rounded-2xl p-4 flex flex-col gap-1 border border-amber-200 dark:border-amber-900/20 shadow-sm">
              <span className="text-[10px] font-bold   text-amber-600 dark:text-amber-500/70">Reason</span>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mt-1 leading-snug italic">
                "{request.reason}"
              </p>
            </div>
          </div>
          {/* Activity Timeline Sub-card */}
          <div className="bg-slate-50 dark:bg-slate-900/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm col-span-1 md:col-span-2 mt-2">
            <h4 className="text-[10px] font-bold   text-slate-400 mb-4 flex items-center">
              <Activity className="h-3.5 w-3.5 mr-1.5" /> Activity Timeline
            </h4>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
              {/* Application Step */}
              <div className="relative flex items-start gap-4 z-10">
                <div className="h-3 w-3 rounded-full bg-slate-400 dark:bg-slate-600 mt-1 shrink-0 ring-4 ring-white dark:ring-slate-900" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                    <span className="font-bold text-slate-900 dark:text-white">{request.employee}</span> applied for leave.
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{request.appliedOn}</p>
                </div>
              </div>

              {/* Comments */}
              {leaveComments.map((comment) => (
                <div key={comment.id} className="relative flex items-start gap-4 z-10">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mt-1 shrink-0 ring-4 ring-white dark:ring-slate-900" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      <span className="font-bold text-slate-900 dark:text-white">{comment.managerName}</span> commented.
                    </p>
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-3 mt-2 border border-slate-200 dark:border-slate-700/50">
                      <p className="text-label text-slate-400 italic">"{comment.comment}"</p>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Status Change */}
              {request.status !== 'Pending' && (
                <div className="relative flex items-start gap-4 z-10">
                  <div className={`h-3 w-3 rounded-full mt-1 shrink-0 ring-4 ring-white dark:ring-slate-900 ${request.status === 'Approved' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                      Leave was <span className={`font-bold ${request.status === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}`}>{request.status.toLowerCase()}</span>.
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">Today</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dialog Actions Footer - Only for Pending Requests */}
        {request.status === 'Pending' && (
          <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="w-full sm:w-auto rounded-xl h-12 font-bold text-rose-400 hover:text-rose-350 hover:bg-rose-950/20 border-rose-900/50 shadow-sm"
              onClick={handleReject}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><XCircle className="h-5 w-5 mr-2" /> Reject</>}
            </Button>
            <Button
              className="w-full sm:w-auto rounded-xl h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
              onClick={handleApprove}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5 mr-2" /> Approve Leave</>}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
