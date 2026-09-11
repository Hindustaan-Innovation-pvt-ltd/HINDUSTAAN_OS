import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, RotateCcw, Loader2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ProjectDatePicker, type LeaveDateSelection } from '@/components/ui/project-date-picker';
import { useUser } from '@/context/UserContext';
import api from '@/lib/api';

interface LeaveApplicationWithDraftsProps {
  role?: string;
  onSubmitLeave: (leave: {
    type: string;
    customType?: string;
    emergencyContact: string;
    startDate: string;
    endDate?: string;
    dates?: string[];
    reason: string;
  }) => boolean;
}

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatSelectedDatesPhrase = (
  dateSelection: LeaveDateSelection | null,
  fallbackStartDate?: string
): string => {
  if (dateSelection && dateSelection.totalDays > 0) {
    if (dateSelection.totalDays === 1 && dateSelection.startDate) {
      try {
        const d = parseLocalDate(dateSelection.startDate);
        return `on ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      } catch {
        return `on ${dateSelection.startDate}`;
      }
    } else if (dateSelection.mode === 'range' && dateSelection.startDate && dateSelection.endDate) {
      try {
        const s = parseLocalDate(dateSelection.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const e = parseLocalDate(dateSelection.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        return `from ${s} to ${e} (${dateSelection.totalDays} days)`;
      } catch {
        return `from ${dateSelection.startDate} to ${dateSelection.endDate} (${dateSelection.totalDays} days)`;
      }
    } else if (dateSelection.dates && dateSelection.dates.length > 0) {
      try {
        const formattedList = dateSelection.dates.map(ds => {
          const d = parseLocalDate(ds);
          return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        });
        if (formattedList.length === 1) {
          return `on ${formattedList[0]}`;
        }
        if (formattedList.length <= 6) {
          const last = formattedList.pop();
          return `on ${formattedList.join(', ')} and ${last} (${dateSelection.totalDays} days)`;
        } else {
          return `on ${formattedList.slice(0, 4).join(', ')} and ${formattedList.length - 4} other dates (${dateSelection.totalDays} days)`;
        }
      } catch {
        return `on ${dateSelection.dates.join(', ')} (${dateSelection.totalDays} days)`;
      }
    }
  } else if (fallbackStartDate) {
    try {
      const d = parseLocalDate(fallbackStartDate);
      return `on ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } catch {
      return `on ${fallbackStartDate}`;
    }
  }
  return 'the upcoming scheduled date';
};

export function LeaveApplicationWithDrafts({ onSubmitLeave, role }: LeaveApplicationWithDraftsProps) {
  const { user } = useUser();

  // Form State
  const [leaveType, setLeaveType] = useState('casual');
  const [customType, setCustomType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dateSelection, setDateSelection] = useState<LeaveDateSelection | null>(null);
  const [reason, setReason] = useState('');

  // AI & Custom Instruction State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [customInstruction, setCustomInstruction] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const instructionInputRef = useRef<HTMLInputElement | null>(null);

  // High-reliability instant draft generator for smooth UX
  const generateInstantDraft = (customInst?: string) => {
    const applicant = user?.name || 'Bhupesh';
    const typeLabel = leaveType === 'other'
      ? (customType.trim() || 'Leave')
      : leaveType === 'casual'
      ? 'Casual Leave'
      : leaveType === 'sick'
      ? 'Sick Leave'
      : leaveType === 'emergency'
      ? 'Emergency Leave'
      : leaveType === 'wfh'
      ? 'Work From Home'
      : (leaveType.charAt(0).toUpperCase() + leaveType.slice(1) + ' Leave');

    const formattedDate = formatSelectedDatesPhrase(dateSelection, startDate);
    const rawNotes = (customInst !== undefined ? customInst : customInstruction).trim() || reason.trim();

    let bodySentence = `I would like to request ${typeLabel.toLowerCase()} ${formattedDate}.`;
    if (rawNotes) {
      bodySentence = `I would like to request ${typeLabel.toLowerCase()} ${formattedDate} to attend to a personal commitment, specifically: ${rawNotes}.`;
    }
    return `Dear HR,\n\n${bodySentence} I will ensure my pending tasks are updated and hand over any urgent work before leaving.\n\nThank you for your consideration.\n\nBest regards,\n${applicant}`;
  };

  // AI Generation & Refinement Handler
  const handleAiDraft = async (instructionOverride?: string) => {
    if (isAiLoading) return;

    const displayType = leaveType === 'other' ? (customType.trim() || 'Custom Leave') : leaveType;
    const activeInstruction = instructionOverride !== undefined ? instructionOverride : customInstruction.trim();
    const formattedDate = formatSelectedDatesPhrase(dateSelection, startDate);

    // 1. Immediately populate textarea so the user never gets an empty box
    const immediateDraft = generateInstantDraft(activeInstruction);
    setHistory((prev) => (reason.trim() && reason.trim() !== immediateDraft.trim() ? [...prev, reason] : prev));
    setReason(immediateDraft);

    // Focus & scroll textarea into view immediately
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);

    setIsAiLoading(true);
    try {
      const res = await api.post('/leaves/ai-draft', {
        leaveType: displayType,
        customType: leaveType === 'other' ? customType.trim() : undefined,
        applicantName: user?.name || undefined,
        date: startDate || undefined,
        startDate: dateSelection?.startDate || startDate || undefined,
        endDate: dateSelection?.endDate || undefined,
        dates: dateSelection?.dates || undefined,
        formattedDate,
        totalDays: dateSelection?.totalDays || 1,
        reasonNotes: reason.trim() || undefined,
        currentText: reason.trim() || undefined,
        customInstruction: activeInstruction || undefined,
      });

      const generatedDraft = res.data?.data?.draft || res.data?.draft;
      if (generatedDraft && typeof generatedDraft === 'string' && generatedDraft.trim()) {
        setReason(generatedDraft.trim());

        const noteMessage = activeInstruction
          ? `Letter drafted with instruction: "${activeInstruction.slice(0, 35)}${activeInstruction.length > 35 ? '...' : ''}"`
          : 'Letter drafted with selected dates';

        toast.success('Letter Ready', {
          description: noteMessage,
        });
      } else {
        toast.success('Letter Ready', {
          description: 'Formatted leave letter prepared below.',
        });
      }
    } catch (err: any) {
      toast.success('Draft Ready', {
        description: 'Formatted leave letter prepared and inserted below.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // Undo Handler
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setReason(previous);
    toast.info('Reverted to previous draft');
  };

  // Keyboard shortcut listener: Ctrl + L (or Cmd + L) focuses instruction input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        instructionInputRef.current?.focus();
        instructionInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Form Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !reason.trim()) {
      toast.error('Missing Fields', {
        description: 'Please select a leave date and provide a reason.',
      });
      return;
    }

    if (leaveType === 'other' && !customType.trim()) {
      toast.error('Missing Custom Leave Type', {
        description: 'Please specify your custom leave type.',
      });
      return;
    }

    const start = parseLocalDate(startDate);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    if (start < todayMidnight) {
      toast.error('Invalid Date', {
        description: 'Leave date cannot be in the past. Only today or future dates are allowed.',
      });
      return;
    }

    const success = onSubmitLeave({
      type: leaveType,
      customType: leaveType === 'other' ? customType.trim() : undefined,
      emergencyContact: 'N/A',
      startDate,
      endDate: dateSelection?.endDate || startDate,
      dates: dateSelection?.mode === 'multiple' ? dateSelection.dates : undefined,
      reason: reason.trim(),
    });

    if (success) {
      // Reset form
      setLeaveType('casual');
      setCustomType('');
      setStartDate('');
      setDateSelection(null);
      setReason('');
      setCustomInstruction('');
      setHistory([]);

      toast.success('Leave application submitted.', {
        description:
          role === 'manager' || role === 'admin'
            ? 'Awaiting admin approval. HR notified via email.'
            : 'Awaiting manager approval. HR notified via email.',
      });
    }
  };

  const quickInstructions = [
    { label: '📞 Reachable on call', value: 'Mention that I will remain reachable on phone for urgent matters' },
    { label: '🤝 Handover complete', value: 'Mention that all urgent tasks and handover notes have been given to team members' },
    { label: '⚡ Just 1 sentence', value: 'Keep the leave note strictly 1 short polite sentence' },
    { label: '🏥 Doctor visit', value: 'Mention medical consultation and doctor appointment scheduled' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-6">
          <CardTitle className="text-xl font-bold">Apply for Leave</CardTitle>
          <CardDescription>
            Submit a new leave request. Subject to {role === 'manager' || role === 'admin' ? 'admin' : 'manager'} approval. HR is notified via email.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form id="leave-form" onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leave Type Select */}
              <div className="space-y-2">
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
                    <SelectItem value="other" className="font-semibold text-purple-600 dark:text-purple-400">
                      + Other / Custom...
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Leave Date Picker (Single, Range & Custom Specific Dates) */}
              <div className="space-y-2 flex flex-col">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-700 dark:text-slate-300">Leave Date</Label>
                  {dateSelection && dateSelection.totalDays > 0 && (
                    <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full shadow-2xs">
                      {dateSelection.totalDays} {dateSelection.totalDays === 1 ? 'day' : 'days'} selected
                    </span>
                  )}
                </div>
                <ProjectDatePicker
                  placeholder="Pick date, range or specific dates"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  onDateSelectionChange={(sel) => {
                    setDateSelection(sel);
                    setStartDate(sel.startDate || '');
                  }}
                />
              </div>

              {/* Conditional Custom Leave Type Input */}
              {leaveType === 'other' && (
                <div className="space-y-2 md:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span>Specify Custom Leave Type</span>
                    <span className="text-xs font-normal text-purple-600 dark:text-purple-400">(e.g., Bereavement, Medical Examination, Personal Event)</span>
                  </Label>
                  <Input
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Enter custom leave type..."
                    required
                    className="rounded-xl bg-white dark:bg-slate-900/80 border-purple-300 dark:border-purple-700 h-12 shadow-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-purple-500"
                  />
                </div>
              )}

              {/* Reason for Leave + Integrated AI Assistant */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-slate-700 dark:text-slate-300">
                    Reason / Leave Letter
                  </Label>
                  {history.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleUndo}
                      disabled={isAiLoading}
                      className="rounded-lg h-7 px-2.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1 transition-all"
                      title="Undo last change"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Undo</span>
                    </Button>
                  )}
                </div>

                {/* Unified AI Instruction Bar */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-purple-50/90 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      <Input
                        ref={instructionInputRef}
                        value={customInstruction}
                        onChange={(e) => setCustomInstruction(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAiDraft();
                          }
                        }}
                        placeholder='Type your reason or instruction (e.g. "ganesh chaturthi", "doctor appointment")...'
                        className="h-10 pl-9 pr-3 text-xs bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-800/80 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-xl"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAiDraft()}
                      disabled={isAiLoading}
                      className="h-10 px-4 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shrink-0 gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer active:scale-95"
                    >
                      {isAiLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      <span>Write with Instruction</span>
                    </Button>
                  </div>

                  {/* Quick suggestion pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Quick suggestions:</span>
                    {quickInstructions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCustomInstruction(q.value);
                          handleAiDraft(q.value);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer font-medium"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editable Final Letter Textarea */}
                <Textarea
                  ref={textareaRef}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="Your leave letter will appear here automatically, or you can type directly..."
                  className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 min-h-[140px] shadow-sm font-medium resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-purple-500/40 dark:hover:border-purple-400/40 hover:shadow-md hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 transition-all duration-300 focus-visible:ring-purple-500 leading-relaxed"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            type="submit"
            form="leave-form"
            className="rounded-xl font-bold h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 transition-all"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Request
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
