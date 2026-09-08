import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Mail, Sparkles, Send, Eye, Edit3, Printer, Download, RefreshCw, 
  X, Check, AlertCircle, FileText, CheckCircle2, ChevronRight, 
  Building2, UserCheck, ShieldCheck, Laptop, Smartphone, Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useUser } from '@/context/UserContext';

export interface EmailTemplateItem {
  id: string;
  name: string;
  category: string;
  subject: string;
  htmlBody: string;
  variables: string[];
  isDefault: boolean;
}

interface EmailComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialRecipient?: string;
  initialCategory?: string;
}

export default function EmailComposerModal({
  open,
  onOpenChange,
  onSuccess,
  initialRecipient = '',
  initialCategory = 'internship'
}: EmailComposerModalProps) {
  const { user } = useUser();
  const role = user?.role || 'admin';
  const isManager = role === 'manager';

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Active email content
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [isEditablePreview, setIsEditablePreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // AI Generation inputs
  const [candidateName, setCandidateName] = useState('');
  const [candidateRole, setCandidateRole] = useState('Full Stack Intern');
  const [stipend, setStipend] = useState('₹15,000 / month');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState('3 Months');
  const [tone, setTone] = useState('Formal & Encouraging');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [lastSummary, setLastSummary] = useState('');

  // Recipients
  const [recipientsList, setRecipientsList] = useState<string[]>(initialRecipient ? [initialRecipient] : []);
  const [newRecipientInput, setNewRecipientInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Fetch templates on mount
  useEffect(() => {
    if (open) {
      fetchTemplates();
      if (initialRecipient && !recipientsList.includes(initialRecipient)) {
        setRecipientsList([initialRecipient]);
      }
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await api.get('/email/templates');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const list = res.data.data as EmailTemplateItem[];
        setTemplates(list);

        // Select initial template
        const match = list.find(t => t.category === initialCategory) || list[0];
        if (match) {
          applyTemplate(match);
        }
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const applyTemplate = (t: EmailTemplateItem) => {
    setSelectedTemplateId(t.id);
    setSubject(t.subject);
    
    // Fill placeholders with initial values if available
    let body = t.htmlBody;
    const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const randomRef = Math.floor(1000 + Math.random() * 9000).toString();

    body = body
      .replace(/{{referenceId}}/g, randomRef)
      .replace(/{{currentDate}}/g, todayStr)
      .replace(/{{candidateName}}/g, candidateName || 'Aarav Sharma')
      .replace(/{{role}}/g, candidateRole || 'Software Engineer Intern')
      .replace(/{{stipend}}/g, stipend || '₹15,000 / month')
      .replace(/{{startDate}}/g, startDate || todayStr)
      .replace(/{{duration}}/g, duration || '3 Months')
      .replace(/{{reportingManager}}/g, user?.name || 'Engineering Operations');

    setHtmlBody(body);
  };

  const handleTemplateChange = (id: string) => {
    const found = templates.find(t => t.id === id);
    if (found) {
      applyTemplate(found);
    }
  };

  // AI Generation with Groq
  const handleGenerateWithAi = async () => {
    try {
      setIsGeneratingAi(true);
      const currentT = templates.find(t => t.id === selectedTemplateId);
      
      const payload = {
        templateCategory: currentT?.category || 'internship',
        candidateName: candidateName || 'Candidate',
        candidateEmail: recipientsList[0] || '',
        role: candidateRole || 'Software Engineer',
        stipend,
        startDate,
        duration,
        tone,
        prompt: customPrompt
      };

      const res = await api.post('/email/ai-generate', payload);
      if (res.data?.success && res.data.data) {
        setSubject(res.data.data.subject || subject);
        setHtmlBody(res.data.data.htmlBody || htmlBody);
        setLastSummary(res.data.data.summary || 'Draft generated by Groq AI');
        toast.success('Generated in ~0.10s via Groq AI!', {
          description: res.data.data.summary
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate with AI');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Quick Refine with AI
  const handleQuickRefine = async (instruction: string) => {
    if (!htmlBody) {
      toast.error('Please generate or select a template first');
      return;
    }
    try {
      setIsGeneratingAi(true);
      const res = await api.post('/email/ai-generate', {
        isRefine: true,
        currentSubject: subject,
        currentHtml: htmlBody,
        instruction
      });
      if (res.data?.success && res.data.data) {
        setSubject(res.data.data.subject || subject);
        setHtmlBody(res.data.data.htmlBody || htmlBody);
        setLastSummary(res.data.data.summary || 'Refined by Groq AI');
        toast.success(`Refined: "${instruction}"`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to refine draft');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Recipient Management with Manager restriction
  const addRecipient = (target?: string) => {
    const value = (target || newRecipientInput).trim();
    if (!value) return;
    const items = value.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);

    if (isManager) {
      const restricted = items.some(item => 
        ['all', 'managers', 'admins', 'admin', 'manager'].includes(item.toLowerCase())
      );
      if (restricted) {
        toast.error('Managers can only send emails to Interns or Employees.');
        return;
      }
    }

    setRecipientsList(prev => Array.from(new Set([...prev, ...items])));
    setNewRecipientInput('');
  };

  const removeRecipient = (index: number) => {
    setRecipientsList(prev => prev.filter((_, i) => i !== index));
  };

  // Print / Save as PDF
  const handlePrintOrPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up blocked. Please allow popups to print/save PDF.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${subject || 'Hindustan OS Document'}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              @page { size: A4; margin: 15mm; }
            }
            body { font-family: Arial, sans-serif; background: #fff; padding: 20px; }
          </style>
        </head>
        <body>
          ${htmlBody}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Send Email Dispatch
  const handleSendEmail = async () => {
    let finalRecipients = [...recipientsList];
    if (newRecipientInput.trim()) {
      const extra = newRecipientInput.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
      finalRecipients = Array.from(new Set([...finalRecipients, ...extra]));
      setRecipientsList(finalRecipients);
      setNewRecipientInput('');
    }

    if (finalRecipients.length === 0) {
      toast.error('Please specify at least one recipient email address or target role');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter an email subject');
      return;
    }

    if (!htmlBody.trim()) {
      toast.error('Email body cannot be empty');
      return;
    }

    if (isManager) {
      const restricted = finalRecipients.some(item => 
        ['all', 'managers', 'admins', 'admin', 'manager'].includes(item.toLowerCase())
      );
      if (restricted) {
        toast.error('Managers can only send emails to Interns or Employees.');
        return;
      }
    }

    try {
      setIsSending(true);
      const isBulk = finalRecipients.length > 1 || ['all', 'interns', 'managers', 'admins', 'employees'].includes(finalRecipients[0]?.toLowerCase());
      const endpoint = isBulk ? '/email/send-bulk' : '/email/send';
      
      const payload = isBulk
        ? {
            recipients: finalRecipients,
            subject,
            html: htmlBody
          }
        : {
            to: finalRecipients[0],
            subject,
            html: htmlBody
          };

      const res = await api.post(endpoint, payload);
      if (res.data?.success) {
        if (isBulk) {
          const stats = res.data.data;
          toast.success(`Bulk Dispatch Complete: ${stats.successful}/${stats.total} delivered successfully!`);
        } else {
          toast.success(`Email dispatched to ${finalRecipients[0]} successfully!`);
        }
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] h-[92vh] max-h-[95vh] p-0 gap-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col shadow-2xl">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Email & Letterhead Composer
                <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[10px] font-bold px-2">
                  <Sparkles className="h-3 w-3 mr-1 inline" /> Groq AI Enabled
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Compose, customize with AI, preview live letterheads, and dispatch verified corporate communications.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintOrPdf}
              className="text-xs font-semibold gap-1.5 rounded-xl border-slate-200 dark:border-slate-800"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Main Body: 2 Columns */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: Template Selection & Composer Controls */}
          <div className="w-[46%] border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto">
            
            {/* Template Chooser Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-orange-500" /> Choose Pre-Fixed Template
              </label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select official template..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <span className="font-semibold">{t.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({t.category})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode Switch Tabs */}
            <div className="p-4 flex-1">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
                  <TabsTrigger value="ai" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600">
                    <Wand2 className="h-3.5 w-3.5 text-orange-500" /> AI Assistant (Groq)
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600">
                    <Edit3 className="h-3.5 w-3.5 text-slate-500" /> Manual Customizer
                  </TabsTrigger>
                </TabsList>

                {/* AI Assistant Tab Content */}
                <TabsContent value="ai" className="space-y-3.5 mt-0">
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>Fill candidate requirements or prompt instructions below. Groq AI will draft a complete legal, structured corporate letter in 0.1s.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Candidate / User Name</label>
                      <Input
                        placeholder="e.g. Aarav Sharma"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        className="text-xs rounded-xl h-8 bg-slate-50 dark:bg-slate-800/60"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Role / Designation</label>
                      <Input
                        placeholder="e.g. Frontend Intern"
                        value={candidateRole}
                        onChange={(e) => setCandidateRole(e.target.value)}
                        className="text-xs rounded-xl h-8 bg-slate-50 dark:bg-slate-800/60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Stipend / CTC</label>
                      <Input
                        placeholder="e.g. ₹15,000/mo"
                        value={stipend}
                        onChange={(e) => setStipend(e.target.value)}
                        className="text-xs rounded-xl h-8 bg-slate-50 dark:bg-slate-800/60"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-xs rounded-xl h-8 bg-slate-50 dark:bg-slate-800/60"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Duration</label>
                      <Input
                        placeholder="e.g. 6 Months"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="text-xs rounded-xl h-8 bg-slate-50 dark:bg-slate-800/60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Tone & Communication Style</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Formal & Professional', 'Warm & Encouraging', 'Direct & Concise', 'Performance Oriented'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTone(t)}
                          className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                            tone === t
                              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-orange-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Custom Instructions / Specific Clauses
                    </label>
                    <Textarea
                      placeholder="e.g., Include 3-month probation period, remote work flexibility, and reporting to senior tech lead."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="text-xs rounded-xl min-h-[60px] bg-slate-50 dark:bg-slate-800/60"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleGenerateWithAi}
                    disabled={isGeneratingAi}
                    className="w-full rounded-xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/20 text-xs py-2"
                  >
                    {isGeneratingAi ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" />
                        Generating via Groq (0.1s)...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-2" />
                        Generate / Rewrite with Groq AI
                      </>
                    )}
                  </Button>

                  {/* AI Quick Polish Chips */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5">Quick AI Refinement:</span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={isGeneratingAi}
                        onClick={() => handleQuickRefine('Make this offer letter more formal, authoritative, and legally rigorous.')}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        + More Formal
                      </button>
                      <button
                        type="button"
                        disabled={isGeneratingAi}
                        onClick={() => handleQuickRefine('Add a strict non-disclosure, intellectual property, and confidentiality clause.')}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        + Add NDA Clause
                      </button>
                      <button
                        type="button"
                        disabled={isGeneratingAi}
                        onClick={() => handleQuickRefine('Make it warm, welcoming, and highlight team culture and mentorship.')}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        + Welcoming Tone
                      </button>
                      <button
                        type="button"
                        disabled={isGeneratingAi}
                        onClick={() => handleQuickRefine('Condense this letter into crisp, bulleted terms while maintaining legal validity.')}
                        className="text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        + Shorten / Bullets
                      </button>
                    </div>
                  </div>
                </TabsContent>

                {/* Manual Customizer Tab */}
                <TabsContent value="manual" className="space-y-3 mt-0">
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-[11px] text-slate-600 dark:text-slate-400">
                    Replace placeholders in the active template directly or edit raw HTML content below.
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Subject Line</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="text-xs rounded-xl h-8 bg-slate-50 dark:bg-slate-800/60 font-semibold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Direct HTML Body</label>
                      <span className="text-[10px] text-slate-400">Or use In-Place editor in Preview</span>
                    </div>
                    <Textarea
                      value={htmlBody}
                      onChange={(e) => setHtmlBody(e.target.value)}
                      className="text-xs font-mono rounded-xl min-h-[220px] bg-slate-50 dark:bg-slate-800/60"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Bottom Recipient & Sending Area */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
              
              {/* Recipient Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Recipients ({recipientsList.length})
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">Target:</span>
                    {!isManager && (
                      <>
                        <button type="button" onClick={() => addRecipient('all')} className="text-[10px] font-bold text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded">+ All</button>
                        <button type="button" onClick={() => addRecipient('managers')} className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">+ Managers</button>
                      </>
                    )}
                    <button type="button" onClick={() => addRecipient('interns')} className="text-[10px] font-bold text-indigo-600 bg-indigo-500/10 px-1.5 py-0.5 rounded">+ Interns</button>
                    <button type="button" onClick={() => addRecipient('employees')} className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">+ Employees</button>
                  </div>
                </div>

                {/* Recipient Badges */}
                <div className="min-h-[38px] p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center gap-1.5 mb-2">
                  {recipientsList.length === 0 && (
                    <span className="text-[11px] text-slate-400 pl-1">No recipient added yet.</span>
                  )}
                  {recipientsList.map((rec, idx) => (
                    <Badge key={idx} className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">
                      {rec}
                      <button type="button" onClick={() => removeRecipient(idx)} className="hover:text-rose-500">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Add Email Bar */}
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Enter email address..."
                    value={newRecipientInput}
                    onChange={(e) => setNewRecipientInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addRecipient();
                      }
                    }}
                    className="text-xs h-8 rounded-xl bg-white dark:bg-slate-900"
                  />
                  <Button
                    type="button"
                    onClick={() => addRecipient()}
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs font-bold rounded-xl"
                  >
                    + Add
                  </Button>
                </div>
                {isManager && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Note: Managers can only dispatch emails to Interns & Employees.
                  </p>
                )}
              </div>

              {/* Final Dispatch Button */}
              <Button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending || isGeneratingAi}
                className="w-full h-10 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-lg text-xs gap-2"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Dispatching via SMTP...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 text-orange-500" />
                    Review & Dispatch Official Email
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Live Realtime Preview & In-Place Editor */}
          <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
            
            {/* Preview Toolbar */}
            <div className="px-5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-orange-500" /> Live Render Preview
                </span>
                {lastSummary && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1 inline" /> AI Synchronized
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Device Viewport Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded text-xs transition-colors ${previewDevice === 'desktop' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'}`}
                    title="Desktop Preview"
                  >
                    <Laptop className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded text-xs transition-colors ${previewDevice === 'mobile' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'}`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* In-Place WYSIWYG Editable Toggle */}
                <button
                  type="button"
                  onClick={() => setIsEditablePreview(!isEditablePreview)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                    isEditablePreview
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {isEditablePreview ? 'Editing Enabled (Click to edit text)' : 'Click-to-Edit'}
                </button>
              </div>
            </div>

            {/* Email Subject Header Bar in Preview */}
            <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Subject:</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="flex-1 bg-transparent border-none text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden"
              />
            </div>

            {/* Rendered Container */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
              <div
                className={`transition-all duration-300 ${
                  previewDevice === 'mobile'
                    ? 'w-[380px] shadow-2xl rounded-3xl border-4 border-slate-700 overflow-hidden bg-white p-2'
                    : 'w-full max-w-[700px] shadow-xl rounded-xl bg-white'
                }`}
              >
                {/* WYSIWYG Editable or Rendered Div */}
                <div
                  contentEditable={isEditablePreview}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    if (isEditablePreview) {
                      setHtmlBody(e.currentTarget.innerHTML);
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: htmlBody || '<p style="padding: 20px; color: #94a3b8; text-align: center;">No template selected.</p>' }}
                  className={`min-h-[460px] p-2 focus:outline-none transition-all ${
                    isEditablePreview ? 'outline-2 outline-orange-400 outline-dashed rounded-lg' : ''
                  }`}
                />
              </div>
            </div>

            {/* Footer Status */}
            <div className="px-6 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Hindustan Innovation Official Letterhead Protocol</span>
              <span>Nodemailer SMTP & Groq AI Engine</span>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
