import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Zap, FileText, RotateCcw, Loader2, Keyboard, Wand2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ProjectDatePicker } from '@/components/ui/project-date-picker';
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
    reason: string;
  }) => boolean;
}

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function LeaveApplicationWithDrafts({ onSubmitLeave, role }: LeaveApplicationWithDraftsProps) {
  const { user } = useUser();

  // Form State
  const [leaveType, setLeaveType] = useState('casual');
  const [customType, setCustomType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [reason, setReason] = useState('');

  // AI & Custom Instruction State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [customInstruction, setCustomInstruction] = useState('');
  const [showInstructionBox, setShowInstructionBox] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const instructionInputRef = useRef<HTMLInputElement | null>(null);

  // AI Generation & Refinement Handler
  const handleAiDraft = async (
    tone: 'standard' | 'crisp' | 'formal' = 'standard',
    instructionOverride?: string
  ) => {
    if (isAiLoading) return;

    const displayType = leaveType === 'other' ? (customType.trim() || 'Custom Leave') : leaveType;
    const activeInstruction = instructionOverride !== undefined ? instructionOverride : customInstruction.trim();

    setIsAiLoading(true);
    try {
      const res = await api.post('/leaves/ai-draft', {
        leaveType: displayType,
        customType: leaveType === 'other' ? customType.trim() : undefined,
        applicantName: user?.name || undefined,
        date: startDate || undefined,
        reasonNotes: reason.trim() || undefined,
        currentText: reason.trim() || undefined,
        customInstruction: activeInstruction || undefined,
        tone,
      });

      const generatedDraft = res.data?.data?.draft;
      if (generatedDraft) {
        // Push current text to undo history
        setHistory((prev) => [...prev, reason]);
        setReason(generatedDraft);

        const toneMessage = activeInstruction
          ? `Drafted following custom instruction: "${activeInstruction.slice(0, 45)}${activeInstruction.length > 45 ? '...' : ''}"`
          : tone === 'crisp'
          ? 'Refined into crisp 2-line minimalist note'
          : tone === 'formal'
          ? 'Refined into formal leave letter'
          : 'AI draft generated successfully';

        toast.success('AI Draft Updated', {
          description: toneMessage,
        });

        // Focus textarea for immediate review
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 100);
      }
    } catch (err: any) {
      toast.error('AI Drafting Failed', {
        description: err.response?.data?.message || err.message || 'Could not connect to AI service',
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

  // Keyboard shortcut listener: Ctrl + L (or Cmd + L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowInstructionBox(true);
        setTimeout(() => {
          instructionInputRef.current?.focus();
        }, 100);
        handleAiDraft('standard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [leaveType, customType, startDate, reason, customInstruction, isAiLoading]);

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
      reason: reason.trim(),
    });

    if (success) {
      // Reset form
      setLeaveType('casual');
      setCustomType('');
      setStartDate('');
      setReason('');
      setCustomInstruction('');
      setShowInstructionBox(false);
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

              {/* Single Leave Date Picker */}
              <div className="space-y-2 flex flex-col">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Leave Date</Label>
                <ProjectDatePicker
                  value={
                    startDate
                      ? (() => {
                          const d = new Date(startDate);
                          return isNaN(d.getTime()) ? undefined : d;
                        })()
                      : undefined
                  }
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  onChange={(date) => {
                    if (date) setStartDate(format(date, 'yyyy-MM-dd'));
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

              {/* Reason for Leave + AI Toolbar */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label className="font-bold text-slate-700 dark:text-slate-300">Reason for Leave</Label>

                  {/* AI & Refinement Actions Bar */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAiDraft('standard')}
                      disabled={isAiLoading}
                      className="rounded-lg h-7 px-2.5 text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 gap-1.5 transition-all shadow-xs"
                      title="Generate or enhance with AI (Shortcut: Ctrl + L)"
                    >
                      {isAiLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                      )}
                      <span>Draft with AI</span>
                      <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono opacity-70 bg-purple-200/50 dark:bg-purple-800/50 px-1 py-0.2 rounded">
                        <Keyboard className="h-2.5 w-2.5 inline mr-0.5" />
                        Ctrl+L
                      </kbd>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowInstructionBox((prev) => {
                          const next = !prev;
                          if (next) {
                            setTimeout(() => instructionInputRef.current?.focus(), 100);
                          }
                          return next;
                        });
                      }}
                      className={`rounded-lg h-7 px-2 text-xs font-medium border gap-1 transition-all ${
                        showInstructionBox
                          ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-700'
                          : 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40'
                      }`}
                      title="Add specific custom instruction for AI to follow"
                    >
                      <Wand2 className="h-3 w-3" />
                      <span>Custom Prompt</span>
                      {showInstructionBox ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAiDraft('crisp')}
                      disabled={isAiLoading}
                      className="rounded-lg h-7 px-2 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 gap-1"
                      title="Condense into 2 crisp minimalist lines"
                    >
                      <Zap className="h-3 w-3" />
                      <span>2-Line Minimalist</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAiDraft('formal')}
                      disabled={isAiLoading}
                      className="rounded-lg h-7 px-2 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1"
                      title="Make detailed and formal"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Formal</span>
                    </Button>

                    {history.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleUndo}
                        disabled={isAiLoading}
                        className="rounded-lg h-7 px-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 gap-1"
                        title="Undo AI changes"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Undo</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Collapsible Custom AI Instruction Box */}
                {showInstructionBox && (
                  <div className="p-3 rounded-2xl bg-linear-to-r from-purple-50/80 via-indigo-50/60 to-purple-50/80 dark:from-purple-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 dark:text-purple-200">
                        <Wand2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Custom AI Instruction</span>
                        <span className="font-normal text-[11px] text-purple-600/70 dark:text-purple-400/70">(AI will strictly shape the letter based on this)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowInstructionBox(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        ref={instructionInputRef}
                        value={customInstruction}
                        onChange={(e) => setCustomInstruction(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAiDraft('standard');
                          }
                        }}
                        placeholder='e.g., "Mention that I will be available on phone after 4 PM", "Sound urgent due to family emergency"...'
                        className="h-9 text-xs bg-white dark:bg-slate-900 border-purple-200 dark:border-purple-800/80 focus-visible:ring-purple-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAiDraft('standard')}
                        disabled={isAiLoading || (!customInstruction.trim() && !reason.trim())}
                        className="h-9 px-3.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shrink-0 gap-1.5 shadow-md shadow-purple-600/20"
                      >
                        {isAiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
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
                            handleAiDraft('standard', q.value);
                          }}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
                        >
                          {q.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Textarea
                  ref={textareaRef}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  placeholder="Enter reason or rough notes, or press Ctrl+L to draft with AI..."
                  className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 min-h-[130px] shadow-sm font-medium resize-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-purple-500/40 dark:hover:border-purple-400/40 hover:shadow-md hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 transition-all duration-300 focus-visible:ring-purple-500"
                />

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-1">
                  <span>
                    Tip: Click <strong>Custom Prompt</strong> or press <strong>Ctrl+L</strong> to give special instructions (e.g. handover, emergency, reachable hours).
                  </span>
                  {history.length > 0 && <span>Draft version: {history.length + 1}</span>}
                </div>
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
