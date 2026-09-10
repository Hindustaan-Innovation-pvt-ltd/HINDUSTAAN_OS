import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Upload, FileSpreadsheet, Download, Send, 
  Trash2, AlertCircle, CheckCircle2, RefreshCw, X, Table
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDateToCustom } from './EmailComposerModal';

export interface BulkRecipientItem {
  id: string;
  name: string;
  email: string;
  role: string;
  stipend: string;
  startDate: string;
  duration: string;
}

interface BulkCsvImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
  attachments?: Array<{ filename: string; content: string; contentType: string }>;
  onSuccess?: () => void;
}

export default function BulkCsvImportModal({
  open,
  onOpenChange,
  subjectTemplate,
  htmlTemplate,
  textTemplate,
  attachments,
  onSuccess
}: BulkCsvImportModalProps) {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste'>('paste');
  const [rawPastedText, setRawPastedText] = useState('');
  const [parsedRows, setParsedRows] = useState<BulkRecipientItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [dispatchResults, setDispatchResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    details: Array<{ email: string; name?: string; success: boolean; error?: string }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV or TSV string into structured rows
  const parseDataString = (text: string) => {
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return;

    // Detect delimiter: comma, tab, or semicolon
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';

    const parseLine = (line: string): string[] => {
      // Simple regex parser for quoted or unquoted columns
      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          values.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^"|"$/g, ''));
      return values;
    };

    const headerTokens = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    const hasHeader = headerTokens.some(h => ['email', 'mail', 'name', 'candidate'].includes(h));

    let emailIdx = headerTokens.findIndex(h => h.includes('email') || h.includes('mail'));
    let nameIdx = headerTokens.findIndex(h => h.includes('name') || h.includes('candidate'));
    let roleIdx = headerTokens.findIndex(h => h.includes('role') || h.includes('position') || h.includes('title'));
    let stipendIdx = headerTokens.findIndex(h => h.includes('stipend') || h.includes('ctc') || h.includes('salary'));
    let startIdx = headerTokens.findIndex(h => h.includes('start') || h.includes('date') || h.includes('joining'));
    let durationIdx = headerTokens.findIndex(h => h.includes('duration') || h.includes('tenure') || h.includes('period'));

    // Default column fallback if no explicit header
    if (emailIdx === -1) emailIdx = 1;
    if (nameIdx === -1) nameIdx = 0;
    if (roleIdx === -1) roleIdx = 2;
    if (stipendIdx === -1) stipendIdx = 3;
    if (startIdx === -1) startIdx = 4;
    if (durationIdx === -1) durationIdx = 5;

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const items: BulkRecipientItem[] = [];

    dataLines.forEach((line, index) => {
      const parts = parseLine(line);
      const email = (parts[emailIdx] || '').trim();
      const name = (parts[nameIdx] || parts[0] || '').trim();
      const role = (parts[roleIdx] || 'Full Stack Intern').trim();
      const stipend = (parts[stipendIdx] || '₹15,000 / month').trim();
      const rawStartDate = (parts[startIdx] || new Date().toISOString().slice(0, 10)).trim();
      const startDate = formatDateToCustom(rawStartDate) || '08-Sep-2026';
      const duration = (parts[durationIdx] || '3 Months').trim();

      if (email && email.includes('@')) {
        items.push({
          id: `row-${index}-${Date.now()}`,
          name: name || email.split('@')[0],
          email,
          role,
          stipend,
          startDate,
          duration
        });
      }
    });

    setParsedRows(items);
    if (items.length > 0) {
      toast.success(`Parsed ${items.length} valid recipient records!`);
    } else {
      toast.error('No valid email addresses found in the data');
    }
  };

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawPastedText(content);
        parseDataString(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download Sample CSV template
  const handleDownloadSampleCsv = () => {
    const sample = `Name,Email,Role,Stipend,StartDate,Duration
Aarav Sharma,aarav@example.com,Full Stack Intern,₹15,000 / month,08-Sep-2026,3 Months
Priya Verma,priya@example.com,UI/UX Design Intern,₹12,000 / month,08-Sep-2026,3 Months
Rohan Mehta,rohan@example.com,Backend Engineer Intern,₹18,000 / month,15-Sep-2026,6 Months
Ananya Patel,ananya@example.com,Data Science Intern,₹15,000 / month,01-Oct-2026,3 Months`;

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'HindustanOS_Intern_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Remove a parsed row
  const handleRemoveRow = (id: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== id));
  };

  // Send Bulk Personalized Emails
  const handleSendBulkPersonalized = async () => {
    if (parsedRows.length === 0) {
      toast.error('Please upload or paste recipient details first');
      return;
    }

    try {
      setIsSending(true);
      setDispatchResults(null);

      const payload = {
        recipientsData: parsedRows.map(r => ({
          name: r.name,
          email: r.email,
          role: r.role,
          stipend: r.stipend,
          startDate: r.startDate,
          duration: r.duration
        })),
        subjectTemplate,
        htmlTemplate,
        textTemplate,
        attachments
      };

      const res = await api.post('/email/send-personalized-bulk', payload);
      if (res.data?.success && res.data.data) {
        setDispatchResults(res.data.data);
        toast.success(`Dispatched ${res.data.data.successful}/${res.data.data.total} personalized letters successfully!`);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch bulk personalized emails');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[850px] w-[92vw] max-h-[88vh] p-0 overflow-hidden bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col shadow-2xl z-50">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Bulk Personalized Email Dispatch
                <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px] font-bold">
                  20+ Recipients
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Upload a CSV or paste Excel data. Each intern receives a customized letter with their specific name & terms.
              </DialogDescription>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadSampleCsv}
            className="text-xs font-bold gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-orange-500" />
            Sample CSV Template
          </Button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
          
          {/* Tabs: Paste vs File Upload */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveInputTab('paste')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeInputTab === 'paste'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Table className="h-3.5 w-3.5 inline mr-1.5" />
                Paste Rows (Excel / Sheets)
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('upload')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeInputTab === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload className="h-3.5 w-3.5 inline mr-1.5" />
                Upload CSV File
              </button>
            </div>

            {parsedRows.length > 0 && (
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold px-2.5 py-1">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                {parsedRows.length} Interns Ready
              </Badge>
            )}
          </div>

          {/* Paste Section */}
          {activeInputTab === 'paste' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Paste Tab-separated or Comma-separated Data:</span>
                <span className="text-[11px] text-slate-400 font-normal">Columns: Name, Email, Role, Stipend, StartDate, Duration</span>
              </label>
              <Textarea
                placeholder="Example:&#10;Aarav Sharma	aarav@example.com	Full Stack Intern	₹15,000 / month	2026-09-15	3 Months&#10;Priya Verma	priya@example.com	UI/UX Intern	₹12,000 / month	2026-09-15	3 Months"
                value={rawPastedText}
                onChange={(e) => {
                  setRawPastedText(e.target.value);
                  parseDataString(e.target.value);
                }}
                className="text-xs font-mono rounded-xl min-h-[120px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>
          )}

          {/* File Upload Section */}
          {activeInputTab === 'upload' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileSpreadsheet className="h-10 w-10 text-indigo-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Click to browse or drop your .CSV spreadsheet here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Standard format: Name, Email, Role, Stipend, StartDate, Duration
              </p>
            </div>
          )}

          {/* Parsed Recipients Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Preview Individual Letter Recipients ({parsedRows.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParsedRows([]);
                    setRawPastedText('');
                  }}
                  className="text-xs text-rose-500 hover:underline cursor-pointer font-bold"
                >
                  Clear All
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[650px] text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Role</th>
                      <th className="p-2.5">Stipend</th>
                      <th className="p-2.5">Start Date</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                    {parsedRows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 text-slate-400 font-medium">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{row.name}</td>
                        <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-medium">{row.email}</td>
                        <td className="p-2.5">{row.role}</td>
                        <td className="p-2.5 font-semibold text-emerald-600 dark:text-emerald-400">{row.stipend}</td>
                        <td className="p-2.5 font-medium text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                            {row.startDate}
                          </span>
                        </td>
                        <td className="p-2.5">{row.duration}</td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Execution Results Summary */}
          {dispatchResults && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Bulk Dispatch Completed: {dispatchResults.successful}/{dispatchResults.total} delivered successfully
              </div>
              {dispatchResults.failed > 0 && (
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  {dispatchResults.failed} emails failed to deliver. Check server activity logs for details.
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Dispatch Action */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-bold rounded-xl cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSendBulkPersonalized}
            disabled={isSending || parsedRows.length === 0}
            className="text-xs font-bold h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 gap-2 cursor-pointer"
          >
            {isSending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Dispatching {parsedRows.length} Personalized Emails...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Dispatch {parsedRows.length} Personalized Letters Now
              </>
            )}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
