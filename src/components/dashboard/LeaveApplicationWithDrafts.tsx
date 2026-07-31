import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ProjectDatePicker } from '@/components/ui/project-date-picker';

interface LeaveApplicationWithDraftsProps {
  onSubmitLeave: (leave: {
    type: string;
    emergencyContact: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => boolean;
}

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function LeaveApplicationWithDrafts({ onSubmitLeave }: LeaveApplicationWithDraftsProps) {
  // Form State
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Form Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason) {
      toast.error('Missing Fields', {
        description: 'Please fill in all required fields.'
      });
      return;
    }

    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    if (start < todayMidnight || end < todayMidnight) {
      toast.error('Invalid Date Range', {
        description: 'Leave dates cannot be in the past. Only today or future dates are allowed.'
      });
      return;
    }

    if (start > end) {
      toast.error('Invalid Date Range', {
        description: 'Start date cannot be after End date.'
      });
      return;
    }

    const success = onSubmitLeave({
      type: leaveType,
      emergencyContact: 'N/A',
      startDate,
      endDate,
      reason,
    });

    if (success) {
      // Reset form
      setLeaveType('casual');
      setStartDate('');
      setEndDate('');
      setReason('');

      toast.success('Leave application submitted.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-6">
          <CardTitle className="text-xl font-bold">Apply for Leave</CardTitle>
          <CardDescription>Submit a new leave request. Subject to manager approval.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form id="leave-form" onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Leave Type</Label>
                <Select value={leaveType} onValueChange={setLeaveType} required>
                  <SelectTrigger className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 h-12 shadow-sm font-medium text-slate-900 dark:text-slate-100 hover:border-purple-500/40 dark:hover:border-purple-400/40 hover:shadow-md hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 transition-all duration-300">
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

              <div className="space-y-2 flex flex-col">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Start Date</Label>
                <ProjectDatePicker
                  value={startDate ? (() => {
                    const d = new Date(startDate);
                    return isNaN(d.getTime()) ? undefined : d;
                  })() : undefined}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  onChange={(date) => {
                    if (date) setStartDate(format(date, 'yyyy-MM-dd'));
                  }}
                />
              </div>

              <div className="space-y-2 flex flex-col">
                <Label className="font-bold text-slate-700 dark:text-slate-300">End Date</Label>
                <ProjectDatePicker
                  value={endDate ? (() => {
                    const d = new Date(endDate);
                    return isNaN(d.getTime()) ? undefined : d;
                  })() : undefined}
                  disabled={(date) => {
                    const minDate = startDate
                      ? new Date(new Date(startDate).setHours(0, 0, 0, 0))
                      : new Date(new Date().setHours(0, 0, 0, 0));
                    return date < minDate;
                  }}
                  onChange={(date) => {
                    if (date) setEndDate(format(date, 'yyyy-MM-dd'));
                  }}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Reason for Leave</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="Please provide a valid reason..."
                  className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 min-h-[120px] shadow-sm font-medium resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-purple-500/40 dark:hover:border-purple-400/40 hover:shadow-md hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 transition-all duration-300"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            type="submit"
            form="leave-form"
            className="rounded-xl font-bold h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Request
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
