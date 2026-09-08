import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Mail, Sparkles, Send, Eye, Edit3, Printer, RefreshCw, 
  X, Check, AlertCircle, FileText, CheckCircle2,
  Building2, ShieldCheck, Laptop, Smartphone, Wand2, Type, LayoutTemplate
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

  // Format toggle: Rich HTML letterhead vs Simple Plain Email
  const [emailFormat, setEmailFormat] = useState<'html' | 'text'>('html');

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Active email content
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [plainText, setPlainText] = useState('');
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

    // Also populate a clean plain-text version
    const stripped = body
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, '\n\n')
      .trim();
    setPlainText(stripped);
  };

  const handleTemplateChange = (id: string) => {
    const found = templates.find(t => t.id === id);
    if (found) {
      applyTemplate(found);
    }
  };

  // Switch format toggle (HTML vs Plain Text)
  const handleFormatToggle = (newFormat: 'html' | 'text') => {
    setEmailFormat(newFormat);
    if (newFormat === 'text' && !plainText && htmlBody) {
      // Convert HTML to clean readable text
      const text = htmlBody.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, '\n\n').trim();
      setPlainText(text);
    }
  };

  // AI Generation with Groq
  const handleGenerateWithAi = async () => {
    try {
      setIsGeneratingAi(true);
      const currentT = templates.find(t => t.id === selectedTemplateId);
      
      const payload = {
        format: emailFormat,
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
        if (res.data.data.textBody) {
          setPlainText(res.data.data.textBody);
        }
        setLastSummary(res.data.data.summary || 'Draft generated by Groq AI');
        toast.success(`Generated in ~0.10s via Groq AI (${emailFormat.toUpperCase()})!`, {
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
    const content = emailFormat === 'text' ? plainText : htmlBody;
    if (!content) {
      toast.error('Please generate or select a template first');
      return;
    }
    try {
      setIsGeneratingAi(true);
      const res = await api.post('/email/ai-generate', {
        format: emailFormat,
        isRefine: true,
        currentSubject: subject,
        currentContent: content,
        instruction
      });
      if (res.data?.success && res.data.data) {
        setSubject(res.data.data.subject || subject);
        setHtmlBody(res.data.data.htmlBody || htmlBody);
        if (res.data.data.textBody) {
          setPlainText(res.data.data.textBody);
        }
        setLastSummary(res.data.data.summary || 'Refined by Groq AI');
        toast.success(`Refined: "${instruction}"`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to refine draft');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Recipient Management
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

    const contentToPrint = emailFormat === 'html' ? htmlBody : `<div style="font-family: Arial, sans-serif; white-space: pre-wrap; padding: 20px; font-size: 14px; line-height: 1.6;">${plainText}</div>`;

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
          ${contentToPrint}
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

    const content = emailFormat === 'text' ? plainText : htmlBody;
    if (!content.trim()) {
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
      
      const payload: any = {
        subject
      };

      if (emailFormat === 'text') {
        payload.text = plainText;
        payload.html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; padding: 16px;">${plainText}</div>`;
      } else {
        payload.html = htmlBody;
      }

      if (isBulk) {
        payload.recipients = finalRecipients;
      } else {
        payload.to = finalRecipients[0];
      }

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
      <DialogContent 
        showCloseButton={true}
        className="!max-w-[96vw] sm:!max-w-[96vw] w-[96vw] h-[94vh] max-h-[96vh] p-0 gap-0 overflow-hidden bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col shadow-2xl z-50"
      >
        
        {/* Top Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Email & Letterhead Composer
                <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-[10px] font-bold px-2 py-0.5">
                  <Sparkles className="h-3 w-3 mr-1 inline" /> Groq AI (0.1s)
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 hidden sm:block">
                Draft official corporate offers, experience certificates, or clean plain emails with live preview.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-3 pr-8">
            {/* Format Selector: Rich HTML vs Plain Text */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleFormatToggle('html')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  emailFormat === 'html'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutTemplate className="h-3.5 w-3.5" />
                <span>Rich HTML Letterhead</span>
              </button>
              <button
                type="button"
                onClick={() => handleFormatToggle('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  emailFormat === 'text'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Type className="h-3.5 w-3.5" />
                <span>Simple Plain Text</span>
              </button>
            </div>

            {/* Print / Save PDF button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrintOrPdf}
              className="text-xs font-bold gap-1.5 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* Main Body: 2 Wide Columns */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Column: Form & AI Controls (Comfortable 460px width) */}
          <div className="w-full lg:w-[480px] xl:w-[520px] border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-[#0B1120] overflow-y-auto shrink-0 custom-scrollbar">
            
            {/* Template Selector Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-orange-500" /> Choose Pre-Fixed Template Preset
              </label>
              <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger className="w-full text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-9.5">
                  <SelectValue placeholder="Select official template..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{t.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({t.category})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode Switch Tabs (AI Assistant vs Manual Customizer) */}
            <div className="p-4 flex-1">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4">
                  <TabsTrigger value="ai" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600 data-[state=active]:shadow-xs cursor-pointer py-1.5">
                    <Wand2 className="h-3.5 w-3.5 text-orange-500" /> AI Assistant (Groq)
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600 data-[state=active]:shadow-xs cursor-pointer py-1.5">
                    <Edit3 className="h-3.5 w-3.5 text-slate-500" /> Manual Customizer
                  </TabsTrigger>
                </TabsList>

                {/* AI Assistant Tab */}
                <TabsContent value="ai" className="space-y-3.5 mt-0">
                  <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-3 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>
                      Drafting as <strong>{emailFormat === 'html' ? 'Rich Corporate Letterhead' : 'Clean Plain Text'}</strong>. 
                      Fill candidate details below or give custom instructions.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Candidate / Recipient Name</label>
                      <Input
                        placeholder="e.g. Aarav Sharma"
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        className="text-xs rounded-xl h-9 bg-slate-50 dark:bg-slate-800/60 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Role / Position</label>
                      <Input
                        placeholder="e.g. Full Stack Intern"
                        value={candidateRole}
                        onChange={(e) => setCandidateRole(e.target.value)}
                        className="text-xs rounded-xl h-9 bg-slate-50 dark:bg-slate-800/60 font-medium"
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
                        className="text-xs rounded-xl h-9 bg-slate-50 dark:bg-slate-800/60 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Start Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-xs rounded-xl h-9 bg-slate-50 dark:bg-slate-800/60 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Duration</label>
                      <Input
                        placeholder="e.g. 3 Months"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="text-xs rounded-xl h-9 bg-slate-50 dark:bg-slate-800/60 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">Communication Tone</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Formal & Professional', 'Warm & Welcoming', 'Direct & Concise', 'Performance Oriented'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTone(t)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            tone === t
                              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-orange-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Custom Instructions / Specific Requirements
                    </label>
                    <Textarea
                      placeholder="e.g. Mention 3-month probation period, remote working option, and reporting to senior tech lead."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="text-xs rounded-xl min-h-[70px] bg-slate-50 dark:bg-slate-800/60"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleGenerateWithAi}
                    disabled={isGeneratingAi}
                    className="w-full h-10 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/20 text-xs gap-2 cursor-pointer"
                  >
                    {isGeneratingAi ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating via Groq AI (0.10s)...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate / Rewrite with Groq AI
                      </>
                    )}
                  </Button>

                  {/* Quick AI Polish Chips */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">Quick AI Refinement:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={isGeneratingAi}
                        onClick={() => handleQuickRefine('Make this offer letter more formal, authoritative, and legally rigorous.')}
                        className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        + More Formal
                      </button>
                      <button
                        type="button"
                        disabled={isGeneratingAi}
                        onClick={() => handleQuickRefine('Add a strict non-disclosure, intellectual property, and confidentiality clause.')}
                        className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        + Add NDA Clause
                      </button>
                      <button
                        type="button"
                        disabled={isGeneratingAi}
                        onClick={() => handleQuickRefine('Make it warm, welcoming, and highlight team culture and mentorship.')}
                        className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        + Welcoming Tone
                      </button>
                      <button
                        type="button"
                        disabled={isGeneratingAi}
                        onClick={() => handleQuickRefine('Condense this letter into crisp, bulleted terms while maintaining legal validity.')}
                        className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        + Shorten / Bullets
                      </button>
                    </div>
                  </div>
                </TabsContent>

                {/* Manual Customizer Tab */}
                <TabsContent value="manual" className="space-y-3 mt-0">
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-[11px] text-slate-600 dark:text-slate-400">
                    Edit the raw content directly below or use the in-place Click-to-Edit toggle in the live preview.
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Subject Line</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="text-xs rounded-xl h-9 bg-slate-50 dark:bg-slate-800/60 font-bold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {emailFormat === 'text' ? 'Plain Text Email Body' : 'Direct HTML Content'}
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">Or edit inside the live preview</span>
                    </div>
                    {emailFormat === 'text' ? (
                      <Textarea
                        value={plainText}
                        onChange={(e) => setPlainText(e.target.value)}
                        placeholder="Write clean plain text email here..."
                        className="text-xs font-sans rounded-xl min-h-[260px] bg-slate-50 dark:bg-slate-800/60 leading-relaxed"
                      />
                    ) : (
                      <Textarea
                        value={htmlBody}
                        onChange={(e) => setHtmlBody(e.target.value)}
                        className="text-xs font-mono rounded-xl min-h-[260px] bg-slate-50 dark:bg-slate-800/60"
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Bottom Recipient & Dispatching Bar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950 space-y-3 shrink-0">
              
              {/* Recipient Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Recipients ({recipientsList.length})
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-medium">Quick Target:</span>
                    {!isManager && (
                      <>
                        <button type="button" onClick={() => addRecipient('all')} className="text-[10px] font-bold text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-orange-500 hover:text-white transition-colors">+ All</button>
                        <button type="button" onClick={() => addRecipient('managers')} className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-emerald-500 hover:text-white transition-colors">+ Managers</button>
                      </>
                    )}
                    <button type="button" onClick={() => addRecipient('interns')} className="text-[10px] font-bold text-indigo-600 bg-indigo-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-indigo-500 hover:text-white transition-colors">+ Interns</button>
                    <button type="button" onClick={() => addRecipient('employees')} className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-emerald-500 hover:text-white transition-colors">+ Employees</button>
                  </div>
                </div>

                {/* Recipient Badges */}
                <div className="min-h-[38px] p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center gap-1.5 mb-2">
                  {recipientsList.length === 0 && (
                    <span className="text-[11px] text-slate-400 pl-1">No recipient added. Type email below...</span>
                  )}
                  {recipientsList.map((rec, idx) => (
                    <Badge key={idx} className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">
                      {rec}
                      <button type="button" onClick={() => removeRecipient(idx)} className="hover:text-rose-500 cursor-pointer">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Add Email Bar */}
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Enter email or paste comma-separated..."
                    value={newRecipientInput}
                    onChange={(e) => setNewRecipientInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addRecipient();
                      }
                    }}
                    className="text-xs h-8.5 rounded-xl bg-white dark:bg-slate-900"
                  />
                  <Button
                    type="button"
                    onClick={() => addRecipient()}
                    size="sm"
                    variant="outline"
                    className="h-8.5 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 cursor-pointer"
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
                className="w-full h-10.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-lg text-xs gap-2 cursor-pointer"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Dispatching via SMTP...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 text-orange-500" />
                    Review & Dispatch {emailFormat === 'html' ? 'Official Letter' : 'Plain Email'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column: Expansive Realtime Live Preview (Spacious Canvas) */}
          <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#030712] overflow-hidden">
            
            {/* Preview Control Bar */}
            <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-orange-500" /> 
                  Live {emailFormat === 'html' ? 'Letterhead' : 'Plain Text'} Preview
                </span>
                <Badge variant="outline" className="text-[10px] font-bold border-orange-500/30 text-orange-600 dark:text-orange-400 bg-orange-500/5">
                  {emailFormat === 'html' ? 'HTML Template' : 'Text Email'}
                </Badge>
                {lastSummary && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] hidden sm:inline-flex">
                    <CheckCircle2 className="h-3 w-3 mr-1 inline" /> AI Synchronized
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                {/* Device Viewport Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      previewDevice === 'desktop' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Desktop Preview"
                  >
                    <Laptop className="h-3.5 w-3.5" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                      previewDevice === 'mobile' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="h-3.5 w-3.5" /> Mobile
                  </button>
                </div>

                {/* In-Place WYSIWYG Editable Toggle */}
                <button
                  type="button"
                  onClick={() => setIsEditablePreview(!isEditablePreview)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer ${
                    isEditablePreview
                      ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-orange-400'
                  }`}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {isEditablePreview ? 'Editing Active (Click text to edit)' : 'Enable Click-to-Edit'}
                </button>
              </div>
            </div>

            {/* Email Subject Header Bar in Preview */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500">Subject:</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email Subject Line..."
                className="flex-1 bg-transparent border-none text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            {/* Rendered Live Canvas (Wide, Spacious & Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start custom-scrollbar">
              <div
                className={`transition-all duration-300 ${
                  previewDevice === 'mobile'
                    ? 'w-[390px] shadow-2xl rounded-3xl border-8 border-slate-800 dark:border-slate-700 overflow-hidden bg-white p-3'
                    : 'w-full max-w-[760px] shadow-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden'
                }`}
              >
                {/* Mode A: Rich HTML Letterhead */}
                {emailFormat === 'html' ? (
                  <div
                    contentEditable={isEditablePreview}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      if (isEditablePreview) {
                        setHtmlBody(e.currentTarget.innerHTML);
                      }
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: htmlBody || '<p style="padding: 40px; color: #94a3b8; text-align: center;">No template selected or generated yet.</p>' 
                    }}
                    className={`min-h-[520px] focus:outline-none transition-all ${
                      isEditablePreview ? 'outline-2 outline-orange-400 outline-dashed m-2 rounded-lg' : ''
                    }`}
                  />
                ) : (
                  /* Mode B: Simple Plain Text Email Preview */
                  <div className="p-6 sm:p-8 space-y-4">
                    {/* Simulated Mail Header */}
                    <div className="pb-4 border-b border-slate-100 dark:border-slate-800 text-xs space-y-1.5 text-slate-500">
                      <p><strong className="text-slate-700 dark:text-slate-300">From:</strong> Hindustan OS &lt;kushinde13@gmail.com&gt;</p>
                      <p><strong className="text-slate-700 dark:text-slate-300">To:</strong> {recipientsList.length > 0 ? recipientsList.join(', ') : 'recipient@example.com'}</p>
                      <p><strong className="text-slate-700 dark:text-slate-300">Subject:</strong> {subject || '(No Subject)'}</p>
                    </div>

                    {/* Plain Text Content */}
                    <div
                      contentEditable={isEditablePreview}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        if (isEditablePreview) {
                          setPlainText(e.currentTarget.innerText);
                        }
                      }}
                      className={`text-sm text-slate-800 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap min-h-[400px] focus:outline-none ${
                        isEditablePreview ? 'outline-2 outline-orange-400 outline-dashed p-3 rounded-lg bg-orange-50/20' : ''
                      }`}
                    >
                      {plainText || 'Type or generate your plain text email content here...'}
                    </div>

                    {/* Simulated Clean Footer */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                      Sent via Hindustan OS workspace communications.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="px-6 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1.5 font-medium">
                <Building2 className="h-3.5 w-3.5 text-orange-500" />
                Hindustan Innovation Pvt Ltd • Official Dispatch Protocol
              </span>
              <span className="font-semibold text-slate-400">
                Format: <strong className="text-orange-600 dark:text-orange-400">{emailFormat.toUpperCase()}</strong> • Groq LPU Engine
              </span>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
