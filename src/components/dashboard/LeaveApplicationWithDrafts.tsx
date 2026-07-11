import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2, Send, Save, FileText, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Draft {
  id: string;
  leaveType: string;
  emergencyContact: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachment?: { name: string; size: number };
}

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
  const [emergencyContact, setEmergencyContact] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drafts State
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Load drafts on mount
  useEffect(() => {
    const stored = localStorage.getItem('hindustaan_leave_drafts_list');
    if (stored) {
      try {
        setDrafts(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading drafts', e);
      }
    }
  }, []);

  // Sync drafts to local storage
  const saveDraftsToStorage = (updatedDrafts: Draft[]) => {
    setDrafts(updatedDrafts);
    localStorage.setItem('hindustaan_leave_drafts_list', JSON.stringify(updatedDrafts));
  };

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile({ name: file.name, size: file.size });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile({ name: file.name, size: file.size });
    }
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save Draft (Bypasses Validation Schema)
  const handleSaveDraft = () => {
    const newDraft: Draft = {
      id: Date.now().toString(),
      leaveType,
      emergencyContact,
      startDate,
      endDate,
      reason,
      attachment: selectedFile || undefined,
    };

    const updated = [newDraft, ...drafts];
    saveDraftsToStorage(updated);

    toast.success('Leave application saved as draft.');
  };

  // Edit Draft
  const handleEditDraft = (draft: Draft) => {
    setLeaveType(draft.leaveType);
    setEmergencyContact(draft.emergencyContact);
    setStartDate(draft.startDate);
    setEndDate(draft.endDate);
    setReason(draft.reason);
    setSelectedFile(draft.attachment || null);

    toast.info('Draft loaded into form fields.');
  };

  // Delete Draft
  const handleDeleteDraft = (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    saveDraftsToStorage(updated);
    toast.error('Draft deleted.');
  };

  // Rapid Submit Draft (Re-runs Strict validation)
  const handleRapidSubmit = (draft: Draft) => {
    if (!draft.startDate || !draft.endDate || !draft.reason) {
      toast.error('Validation Failed', {
        description: 'Draft is missing required fields (Dates or Reason).'
      });
      return;
    }

    const start = parseLocalDate(draft.startDate);
    const end = parseLocalDate(draft.endDate);

    if (start > end) {
      toast.error('Validation Failed', {
        description: 'Start date cannot be after End date.'
      });
      return;
    }

    const success = onSubmitLeave({
      type: draft.leaveType,
      emergencyContact: draft.emergencyContact,
      startDate: draft.startDate,
      endDate: draft.endDate,
      reason: draft.reason,
    });

    if (success) {
      // Remove from drafts
      const updated = drafts.filter(d => d.id !== draft.id);
      saveDraftsToStorage(updated);
      toast.success('Leave application submitted successfully!');
    }
  };

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

    if (start > end) {
      toast.error('Invalid Date Range', {
        description: 'Start date cannot be after End date.'
      });
      return;
    }

    const success = onSubmitLeave({
      type: leaveType,
      emergencyContact,
      startDate,
      endDate,
      reason,
    });

    if (success) {
      // Reset form
      setLeaveType('casual');
      setEmergencyContact('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      toast.success('Leave application submitted.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Leave Application Form */}
      <Card className="lg:col-span-2 border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-6">
          <CardTitle className="text-xl font-bold">Apply for Leave</CardTitle>
          <CardDescription>Submit a new leave request. Subject to manager approval.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form id="leave-form" onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Emergency Contact Number</Label>
                <Input
                  type="tel"
                  placeholder="+91"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 h-12 shadow-sm font-medium text-slate-900 dark:text-slate-100 hover:border-purple-500/40 dark:hover:border-purple-400/40 hover:shadow-md hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 transition-all duration-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 h-12 shadow-sm font-medium text-slate-900 dark:text-slate-100 dark:[color-scheme:dark] hover:border-purple-500/40 dark:hover:border-purple-400/40 hover:shadow-md hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700 dark:text-slate-300">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="rounded-xl bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-700 h-12 shadow-sm font-medium text-slate-900 dark:text-slate-100 dark:[color-scheme:dark] hover:border-purple-500/40 dark:hover:border-purple-400/40 hover:shadow-md hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 transition-all duration-300"
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

              <div className="space-y-2 md:col-span-2">
                <Label className="font-bold text-slate-700 dark:text-slate-300">Attachment (Optional)</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".svg,.png,.jpg,.jpeg,.pdf"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group shadow-sm",
                    selectedFile
                      ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                      : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 hover:border-purple-500/40 dark:hover:border-purple-400/40 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:shadow-md hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10"
                  )}
                >
                  {selectedFile ? (
                    <>
                      <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedFile.name}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearFile}
                        className="mt-4 h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        Remove File
                      </Button>
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
        <CardFooter className="p-6 md:p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={handleSaveDraft}
            className="rounded-xl font-bold h-12 px-6 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            type="submit"
            form="leave-form"
            className="rounded-xl font-bold h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit Request
          </Button>
        </CardFooter>
      </Card>

      {/* Saved Drafts Panel */}
      <Card className="lg:col-span-1 border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-950/40 backdrop-blur-2xl shadow-xl rounded-3xl overflow-hidden flex flex-col">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Saved Drafts
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">
            Manage your unsubmitted leave requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 flex-1 overflow-y-auto space-y-3">
          {drafts.length > 0 ? (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-3 my-1 rounded-xl bg-white/80 dark:bg-slate-950/50 border border-transparent flex flex-col gap-2 hover:border-purple-500/40 dark:hover:border-purple-400/40 hover:shadow-md hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25">
                    {draft.leaveType}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {draft.startDate ? format(parseLocalDate(draft.startDate), 'MMM d') : '—'}
                    {' '}-{' '}
                    {draft.endDate ? format(parseLocalDate(draft.endDate), 'MMM d') : '—'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                  {draft.reason || "No reason specified."}
                </p>

                {draft.attachment && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate bg-slate-50 dark:bg-slate-900/60 p-1 px-2 rounded-lg border border-slate-200 dark:border-slate-800 w-fit max-w-full">
                    <FileText className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                    <span className="truncate">{draft.attachment.name}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditDraft(draft)}
                    className="h-8 w-8 text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    title="Edit Draft"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="h-8 w-8 text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    title="Delete Draft"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFormSubmit} // Form submit logic for drafts
                    className="h-8 w-8 text-emerald-500 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-900"
                    title="Submit Draft"
                    onClickCapture={() => handleRapidSubmit(draft)}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/20">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">No saved drafts found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
