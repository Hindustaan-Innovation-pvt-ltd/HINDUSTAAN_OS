import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Building2, ShieldCheck, Laptop, Smartphone, Wand2, Type, LayoutTemplate,
  Paperclip, Users, Search, Download, Trash2, Calendar, Plus,
  Video, ExternalLink, Clock, Copy, Briefcase, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useUser } from '@/context/UserContext';
import BulkCsvImportModal from './BulkCsvImportModal';

export interface EmailAttachmentItem {
  id: string;
  filename: string;
  content: string; // base64
  contentType: string;
  size: number;
}

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

// Clean up plain text by converting any literal escaped \n strings and formatting cleanly
export function formatPlainText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Convert HTML letterhead into structured, readable plain text
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  let text = html;
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<\/tr>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<br\s*[\/]?>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<td[^>]*>/gi, '  ');
  text = text.replace(/<[^>]+>/g, '');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  text = text.replace(/\\n/g, '\n');
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s+\n/g, '\n\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

// Formats any date into strict DD-MMM-YYYY (e.g. 08-Sep-2026)
export function formatDateToCustom(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  const str = String(dateInput).trim();
  // Already in DD-MMM-YYYY format?
  if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(str)) {
    return str;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Handle YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
    const parts = str.split('T')[0].split('-');
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parts[2].slice(0, 2).padStart(2, '0');
    if (months[monthIdx]) {
      return `${day}-${months[monthIdx]}-${year}`;
    }
  }
  // Handle DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    const day = parts[0].padStart(2, '0');
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[2];
    if (months[monthIdx]) {
      return `${day}-${months[monthIdx]}-${year}`;
    }
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  return str;
}

export const MEETING_HTML_REGEX = /<!-- HIP_MEETING_START -->[\s\S]*?<!-- HIP_MEETING_END -->/g;
export const MEETING_TEXT_REGEX = /=== VIDEO MEETING DETAILS ===[\s\S]*?===========================/g;

export const BLANK_LETTERHEAD_HTML = `<div style="font-family: Arial, Helvetica, sans-serif; color: #1e293b; max-width: 680px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
  <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 32px 28px; border-bottom: 4px solid #ea580c;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">HINDUSTAN INNOVATION PVT LTD</h1>
          <p style="color: #ea580c; margin: 4px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Operating System for High Performance Teams</p>
        </td>
        <td align="right">
          <span style="display: inline-block; background: rgba(234, 88, 12, 0.15); color: #fb923c; border: 1px solid rgba(234, 88, 12, 0.4); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">OFFICIAL DISPATCH</span>
        </td>
      </tr>
    </table>
  </div>
  <div style="padding: 28px 28px; min-height: 220px;">
    <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Start typing your message here, or enter instructions in the left panel and click <strong>"Generate / Rewrite with Groq AI"</strong>.
    </p>
    <p style="margin-top: 32px; font-size: 13px; color: #1e293b;">
      Sincerely,<br/>
      <strong>Management Team</strong><br/>
      <span style="color: #64748b; font-size: 12px;">Hindustan Innovation Pvt Ltd</span>
    </p>
  </div>
</div>`;

export function generateMeetingHtml(link: string, dateTime: string, platform: string = 'google_meet'): string {
  const platformLabel = 
    platform === 'google_meet' ? 'Google Meet' :
    platform === 'zoom' ? 'Zoom Meeting' :
    platform === 'teams' ? 'Microsoft Teams' :
    platform === 'instant' ? 'Hindustan OS Video Conference' : 'Video Conference';

  const cardTitle = 
    platform === 'google_meet' ? 'Official Google Meet Invitation' :
    platform === 'zoom' ? 'Official Zoom Meeting Invitation' :
    platform === 'teams' ? 'Official Microsoft Teams Invitation' :
    'Official Video Conference Invitation';

  const joinButtonLabel = 
    platform === 'google_meet' ? '🚀 Join Google Meet Now &rarr;' :
    platform === 'zoom' ? '🚀 Join Zoom Meeting Now &rarr;' :
    platform === 'teams' ? '🚀 Join Teams Meeting Now &rarr;' :
    '🚀 Join Live Meeting Now &rarr;';

  const gcalTitle = 
    platform === 'google_meet' ? 'Hindustan Innovation Pvt Ltd – Google Meet Discussion' :
    platform === 'zoom' ? 'Hindustan Innovation Pvt Ltd – Zoom Meeting' :
    platform === 'teams' ? 'Hindustan Innovation Pvt Ltd – Microsoft Teams Meeting' :
    'Hindustan Innovation Pvt Ltd – Official Video Meeting';

  const badgeBg = 
    platform === 'google_meet' ? 'rgba(249, 115, 22, 0.15)' :
    platform === 'zoom' ? 'rgba(59, 130, 246, 0.15)' :
    platform === 'teams' ? 'rgba(99, 102, 241, 0.15)' :
    'rgba(16, 185, 129, 0.15)';

  const badgeColor = 
    platform === 'google_meet' ? '#fb923c' :
    platform === 'zoom' ? '#60a5fa' :
    platform === 'teams' ? '#818cf8' :
    '#34d399';

  const badgeBorder = 
    platform === 'google_meet' ? 'rgba(249, 115, 22, 0.35)' :
    platform === 'zoom' ? 'rgba(59, 130, 246, 0.35)' :
    platform === 'teams' ? 'rgba(99, 102, 241, 0.35)' :
    'rgba(16, 185, 129, 0.35)';

  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    gcalTitle
  )}&details=${encodeURIComponent(
    `Official corporate meeting invitation from Hindustan Innovation Pvt Ltd.\nPlatform: ${platformLabel}\nJoin Video Link: ${link}\nScheduled Time: ${dateTime || 'As scheduled'}`
  )}&location=${encodeURIComponent(link)}`;

  return `<!-- HIP_MEETING_START -->
<div id="hip-meeting-card" style="margin: 22px 0; padding: 18px 20px; background: #0f172a; border-radius: 12px; border: 1px solid #334155; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-shadow: 0 8px 20px -4px rgba(0,0,0,0.25);">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
    <tr>
      <td align="left" style="vertical-align: middle;">
        <span style="font-size: 15px; margin-right: 6px;">📹</span>
        <strong style="font-size: 12px; color: #f97316; letter-spacing: 0.5px; text-transform: uppercase;">${cardTitle}</strong>
      </td>
      <td align="right" style="vertical-align: middle;">
        <span style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 9999px;">
          ${platformLabel}
        </span>
      </td>
    </tr>
  </table>
  <div style="font-size: 13px; color: #cbd5e1; line-height: 1.6; margin-bottom: 14px;">
    ${dateTime ? `<div style="margin-bottom: 5px;"><strong>🗓️ Scheduled Time:</strong> <span style="color: #ffffff; font-weight: 600;">${dateTime}</span></div>` : ''}
    <div><strong>🔗 Meeting Link:</strong> <a href="${link}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline; word-break: break-all; font-weight: 600;">${link}</a></div>
  </div>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px;">
    <tr>
      <td style="padding-right: 10px;">
        <a href="${link}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #ea580c; color: #ffffff; font-weight: 700; font-size: 13px; padding: 10px 22px; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4);">
          ${joinButtonLabel}
        </a>
      </td>
      <td>
        <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #1e293b; color: #f8fafc; font-weight: 600; font-size: 12px; padding: 10px 16px; text-decoration: none; border-radius: 8px; border: 1px solid #475569;">
          📅 Add to Google Calendar
        </a>
      </td>
    </tr>
  </table>
</div>
<!-- HIP_MEETING_END -->`;
}

export function generateMeetingText(link: string, dateTime: string, platform: string = 'google_meet'): string {
  const platformLabel = 
    platform === 'google_meet' ? 'Google Meet' :
    platform === 'zoom' ? 'Zoom Meeting' :
    platform === 'teams' ? 'Microsoft Teams' :
    platform === 'instant' ? 'Hindustan OS Video Conference' : 'Video Conference';

  const gcalTitle = 
    platform === 'google_meet' ? 'Hindustan Innovation Pvt Ltd – Google Meet Discussion' :
    platform === 'zoom' ? 'Hindustan Innovation Pvt Ltd – Zoom Meeting' :
    platform === 'teams' ? 'Hindustan Innovation Pvt Ltd – Microsoft Teams Meeting' :
    'Hindustan Innovation Pvt Ltd – Official Video Meeting';

  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    gcalTitle
  )}&details=${encodeURIComponent(
    `Official corporate meeting invitation from Hindustan Innovation Pvt Ltd.\nPlatform: ${platformLabel}\nJoin Video Link: ${link}\nScheduled Time: ${dateTime || 'As scheduled'}`
  )}&location=${encodeURIComponent(link)}`;

  let txt = `\n=== VIDEO MEETING DETAILS ===\nPlatform: ${platformLabel}\n`;
  if (dateTime) txt += `Scheduled Time: ${dateTime}\n`;
  txt += `Meeting Link: ${link}\nAdd to Google Calendar: ${gcalUrl}\n===========================\n`;
  return txt;
}

export function stripAllMeetingBlocks(html: string): string {
  if (!html) return '';
  return html
    .replace(MEETING_HTML_REGEX, '')
    .replace(/<div[^>]*id="hip-meeting-card"[\s\S]*?<\/table>\s*<\/div>/gi, '')
    .replace(/<div[^>]*style="[^"]*#(?:fff7ed|fed7aa|fef3c7)[^"]*"[^>]*>(?:(?!<div)[\s\S])*?Onboarding Video Meeting[\s\S]*?<\/div>/gi, '');
}

export function stripAllMeetingTextBlocks(text: string): string {
  if (!text) return '';
  return text
    .replace(MEETING_TEXT_REGEX, '')
    .replace(/=== VIDEO MEETING DETAILS ===[\s\S]*?===========================/gi, '')
    .replace(/Video Meeting:[\s\S]*?Join Link:[\s\S]*?\n/gi, '');
}

export function injectMeetingBlock(
  html: string,
  link: string,
  dateTime: string,
  platform: string = 'google_meet'
): string {
  const block = generateMeetingHtml(link, dateTime, platform);
  const cleanHtml = stripAllMeetingBlocks(html);

  const closingIdx = cleanHtml.search(/<(?:p|div)[^>]*>(?:Sincerely|Warm regards|Best regards|Yours sincerely|Authorized Signatory)/i);
  if (closingIdx !== -1) {
    return cleanHtml.slice(0, closingIdx) + block + '\n' + cleanHtml.slice(closingIdx);
  }
  const lastDivIdx = cleanHtml.lastIndexOf('</div>');
  if (lastDivIdx !== -1) {
    return cleanHtml.slice(0, lastDivIdx) + block + '\n' + cleanHtml.slice(lastDivIdx);
  }
  return cleanHtml + '\n' + block;
}

export function injectMeetingTextBlock(
  text: string,
  link: string,
  dateTime: string,
  platform: string = 'google_meet'
): string {
  const block = generateMeetingText(link, dateTime, platform);
  const cleanText = stripAllMeetingTextBlocks(text);

  const closingIdx = cleanText.search(/(?:Sincerely,|Warm regards,|Best regards,|Yours sincerely,)/i);
  if (closingIdx !== -1) {
    return cleanText.slice(0, closingIdx) + block + '\n' + cleanText.slice(closingIdx);
  }
  return cleanText + '\n' + block;
}

// Helper to interpolate raw templates with form values
export function interpolateTemplate(
  rawHtml: string,
  rawSubj: string,
  data: {
    name: string;
    role: string;
    stipend: string;
    startDate: string;
    duration: string;
    manager: string;
    refId: string;
    dateStr: string;
  }
) {
  const formattedStartDate = formatDateToCustom(data.startDate) || '08-Sep-2026';
  const formattedCurrentDate = formatDateToCustom(data.dateStr) || '08-Sep-2026';

  let endDateStr = '3 Months from joining';
  try {
    const d = new Date(data.startDate);
    if (!isNaN(d.getTime())) {
      const numMonths = parseInt(data.duration, 10) || 3;
      d.setMonth(d.getMonth() + numMonths);
      endDateStr = formatDateToCustom(d);
    }
  } catch (e) {
    endDateStr = '3 Months from joining';
  }

  const safeName = data.name.trim() || 'Candidate';
  const safeRole = data.role.trim() || 'Software Engineer Intern';
  const safeStipend = data.stipend.trim() || '₹15,000 / month';
  const safeDuration = data.duration.trim() || '3 Months';

  let s = (rawSubj || '')
    .replace(/{{candidateName}}/g, safeName)
    .replace(/{{name}}/g, safeName)
    .replace(/{{employeeName}}/g, safeName)
    .replace(/{{role}}/g, safeRole)
    .replace(/{{stipend}}/g, safeStipend)
    .replace(/{{startDate}}/g, formattedStartDate);

  let h = (rawHtml || '')
    .replace(/{{referenceId}}/g, data.refId)
    .replace(/{{currentDate}}/g, formattedCurrentDate)
    .replace(/{{candidateName}}/g, safeName)
    .replace(/{{name}}/g, safeName)
    .replace(/{{employeeName}}/g, safeName)
    .replace(/{{role}}/g, safeRole)
    .replace(/{{stipend}}/g, safeStipend)
    .replace(/{{annualCTC}}/g, safeStipend)
    .replace(/{{startDate}}/g, formattedStartDate)
    .replace(/{{endDate}}/g, endDateStr)
    .replace(/{{duration}}/g, safeDuration)
    .replace(/{{reportingManager}}/g, data.manager)
    .replace(/{{workLocation}}/g, 'Headquarters / Remote')
    .replace(/{{projectAccomplished}}/g, 'Full Stack Enterprise Systems Development')
    .replace(/{{performanceRating}}/g, 'Exemplary / Outstanding')
    .replace(/{{reviewDate}}/g, formattedStartDate)
    .replace(/{{areasOfImprovement}}/g, 'Deepening system architecture & cross-functional documentation')
    .replace(/{{supportAction}}/g, 'Dedicated 1-on-1 mentorship and weekly technical check-ins');

  return {
    subject: s,
    htmlBody: h,
    plainText: htmlToPlainText(h)
  };
}

export default function EmailComposerModal({
  open,
  onOpenChange,
  onSuccess,
  initialRecipient = '',
  initialCategory = 'none'
}: EmailComposerModalProps) {
  const { user } = useUser();
  const role = (user?.role || 'admin').toLowerCase();
  const isManager = role === 'manager';

  // Format toggle: Rich HTML letterhead vs Simple Plain Email
  const [emailFormat, setEmailFormat] = useState<'html' | 'text'>('html');

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');
  const [isRoleFieldsOpen, setIsRoleFieldsOpen] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Raw base templates before interpolation
  const [rawSubjectTemplate, setRawSubjectTemplate] = useState('');
  const [rawHtmlTemplate, setRawHtmlTemplate] = useState('');
  const [currentRefId, setCurrentRefId] = useState('2659');
  const [currentDateStr, setCurrentDateStr] = useState(
    formatDateToCustom(new Date())
  );

  // Active email content
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [plainText, setPlainText] = useState('');
  const [isEditablePreview, setIsEditablePreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewRenderId, setPreviewRenderId] = useState(0);

  // AI Generation inputs
  const [candidateName, setCandidateName] = useState('');
  const [candidateRole, setCandidateRole] = useState('');
  const [stipend, setStipend] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState('');
  const [tone, setTone] = useState('Formal & Encouraging');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [lastSummary, setLastSummary] = useState('');

  // Recipients
  const [recipientsList, setRecipientsList] = useState<string[]>(initialRecipient ? [initialRecipient] : []);
  const [newRecipientInput, setNewRecipientInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Recipient autocomplete suggestions
  const [recipientSuggestions, setRecipientSuggestions] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  }>>([]);
  const [isSearchingRecipients, setIsSearchingRecipients] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const searchDebounceRef = useRef<any>(null);
  const recipientContainerRef = useRef<HTMLDivElement>(null);

  // Close autocomplete dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (recipientContainerRef.current && !recipientContainerRef.current.contains(e.target as Node)) {
        setShowSuggestionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gmail-style Attachments state
  const [attachments, setAttachments] = useState<EmailAttachmentItem[]>([]);
  const fileAttachmentRef = useRef<HTMLInputElement>(null);

  // Bulk CSV / Paste mode modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // New Custom Template modal state
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('internship');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Video Meeting Link state (Google Meet as preferred default, Instant Room as alternative, Zoom, Teams)
  const [meetingLink, setMeetingLink] = useState(() => {
    try {
      return localStorage.getItem('hip_default_google_meet_link') || '';
    } catch {
      return '';
    }
  });
  const [meetingPlatform, setMeetingPlatform] = useState<'google_meet' | 'instant' | 'zoom' | 'teams' | 'custom'>('google_meet');
  const [meetingDateTime, setMeetingDateTime] = useState('');
  const [attachMeetingToEmail, setAttachMeetingToEmail] = useState(true);

  const isMeetingAttached = htmlBody.includes('<!-- HIP_MEETING_START -->') || plainText.includes('=== VIDEO MEETING DETAILS ===');

  // Detect platform automatically based on URL
  const detectPlatformFromUrl = (url: string): 'google_meet' | 'instant' | 'zoom' | 'teams' | 'custom' => {
    const lower = url.toLowerCase();
    if (lower.includes('meet.google.com')) return 'google_meet';
    if (lower.includes('zoom.us')) return 'zoom';
    if (lower.includes('teams.microsoft.com') || lower.includes('teams.live.com')) return 'teams';
    if (lower.includes('jit.si')) return 'instant';
    return meetingPlatform;
  };

  // Generate an instant working live conference room (100% works immediately upon click, zero login)
  const handleGenerateInstantRoom = (customCandidateName?: string) => {
    const targetName = customCandidateName || candidateName;
    const cleanName = targetName ? targetName.replace(/[^a-zA-Z0-9]/g, '') : 'Interview';
    const roomCode = `HIP-${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
    const generated = `https://meet.jit.si/${roomCode}`;
    setMeetingLink(generated);
    setMeetingPlatform('instant');

    let schedule = meetingDateTime;
    if (!schedule) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatDateToCustom(tomorrow);
      schedule = `${tomorrowStr}, 04:00 PM IST`;
      setMeetingDateTime(schedule);
    }

    if (attachMeetingToEmail) {
      setHtmlBody((prev) => injectMeetingBlock(prev, generated, schedule, 'instant'));
      setPlainText((prev) => injectMeetingTextBlock(prev, generated, schedule, 'instant'));
    }

    toast.success('Generated Instant Live Video Room (Alternative)!', {
      description: 'Zero setup required. Camera, mic & screen sharing work immediately.'
    });
    return generated;
  };

  // Launch Google Meet to create real room
  const handleOpenGoogleMeetNew = () => {
    window.open('https://meet.google.com/new', '_blank');
    toast.info('Google Meet opened in new tab. Start your meeting, copy the meet URL, and click "Paste Link" below!', {
      duration: 6000
    });
  };

  // Launch Zoom to schedule or start real meeting
  const handleOpenZoomNew = () => {
    window.open('https://zoom.us/meeting/schedule', '_blank');
    toast.info('Zoom opened in new tab. Schedule or start your meeting, copy the invite link, and click "Paste Link" below!', {
      duration: 6000
    });
  };

  // Launch Microsoft Teams to create real room
  const handleOpenTeamsNew = () => {
    window.open('https://teams.live.com/meet', '_blank');
    toast.info('Microsoft Teams opened in new tab. Create your meeting, copy the join link, and click "Paste Link" below!', {
      duration: 6000
    });
  };

  // Paste URL directly from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const cleaned = text.trim();
        setMeetingLink(cleaned);
        const detected = detectPlatformFromUrl(cleaned);
        setMeetingPlatform(detected);

        if (detected === 'google_meet') {
          try {
            localStorage.setItem('hip_default_google_meet_link', cleaned);
          } catch (e) {
            // ignore
          }
        }

        if (attachMeetingToEmail) {
          const schedule = meetingDateTime || 'Tomorrow, 04:00 PM IST';
          setHtmlBody((prev) => injectMeetingBlock(prev, cleaned, schedule, detected));
          setPlainText((prev) => injectMeetingTextBlock(prev, cleaned, schedule, detected));
          setPreviewRenderId((prev) => prev + 1);
        }
        const platformName = detected === 'google_meet' ? 'Google Meet (Saved as default)' : detected === 'zoom' ? 'Zoom' : detected === 'teams' ? 'Microsoft Teams' : 'Meeting';
        toast.success(`Pasted ${platformName} link from clipboard!`);
      } else {
        toast.error('Clipboard is empty. Please copy your meeting URL first.');
      }
    } catch (err) {
      toast.error('Could not access clipboard. Please paste directly into the box.');
    }
  };

  // Auto-grab and attach meeting link when user copies it in Google Meet and returns to this window!
  useEffect(() => {
    if (!open) return;
    const handleWindowFocus = async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.readText) return;
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          const cleaned = text.trim();
          if (cleaned.includes('meet.google.com/') || cleaned.includes('zoom.us/') || cleaned.includes('teams.')) {
            // If link changed or current is empty
            if (cleaned !== meetingLink) {
              setMeetingLink(cleaned);
              const detected = detectPlatformFromUrl(cleaned);
              setMeetingPlatform(detected);
              if (detected === 'google_meet') {
                try {
                  localStorage.setItem('hip_default_google_meet_link', cleaned);
                } catch (e) {}
              }
              const schedule = meetingDateTime || 'Tomorrow, 04:00 PM IST';
              setHtmlBody((prev) => injectMeetingBlock(prev, cleaned, schedule, detected));
              setPlainText((prev) => injectMeetingTextBlock(prev, cleaned, schedule, detected));
              setAttachMeetingToEmail(true);
              setPreviewRenderId((prev) => prev + 1);
              const platformTitle = detected === 'google_meet' ? 'Google Meet' : detected === 'zoom' ? 'Zoom' : 'Microsoft Teams';
              toast.success(`⚡ Automatically detected ${platformTitle} link & attached to letter!`, {
                description: cleaned,
                duration: 5000
              });
            }
          }
        }
      } catch (err) {
        // clipboard access might be restricted until user interacts, safely ignore
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [open, meetingLink, meetingDateTime]);

  // Real-time format validation for Google Meet codes (preventing missing letters / invalid formats)
  const meetValidation = useMemo(() => {
    if (!meetingLink.trim() || meetingPlatform !== 'google_meet') return null;
    const match = meetingLink.match(/meet\.google\.com\/([a-z0-9-]+)/i);
    if (!match) return { valid: false, message: 'Invalid URL. Correct format: https://meet.google.com/xxx-yyyy-zzz' };
    const code = match[1].replace(/[^a-z0-9]/gi, '');
    if (code.length === 10) {
      return { valid: true, message: '✓ Valid Google Meet Room Format (10 characters: ' + match[1] + ')' };
    } else if (code.length < 10) {
      return { 
        valid: false, 
        message: `⚠️ Incomplete room code (${code.length}/10 letters). Google Meet codes have 10 letters (e.g. xxx-yyyy-zzz). Check if the last letter is missing!` 
      };
    } else {
      return { valid: true, message: '✓ Google Meet Room: ' + match[1] };
    }
  }, [meetingLink, meetingPlatform]);

  // Generate Google Meet format link (inform user that Google requires room creation)
  const handleGenerateGoogleMeet = () => {
    handleOpenGoogleMeetNew();
  };

  // Insert or update meeting invitation card into email draft
  const handleInsertOrUpdateMeeting = (customLink?: string, customTime?: string, customPlatform?: string) => {
    const activeLink = customLink || meetingLink.trim();
    if (!activeLink) {
      if (meetingPlatform === 'google_meet') {
        handleOpenGoogleMeetNew();
      } else if (meetingPlatform === 'zoom') {
        handleOpenZoomNew();
      } else if (meetingPlatform === 'teams') {
        handleOpenTeamsNew();
      }
      toast.error(`Please enter or create your ${meetingPlatform === 'google_meet' ? 'Google Meet' : meetingPlatform === 'zoom' ? 'Zoom' : meetingPlatform === 'teams' ? 'Microsoft Teams' : 'meeting'} link first`);
      return;
    }
    const activeTime = customTime !== undefined ? customTime : meetingDateTime.trim();
    const activePlatform = customPlatform || meetingPlatform;

    setAttachMeetingToEmail(true);

    // Update HTML Letterhead
    setHtmlBody((prev) => injectMeetingBlock(prev, activeLink, activeTime, activePlatform));

    // Update Plain Text
    setPlainText((prev) => injectMeetingTextBlock(prev, activeLink, activeTime, activePlatform));

    setPreviewRenderId((prev) => prev + 1);

    const platformName = activePlatform === 'google_meet' ? 'Google Meet' : activePlatform === 'zoom' ? 'Zoom' : activePlatform === 'teams' ? 'Microsoft Teams' : 'Meeting';
    toast.success(`${platformName} invitation added to letter!`);
  };

  // Toggle attachment of meeting card to email
  const handleToggleMeetingAttachment = () => {
    if (isMeetingAttached || attachMeetingToEmail) {
      handleRemoveMeeting();
      setAttachMeetingToEmail(false);
      toast.info('Meeting invitation detached from letter');
    } else {
      if (!meetingLink.trim()) {
        if (meetingPlatform === 'google_meet') {
          handleOpenGoogleMeetNew();
          toast.info('Please create or paste your Google Meet link to attach it to the letter');
          return;
        } else if (meetingPlatform === 'zoom') {
          handleOpenZoomNew();
          toast.info('Please create or paste your Zoom link to attach it to the letter');
          return;
        } else if (meetingPlatform === 'teams') {
          handleOpenTeamsNew();
          toast.info('Please create or paste your Teams link to attach it to the letter');
          return;
        } else {
          handleGenerateInstantRoom();
          return;
        }
      }
      handleInsertOrUpdateMeeting(meetingLink);
      setAttachMeetingToEmail(true);
      toast.success('Meeting invitation attached to letter!');
    }
  };

  // Remove meeting invitation from draft
  const handleRemoveMeeting = () => {
    setAttachMeetingToEmail(false);
    setHtmlBody((prev) => stripAllMeetingBlocks(prev));
    setPlainText((prev) => stripAllMeetingTextBlocks(prev));
    setPreviewRenderId((prev) => prev + 1);
  };

  // Fetch templates on mount
  useEffect(() => {
    if (open) {
      if (!initialCategory || initialCategory === 'none') {
        handleApplyBlankCanvas();
      }
      fetchTemplates();
      if (initialRecipient && !recipientsList.includes(initialRecipient)) {
        setRecipientsList([initialRecipient]);
      }
      // Google Meet is primary preference & default
      setMeetingPlatform('google_meet');
      try {
        const savedMeet = localStorage.getItem('hip_default_google_meet_link');
        if (savedMeet && !meetingLink) {
          setMeetingLink(savedMeet);
        }
      } catch (e) {
        // ignore
      }
      if (!meetingDateTime) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatDateToCustom(tomorrow);
        setMeetingDateTime(`${tomorrowStr}, 04:00 PM IST`);
      }
    }
  }, [open]);

  const handleApplyBlankCanvas = () => {
    setSelectedTemplateId('none');
    setRawSubjectTemplate('');
    setRawHtmlTemplate(BLANK_LETTERHEAD_HTML);
    setSubject('');
    let activeHtml = BLANK_LETTERHEAD_HTML;
    let activeText = 'Start typing your message here, or enter instructions in the left panel and click "Generate / Rewrite with Groq AI".';

    const activeMeetLink = meetingLink.trim() || (() => {
      try {
        return (localStorage.getItem('hip_default_google_meet_link') || '').trim();
      } catch {
        return '';
      }
    })();

    if (attachMeetingToEmail && activeMeetLink) {
      const activeTime = meetingDateTime || 'Tomorrow, 04:00 PM IST';
      activeHtml = injectMeetingBlock(activeHtml, activeMeetLink, activeTime, meetingPlatform);
      activeText = injectMeetingTextBlock(activeText, activeMeetLink, activeTime, meetingPlatform);
    }

    setHtmlBody(activeHtml);
    setPlainText(activeText);
    setIsRoleFieldsOpen(false);
    setPreviewRenderId((prev) => prev + 1);
  };

  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const res = await api.get('/email/templates');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const list = res.data.data as EmailTemplateItem[];
        setTemplates(list);

        if (initialCategory && initialCategory !== 'none') {
          const match = list.find(t => t.category === initialCategory);
          if (match) {
            applyTemplate(match);
            return;
          }
        }
        // Default to Blank Canvas
        handleApplyBlankCanvas();
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      handleApplyBlankCanvas();
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Save currently drafted letter as a new official preset template
  const handleSaveNewTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    try {
      setIsSavingTemplate(true);
      const res = await api.post('/email/templates', {
        name: newTemplateName.trim(),
        category: newTemplateCategory,
        subject: subject || 'Official Communication – Hindustan Innovation',
        htmlBody: htmlBody || `<div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">${plainText}</div>`,
        variables: ['candidateName', 'role', 'stipend', 'startDate', 'duration', 'reportingManager']
      });

      if (res.data?.success && res.data.data) {
        const createdT = res.data.data;
        setTemplates(prev => [...prev, createdT]);
        setSelectedTemplateId(createdT.id);
        toast.success(`Template "${createdT.name}" saved to presets!`);
        setIsCreateTemplateOpen(false);
        setNewTemplateName('');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const applyTemplate = (t: EmailTemplateItem) => {
    setSelectedTemplateId(t.id);
    setIsRoleFieldsOpen(true);
    setRawSubjectTemplate(t.subject);
    setRawHtmlTemplate(t.htmlBody);

    const todayStr = formatDateToCustom(new Date());
    const randomRef = Math.floor(1000 + Math.random() * 9000).toString();
    setCurrentDateStr(todayStr);
    setCurrentRefId(randomRef);

    const rendered = interpolateTemplate(t.htmlBody, t.subject, {
      name: candidateName || 'Aarav Sharma',
      role: candidateRole,
      stipend,
      startDate,
      duration,
      manager: user?.name || 'Engineering Operations',
      refId: randomRef,
      dateStr: todayStr
    });

    let activeHtml = rendered.htmlBody;
    let activeText = rendered.plainText;

    const activeMeetLink = meetingLink.trim() || (() => {
      try {
        return (localStorage.getItem('hip_default_google_meet_link') || '').trim();
      } catch {
        return '';
      }
    })();

    if (attachMeetingToEmail && activeMeetLink) {
      const activeTime = meetingDateTime || 'Tomorrow, 04:00 PM IST';
      activeHtml = injectMeetingBlock(activeHtml, activeMeetLink, activeTime, meetingPlatform);
      activeText = injectMeetingTextBlock(activeText, activeMeetLink, activeTime, meetingPlatform);
    }

    setSubject(rendered.subject);
    setHtmlBody(activeHtml);
    setPlainText(activeText);
    setPreviewRenderId((prev) => prev + 1);
  };

  const handleTemplateChange = (id: string) => {
    if (id === 'none') {
      handleApplyBlankCanvas();
      toast.info('Switched to Blank Canvas (Custom AI Email)');
      return;
    }
    const found = templates.find(t => t.id === id);
    if (found) {
      applyTemplate(found);
    }
  };

  // Keystroke Live-Sync: Instantly re-renders preview & subject as the user types in any input!
  const handleFieldChange = (key: 'name' | 'role' | 'stipend' | 'startDate' | 'duration', value: string) => {
    let newName = candidateName;
    let newRole = candidateRole;
    let newStipend = stipend;
    let newStart = startDate;
    let newDur = duration;

    if (key === 'name') {
      setCandidateName(value);
      newName = value;
    } else if (key === 'role') {
      setCandidateRole(value);
      newRole = value;
    } else if (key === 'stipend') {
      setStipend(value);
      newStipend = value;
    } else if (key === 'startDate') {
      setStartDate(value);
      newStart = value;
    } else if (key === 'duration') {
      setDuration(value);
      newDur = value;
    }

    if (rawHtmlTemplate) {
      const rendered = interpolateTemplate(rawHtmlTemplate, rawSubjectTemplate || subject, {
        name: newName,
        role: newRole,
        stipend: newStipend,
        startDate: newStart,
        duration: newDur,
        manager: user?.name || 'Engineering Operations',
        refId: currentRefId,
        dateStr: currentDateStr
      });

      let activeHtml = rendered.htmlBody;
      let activeText = rendered.plainText;

      if (attachMeetingToEmail && meetingLink.trim()) {
        activeHtml = injectMeetingBlock(activeHtml, meetingLink.trim(), meetingDateTime.trim(), meetingPlatform);
        activeText = injectMeetingTextBlock(activeText, meetingLink.trim(), meetingDateTime.trim(), meetingPlatform);
      }

      setSubject(rendered.subject);
      setHtmlBody(activeHtml);
      setPlainText(activeText);
      setPreviewRenderId((prev) => prev + 1);
    } else {
      // Direct replace fallback
      if (key === 'name' && candidateName) {
        setHtmlBody(prev => prev.replace(new RegExp(candidateName, 'g'), value));
        setSubject(prev => prev.replace(new RegExp(candidateName, 'g'), value));
        setPreviewRenderId((prev) => prev + 1);
      }
    }
  };

  // Switch format toggle (HTML vs Plain Text)
  const handleFormatToggle = (newFormat: 'html' | 'text') => {
    setEmailFormat(newFormat);
    if (newFormat === 'text') {
      if (!plainText && htmlBody) {
        setPlainText(htmlToPlainText(htmlBody));
      } else if (plainText) {
        setPlainText(formatPlainText(plainText));
      }
    }
  };

  // AI Generation with Groq
  const handleGenerateWithAi = async () => {
    try {
      setIsGeneratingAi(true);
      const isNone = selectedTemplateId === 'none';
      const currentT = !isNone ? templates.find(t => t.id === selectedTemplateId) : null;
      
      const payload = {
        format: emailFormat,
        templateCategory: isNone ? 'none' : (currentT?.category || 'none'),
        candidateName: candidateName.trim() || (isNone ? 'Recipient' : 'Candidate'),
        candidateEmail: recipientsList[0] || '',
        role: isRoleFieldsOpen ? candidateRole.trim() : '',
        stipend: isRoleFieldsOpen ? stipend.trim() : '',
        startDate: isRoleFieldsOpen ? startDate : '',
        duration: isRoleFieldsOpen ? duration.trim() : '',
        tone,
        prompt: customPrompt,
        meetingLink: meetingLink.trim(),
        meetingDateTime: meetingDateTime.trim(),
        meetingPlatform: meetingPlatform === 'google_meet' ? 'Google Meet' : meetingPlatform === 'zoom' ? 'Zoom' : meetingPlatform === 'teams' ? 'MS Teams' : 'Video Conference'
      };

      const res = await api.post('/email/ai-generate', payload);
      if (res.data?.success && res.data.data) {
        const newSubj = res.data.data.subject || subject;
        let newHtml = res.data.data.htmlBody || htmlBody;
        let newText = res.data.data.textBody ? formatPlainText(res.data.data.textBody) : htmlToPlainText(newHtml);

        // Strip any rogue duplicate AI meeting cards so only ONE official meeting card exists
        newHtml = stripAllMeetingBlocks(newHtml);
        newText = stripAllMeetingTextBlocks(newText);

        const activeMeet = meetingLink.trim() || (() => {
          try { return (localStorage.getItem('hip_default_google_meet_link') || '').trim(); } catch { return ''; }
        })();

        if (attachMeetingToEmail && activeMeet) {
          const schedule = meetingDateTime || 'Tomorrow, 04:00 PM IST';
          newHtml = injectMeetingBlock(newHtml, activeMeet, schedule, meetingPlatform);
          newText = injectMeetingTextBlock(newText, activeMeet, schedule, meetingPlatform);
        }

        setRawSubjectTemplate(newSubj);
        setRawHtmlTemplate(newHtml);
        setSubject(newSubj);
        setHtmlBody(newHtml);
        setPlainText(newText);
        setLastSummary(res.data.data.summary || 'Draft generated by Groq AI');
        setPreviewRenderId(prev => prev + 1);
        toast.success(`Generated via Groq AI (${emailFormat.toUpperCase()})!`, {
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
        const newSubj = res.data.data.subject || subject;
        let newHtml = res.data.data.htmlBody || htmlBody;
        let newText = res.data.data.textBody ? formatPlainText(res.data.data.textBody) : htmlToPlainText(newHtml);

        // Strip any rogue duplicate AI meeting cards so only ONE official meeting card exists
        newHtml = stripAllMeetingBlocks(newHtml);
        newText = stripAllMeetingTextBlocks(newText);

        const activeMeet = meetingLink.trim() || (() => {
          try { return (localStorage.getItem('hip_default_google_meet_link') || '').trim(); } catch { return ''; }
        })();

        if (attachMeetingToEmail && activeMeet) {
          const schedule = meetingDateTime || 'Tomorrow, 04:00 PM IST';
          newHtml = injectMeetingBlock(newHtml, activeMeet, schedule, meetingPlatform);
          newText = injectMeetingTextBlock(newText, activeMeet, schedule, meetingPlatform);
        }

        setRawSubjectTemplate(newSubj);
        setRawHtmlTemplate(newHtml);
        setSubject(newSubj);
        setHtmlBody(newHtml);
        setPlainText(newText);
        setLastSummary(res.data.data.summary || 'Refined by Groq AI');
        setPreviewRenderId(prev => prev + 1);
        toast.success(`Refined: "${instruction}"`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to refine draft');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Recipient input change with search autocomplete
  const handleRecipientInputChange = (val: string) => {
    setNewRecipientInput(val);
    if (!val.trim()) {
      setRecipientSuggestions([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    setShowSuggestionsDropdown(true);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearchingRecipients(true);
        const res = await api.get(`/email/search-recipients?q=${encodeURIComponent(val.trim())}`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRecipientSuggestions(res.data.data);
          setShowSuggestionsDropdown(true);
        }
      } catch (err) {
        // Silent fallback
      } finally {
        setIsSearchingRecipients(false);
      }
    }, 100);
  };

  const selectSuggestion = (targetUser: { name: string; email: string; role: string }) => {
    if (!targetUser.email) return;
    setRecipientsList(prev => Array.from(new Set([...prev, targetUser.email])));
    handleFieldChange('name', targetUser.name);
    setShowSuggestionsDropdown(false);
    setNewRecipientInput('');
    toast.success(`Selected ${targetUser.name} (${targetUser.email})`);
  };

  // File Attachments Handler
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentTotalSize = attachments.reduce((acc, a) => acc + a.size, 0);
    const newFiles = Array.from(files);

    newFiles.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds the 10MB limit.`);
        return;
      }
      if (currentTotalSize + file.size > 12 * 1024 * 1024) {
        toast.error(`Total attachments cannot exceed 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = (reader.result as string).split(',')[1] || '';
        setAttachments(prev => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            filename: file.name,
            content: base64Content,
            contentType: file.type || 'application/octet-stream',
            size: file.size
          }
        ]);
        toast.success(`Attached "${file.name}"`);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Recipient Management
  const addRecipient = (target?: string) => {
    const value = (target || newRecipientInput).trim();
    if (!value) return;

    // If query matches suggestions and user pressed Enter / Add without an @ symbol, auto-select first suggestion
    if (!target && recipientSuggestions.length > 0 && !value.includes('@')) {
      selectSuggestion(recipientSuggestions[0]);
      return;
    }

    const items = value.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);

    // Validate email format if manual input
    if (!target) {
      const invalidEmails = items.filter(item => !item.includes('@'));
      if (invalidEmails.length > 0) {
        toast.error(`"${invalidEmails.join(', ')}" is not a valid email address. Please select from workspace members or enter a valid email.`);
        return;
      }
    }

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

      let outgoingHtml = htmlBody;
      let outgoingText = plainText;

      if (attachMeetingToEmail && meetingLink.trim()) {
        const schedule = meetingDateTime.trim() || 'Tomorrow, 04:00 PM IST';
        if (!outgoingHtml.includes('<!-- HIP_MEETING_START -->')) {
          outgoingHtml = injectMeetingBlock(outgoingHtml, meetingLink.trim(), schedule, meetingPlatform);
        }
        if (!outgoingText.includes('=== VIDEO MEETING DETAILS ===')) {
          outgoingText = injectMeetingTextBlock(outgoingText, meetingLink.trim(), schedule, meetingPlatform);
        }
      }

      if (emailFormat === 'text') {
        payload.text = outgoingText;
        payload.html = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; padding: 16px;">${outgoingText}</div>`;
      } else {
        payload.html = outgoingHtml;
      }

      if (isBulk) {
        payload.recipients = finalRecipients;
      } else {
        payload.to = finalRecipients[0];
      }

      if (attachments.length > 0) {
        payload.attachments = attachments.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType
        }));
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

            {/* Bulk Send Mode Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBulkModalOpen(true)}
              className="text-xs font-bold gap-1.5 rounded-xl border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer shadow-xs"
            >
              <Users className="h-3.5 w-3.5 text-indigo-500" />
              Bulk Send (CSV / Paste)
            </Button>

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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-orange-500" /> Choose Pre-Fixed Template Preset
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreateTemplateOpen(true)}
                  className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> + New Template
                </button>
              </div>
              <Select 
                value={selectedTemplateId} 
                onValueChange={(val) => {
                  if (val === '__add_new__') {
                    setIsCreateTemplateOpen(true);
                  } else {
                    handleTemplateChange(val);
                  }
                }}
              >
                <SelectTrigger className="w-full text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-9.5">
                  <SelectValue placeholder="Select official template..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="none" className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-orange-500" /> None / Blank Canvas (Custom AI Email)
                    </span>
                  </SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{t.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({t.category})</span>
                    </SelectItem>
                  ))}
                  <SelectItem value="__add_new__" className="text-xs font-bold text-orange-600 dark:text-orange-400 border-t border-slate-100 dark:border-slate-800 mt-1 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-orange-500" /> + Add / Save Current as New Template
                    </span>
                  </SelectItem>
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
                      {selectedTemplateId === 'none' 
                        ? ' Blank Canvas active. Describe what you need in the prompt box below!'
                        : ' Fill details below or customize with instructions.'}
                    </span>
                  </div>

                  {/* Email Subject Line Field */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Email Subject Line
                    </label>
                    <Input
                      placeholder={selectedTemplateId === 'none' ? "e.g. Discussion on New Version Release – Team Sync" : "e.g. Internship Offer Letter – Full Stack Intern at Hindustan Innovation"}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="text-xs rounded-xl h-9 bg-slate-50 dark:bg-slate-800/60 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Recipient / Candidate Name
                    </label>
                    <Input
                      placeholder="e.g. Aarav Sharma or Team Member"
                      value={candidateName}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="text-xs rounded-xl h-9 bg-slate-50 dark:bg-slate-800/60 font-medium"
                    />
                  </div>

                  {/* Collapsible Role & Compensation Accordion */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/60 dark:bg-slate-900/40">
                    <button
                      type="button"
                      onClick={() => setIsRoleFieldsOpen(!isRoleFieldsOpen)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Optional Role & Compensation Details
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          {isRoleFieldsOpen ? 'Expanded' : 'Optional'}
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isRoleFieldsOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {isRoleFieldsOpen && (
                      <div className="p-3 pt-2 space-y-2.5 border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Role / Position Title</label>
                          <Input
                            placeholder="e.g. Full Stack Intern"
                            value={candidateRole}
                            onChange={(e) => handleFieldChange('role', e.target.value)}
                            className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Stipend / CTC</label>
                            <Input
                              placeholder="e.g. ₹15,000/mo"
                              value={stipend}
                              onChange={(e) => handleFieldChange('stipend', e.target.value)}
                              className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Start Date</label>
                            <div className="relative inline-flex items-center w-full">
                              <input
                                type="date"
                                value={startDate}
                                onChange={(e) => handleFieldChange('startDate', e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div className="w-full h-8 px-2.5 rounded-lg border border-slate-700/80 bg-[#0B1120] hover:bg-slate-900 text-white flex items-center justify-between gap-1 shadow-inner transition-colors cursor-pointer group">
                                <span className="text-[10px] font-bold tracking-wide text-white truncate">
                                  {formatDateToCustom(startDate) || '08-Sep-2026'}
                                </span>
                                <Calendar className="h-3 w-3 text-slate-400 group-hover:text-white transition-colors shrink-0" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Duration</label>
                            <Input
                              placeholder="e.g. 3 Months"
                              value={duration}
                              onChange={(e) => handleFieldChange('duration', e.target.value)}
                              className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    )}
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

                  {/* Video Conference / Google Meet Card */}
                  <div className="bg-slate-50/80 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                          <Video className="h-4 w-4" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 leading-tight">
                            Google Meet & Video Conference
                          </label>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">Google Meet (Default) + Calendar integration</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleMeetingAttachment}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isMeetingAttached
                            ? 'bg-orange-600 text-white border-orange-700 shadow-xs hover:bg-orange-700'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-orange-400'
                        }`}
                        title={isMeetingAttached ? 'Click to detach from email' : 'Click to attach to email'}
                      >
                        {isMeetingAttached ? (
                          <>
                            <Check className="h-3 w-3" /> Attached to Letter
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" /> + Attach to Letter
                          </>
                        )}
                      </button>
                    </div>

                    {/* Platform Selector: Google Meet is #1 Preferred, Instant Room is #2 Alternative, Zoom #3, Teams #4 */}
                    <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setMeetingPlatform('google_meet')}
                        className={`text-[10px] font-bold py-1.5 px-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                          meetingPlatform === 'google_meet'
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Google Meet ★
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMeetingPlatform('instant');
                          if (!meetingLink || meetingLink.includes('meet.google.com') || meetingLink.includes('zoom.us') || meetingLink.includes('teams.')) {
                            handleGenerateInstantRoom();
                          }
                        }}
                        className={`text-[10px] font-bold py-1.5 px-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                          meetingPlatform === 'instant'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        ⚡ Instant (Alt)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetingPlatform('zoom')}
                        className={`text-[10px] font-bold py-1.5 px-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                          meetingPlatform === 'zoom'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Zoom
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetingPlatform('teams')}
                        className={`text-[10px] font-bold py-1.5 px-1 rounded-md transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                          meetingPlatform === 'teams'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Teams
                      </button>
                    </div>

                    {/* Platform Explanation Notice */}
                    {meetingPlatform === 'google_meet' ? (
                      <div className="bg-orange-500/10 border border-orange-500/25 rounded-xl p-3 text-[11px] text-orange-950 dark:text-orange-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-orange-700 dark:text-orange-400">
                            <Video className="h-3.5 w-3.5 shrink-0 text-orange-600" />
                            <span>Google Meet (Primary Choice)</span>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-700 dark:text-orange-300">
                            Preferred
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                          Official Google Meet rooms must be created via Google servers to avoid &quot;No such meeting&quot; errors. Click <strong>&quot;Create Google Meet Room ↗&quot;</strong>, copy your room link, and click <strong>&quot;Paste Link&quot;</strong> below.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={handleOpenGoogleMeetNew}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Create Google Meet Room ↗
                          </button>
                          <button
                            type="button"
                            onClick={handlePasteFromClipboard}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Paste Link
                          </button>
                        </div>
                      </div>
                    ) : meetingPlatform === 'instant' ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 text-[11px] text-emerald-950 dark:text-emerald-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span>Instant Live Room (Alternative)</span>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            Zero Login Fallback
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                          Zero setup or login required! Anyone can join via camera, mic &amp; screen share in browser without Google, Zoom, or Teams accounts.
                        </p>
                        <div className="flex items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleGenerateInstantRoom()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Re-generate Room
                          </button>
                        </div>
                      </div>
                    ) : meetingPlatform === 'zoom' ? (
                      <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 text-[11px] text-blue-950 dark:text-blue-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-400">
                            <Video className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                            <span>Official Zoom Meeting</span>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                            Zoom
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                          To prevent &quot;Meeting ID does not exist&quot; errors, create your meeting on Zoom, copy the invitation link, and paste it below.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={handleOpenZoomNew}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Schedule / Start Zoom Meeting ↗
                          </button>
                          <button
                            type="button"
                            onClick={handlePasteFromClipboard}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Paste Link
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-3 text-[11px] text-indigo-950 dark:text-indigo-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
                            <Video className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                            <span>Microsoft Teams Meeting</span>
                          </div>
                          <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                            Teams
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                          To prevent invalid meeting errors, create your meeting on Microsoft Teams, copy the join link, and paste it below.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={handleOpenTeamsNew}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Create Teams Meeting ↗
                          </button>
                          <button
                            type="button"
                            onClick={handlePasteFromClipboard}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Paste Link
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Meeting URL Bar with Quick Actions */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {meetingPlatform === 'google_meet' ? 'Google Meet URL' : meetingPlatform === 'zoom' ? 'Zoom Invite URL' : meetingPlatform === 'teams' ? 'Teams Join URL' : 'Meeting Room URL'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {meetingPlatform === 'google_meet' ? (
                            <button
                              type="button"
                              onClick={handleOpenGoogleMeetNew}
                              className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <ExternalLink className="h-3 w-3" /> Create Room ↗
                            </button>
                          ) : meetingPlatform === 'instant' ? (
                            <button
                              type="button"
                              onClick={() => handleGenerateInstantRoom()}
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Sparkles className="h-3 w-3" /> Re-generate
                            </button>
                          ) : meetingPlatform === 'zoom' ? (
                            <button
                              type="button"
                              onClick={handleOpenZoomNew}
                              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <ExternalLink className="h-3 w-3" /> Open Zoom ↗
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleOpenTeamsNew}
                              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <ExternalLink className="h-3 w-3" /> Open Teams ↗
                            </button>
                          )}
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <button
                            type="button"
                            onClick={handlePasteFromClipboard}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer"
                            title="Paste link from clipboard"
                          >
                            Paste Link
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Input
                          placeholder={
                            meetingPlatform === 'google_meet'
                              ? 'https://meet.google.com/xxx-yyyy-zzz (Paste Google Meet URL)'
                              : meetingPlatform === 'instant'
                              ? 'https://meet.jit.si/HIP-...'
                              : meetingPlatform === 'zoom'
                              ? 'https://zoom.us/j/... (Paste Zoom Invite URL)'
                              : 'https://teams.microsoft.com/... (Paste Teams URL)'
                          }
                          value={meetingLink}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMeetingLink(val);
                            const detected = detectPlatformFromUrl(val);
                            if (detected !== meetingPlatform && val.trim().length > 10) {
                              setMeetingPlatform(detected);
                            }
                            if (detected === 'google_meet' && val.trim().length > 15) {
                              try {
                                localStorage.setItem('hip_default_google_meet_link', val.trim());
                              } catch (e) {
                                // ignore
                              }
                            }
                            if (attachMeetingToEmail && val.trim()) {
                              handleInsertOrUpdateMeeting(val, meetingDateTime, detected);
                            }
                          }}
                          className="text-xs rounded-xl h-8.5 bg-white dark:bg-slate-950 font-mono"
                        />
                        {meetingLink && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(meetingLink, '_blank')}
                            className={`h-8.5 px-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer ${
                              meetingPlatform === 'google_meet'
                                ? 'text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-950/40'
                                : meetingPlatform === 'zoom'
                                ? 'text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                                : meetingPlatform === 'teams'
                                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                                : 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                            title={`Open and test ${meetingPlatform === 'google_meet' ? 'Google Meet' : meetingPlatform === 'zoom' ? 'Zoom' : meetingPlatform === 'teams' ? 'Teams' : 'video'} room now`}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            {meetingPlatform === 'google_meet' ? 'Test Meet' : meetingPlatform === 'zoom' ? 'Test Zoom' : meetingPlatform === 'teams' ? 'Test Teams' : 'Test Call'}
                          </Button>
                        )}
                        {meetingLink && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(meetingLink);
                              toast.success('Meeting link copied to clipboard!');
                            }}
                            className="h-8.5 px-2.5 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                            title="Copy Link"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      {meetValidation && (
                        <div className={`text-[10px] font-semibold mt-1.5 px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                          meetValidation.valid
                            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400'
                        }`}>
                          {meetValidation.valid ? (
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                          ) : (
                            <AlertCircle className="h-3 w-3 shrink-0" />
                          )}
                          <span>{meetValidation.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Meeting Date & Time */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                        Meeting Date & Time Schedule
                      </label>
                      <Input
                        placeholder="e.g. 10-Sep-2026, 04:00 PM IST or Tomorrow 4 PM"
                        value={meetingDateTime}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMeetingDateTime(val);
                          if (attachMeetingToEmail && meetingLink.trim()) {
                            handleInsertOrUpdateMeeting(meetingLink, val);
                          }
                        }}
                        className="text-xs rounded-xl h-8.5 bg-white dark:bg-slate-950 font-medium"
                      />
                    </div>

                    {/* Insert / Remove Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          let link = meetingLink;
                          if (!link) {
                            const saved = localStorage.getItem('hip_default_google_meet_link');
                            if (saved) {
                              link = saved;
                              setMeetingLink(saved);
                            } else if (meetingPlatform === 'google_meet') {
                              handleOpenGoogleMeetNew();
                              toast.info('Google Meet opened! Create your room and paste the link to attach it.');
                              return;
                            } else if (meetingPlatform === 'zoom') {
                              handleOpenZoomNew();
                              toast.info('Zoom opened! Create your room and paste the link to attach it.');
                              return;
                            } else if (meetingPlatform === 'teams') {
                              handleOpenTeamsNew();
                              toast.info('Teams opened! Create your room and paste the link to attach it.');
                              return;
                            } else {
                              link = handleGenerateInstantRoom();
                            }
                          }
                          handleInsertOrUpdateMeeting(link);
                        }}
                        className={`flex-1 h-8.5 text-xs font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs ${
                          isMeetingAttached
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        <Video className="h-3.5 w-3.5" />
                        {isMeetingAttached ? '✓ Google Meet Attached to Letter' : 'Insert Google Meet into Letter'}
                      </Button>
                      {isMeetingAttached && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveMeeting}
                          className="h-8.5 text-xs font-bold rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" /> Remove
                        </Button>
                      )}
                    </div>
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
                        onClick={() => {
                          let link = meetingLink;
                          if (!link) {
                            const saved = localStorage.getItem('hip_default_google_meet_link');
                            if (saved) {
                              link = saved;
                              setMeetingLink(saved);
                            } else {
                              handleOpenGoogleMeetNew();
                              toast.info('Google Meet opened! Create your room and paste the link to attach it.');
                              return;
                            }
                          }
                          handleInsertOrUpdateMeeting(link);
                        }}
                        className="text-[10px] font-bold bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white dark:text-orange-400 dark:hover:text-white px-2.5 py-1 rounded-lg border border-orange-500/30 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Video className="h-3 w-3" /> + Add Google Meet Invitation
                      </button>
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
                        className="text-xs font-sans rounded-xl min-h-[260px] bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 leading-relaxed"
                      />
                    ) : (
                      <Textarea
                        value={htmlBody}
                        onChange={(e) => setHtmlBody(e.target.value)}
                        className="text-xs font-mono rounded-xl min-h-[260px] bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100"
                      />
                    )}
                  </div>

                  {/* Quick Meeting Helper in Manual tab */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Video className="h-4 w-4 text-orange-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {meetingLink ? meetingLink : 'No Google Meet link set'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {isMeetingAttached ? '✓ Attached in letter (Join Google Meet + Calendar)' : 'Not yet attached in letter'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!meetingLink ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleOpenGoogleMeetNew}
                          className="h-7 text-[11px] font-bold rounded-lg text-orange-600 border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-950/40 cursor-pointer"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" /> Google Meet ↗
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(meetingLink, '_blank')}
                          className="h-7 text-[11px] font-bold rounded-lg text-orange-600 border-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-950/40 cursor-pointer"
                          title="Open and test Google Meet call now"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" /> Test Meet
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          let link = meetingLink;
                          if (!link) {
                            const saved = localStorage.getItem('hip_default_google_meet_link');
                            if (saved) {
                              link = saved;
                              setMeetingLink(saved);
                            } else {
                              handleOpenGoogleMeetNew();
                              toast.info('Google Meet opened! Create your room and paste the link to attach it.');
                              return;
                            }
                          }
                          handleInsertOrUpdateMeeting(link);
                        }}
                        className={`h-7 text-[11px] font-bold rounded-lg text-white cursor-pointer ${
                          isMeetingAttached ? 'bg-orange-600 hover:bg-orange-700' : 'bg-orange-500 hover:bg-orange-600'
                        }`}
                      >
                        {isMeetingAttached ? '✓ In Letter' : 'Insert Meet'}
                      </Button>
                      {isMeetingAttached && (
                        <button
                          type="button"
                          onClick={handleRemoveMeeting}
                          className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remove meeting"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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

                {/* Add Email Bar with Live Autocomplete */}
                <div ref={recipientContainerRef} className="relative">
                  <div className="flex gap-1.5">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Search workspace member (name/email) or type address..."
                        value={newRecipientInput}
                        onChange={(e) => handleRecipientInputChange(e.target.value)}
                        onFocus={() => {
                          if (newRecipientInput.trim() || recipientSuggestions.length > 0) {
                            setShowSuggestionsDropdown(true);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addRecipient();
                          }
                        }}
                        className="text-xs h-8.5 pl-8 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-orange-500"
                      />
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      {isSearchingRecipients && (
                        <RefreshCw className="absolute right-2.5 top-2.5 h-3.5 w-3.5 animate-spin text-orange-500" />
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={() => addRecipient()}
                      size="sm"
                      variant="outline"
                      className="h-8.5 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:text-orange-600 cursor-pointer shadow-xs"
                    >
                      + Add
                    </Button>
                  </div>

                  {/* Suggestions Popover Dropdown */}
                  {showSuggestionsDropdown && (newRecipientInput.trim() || recipientSuggestions.length > 0) && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Workspace Members ({recipientSuggestions.length})</span>
                        <button
                          type="button"
                          onClick={() => setShowSuggestionsDropdown(false)}
                          className="hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      {isSearchingRecipients && recipientSuggestions.length === 0 ? (
                        <div className="p-3.5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin text-orange-500" /> Searching workspace members...
                        </div>
                      ) : recipientSuggestions.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          No workspace member found for &ldquo;{newRecipientInput}&rdquo;. Press Enter or &quot;+ Add&quot; to use as email.
                        </div>
                      ) : (
                        recipientSuggestions.map((userItem) => {
                          const roleUpper = (userItem.role || 'INTERN').toUpperCase();
                          const roleColor =
                            roleUpper === 'INTERN'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                              : roleUpper === 'MANAGER'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : roleUpper === 'ADMIN'
                              ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';

                          return (
                            <div
                              key={userItem.id}
                              onClick={() => selectSuggestion(userItem)}
                              className="p-2.5 flex items-center justify-between hover:bg-orange-50/70 dark:hover:bg-orange-950/30 cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-7 w-7 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs flex items-center justify-center shrink-0 border border-orange-500/20">
                                  {userItem.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 transition-colors truncate leading-tight">
                                    {userItem.name}
                                  </p>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono font-medium truncate leading-tight mt-0.5">
                                    {userItem.email}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <Badge className={`text-[10px] font-bold border px-1.5 py-0.5 rounded ${roleColor}`}>
                                  {roleUpper}
                                </Badge>
                                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  + Select
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                {isManager && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Note: Managers can only dispatch emails to Interns & Employees.
                  </p>
                )}

                {/* Gmail-Style File Attachments */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <input
                      type="file"
                      ref={fileAttachmentRef}
                      onChange={handleFileAttachment}
                      multiple
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileAttachmentRef.current?.click()}
                      className="h-7 px-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg gap-1.5 cursor-pointer"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>Attach Files (PDF, Docs, Images)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Max 10MB</span>
                    </Button>
                    {attachments.length > 0 && (
                      <span className="text-[10px] font-semibold text-slate-400">
                        {attachments.length} file{attachments.length > 1 ? 's' : ''} ({(attachments.reduce((acc, a) => acc + a.size, 0) / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    )}
                  </div>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700 shadow-xs group"
                        >
                          <FileText className="h-3 w-3 text-orange-500 shrink-0" />
                          <span className="font-medium max-w-[140px] truncate" title={att.filename}>
                            {att.filename}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {att.size > 1024 * 1024
                              ? (att.size / (1024 * 1024)).toFixed(1) + ' MB'
                              : Math.round(att.size / 1024) + ' KB'}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Remove attachment"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                {isMeetingAttached && (
                  <Badge className={`text-[10px] hidden sm:inline-flex items-center gap-1 ${
                    meetingPlatform === 'google_meet'
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20'
                      : meetingPlatform === 'instant'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  }`}>
                    <Video className="h-3 w-3 inline" /> {meetingPlatform === 'google_meet' ? 'Google Meet Attached' : meetingPlatform === 'instant' ? '⚡ Instant Video Room Attached' : 'Meeting Attached'}
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
            <div className="px-6 py-2.5 bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2.5 shrink-0">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 shrink-0">
                <Edit3 className="h-3.5 w-3.5 text-orange-500" /> Subject:
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Click to edit subject line..."
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-400 focus:border-orange-500 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Rendered Live Canvas (Wide, Spacious & Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start custom-scrollbar">
              <div
                className={`transition-all duration-300 ${
                  previewDevice === 'mobile'
                    ? 'w-[390px] shadow-2xl rounded-3xl border-8 border-slate-800 dark:border-slate-700 overflow-hidden bg-white text-slate-900 p-3'
                    : 'w-full max-w-[760px] shadow-2xl rounded-2xl bg-white text-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden'
                }`}
              >
                {/* Mode A: Rich HTML Letterhead */}
                {emailFormat === 'html' ? (
                  <div
                    key={`html-preview-${previewRenderId}`}
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
                  <div className="p-6 sm:p-8 space-y-5 bg-white dark:bg-slate-900 min-h-[500px]">
                    {/* Simulated Mail Header */}
                    <div className="pb-4 border-b border-slate-200 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-400">
                      <p><strong className="text-slate-900 dark:text-slate-100 font-bold">From:</strong> Hindustan OS &lt;kushinde13@gmail.com&gt;</p>
                      <p><strong className="text-slate-900 dark:text-slate-100 font-bold">To:</strong> <span className="text-slate-800 dark:text-slate-200">{recipientsList.length > 0 ? recipientsList.join(', ') : 'recipient@example.com'}</span></p>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-900 dark:text-slate-100 font-bold shrink-0">Subject:</strong>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="(Click to edit Subject)"
                          className="flex-1 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-orange-500 rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 dark:text-white transition-all focus:outline-none"
                          title="Click to edit subject"
                        />
                      </div>
                    </div>

                    {/* Plain Text Content */}
                    <div
                      key={`plain-preview-${previewRenderId}`}
                      contentEditable={isEditablePreview}
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        if (isEditablePreview) {
                          setPlainText(formatPlainText(e.currentTarget.innerText));
                        }
                      }}
                      className={`text-sm text-slate-900 dark:text-slate-100 font-sans leading-relaxed whitespace-pre-wrap min-h-[380px] focus:outline-none select-text ${
                        isEditablePreview ? 'outline-2 outline-orange-400 outline-dashed p-3 rounded-lg bg-orange-50/10 dark:bg-orange-950/20' : ''
                      }`}
                    >
                      {formatPlainText(plainText) || 'Type or generate your plain text email content here...'}
                    </div>

                    {/* Simulated Clean Footer */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
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

        {/* Bulk CSV / Spreadsheet Paste Modal */}
        <BulkCsvImportModal
          open={isBulkModalOpen}
          onOpenChange={setIsBulkModalOpen}
          subjectTemplate={rawSubjectTemplate || subject}
          htmlTemplate={rawHtmlTemplate || htmlBody}
          textTemplate={plainText}
          attachments={attachments.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType
          }))}
          onSuccess={() => {
            setIsBulkModalOpen(false);
            onOpenChange(false);
            if (onSuccess) onSuccess();
          }}
        />

        {/* Create / Save Preset Template Modal */}
        <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
          <DialogContent className="max-w-md p-6 bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[60]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-500" /> Save as Preset Template
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Save the current letter content and subject as a reusable official template in workspace presets.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Probation Extension & Performance Review"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="text-xs rounded-xl h-9"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Category
                </label>
                <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
                  <SelectTrigger className="text-xs rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internship">Internship Offer / Agreement</SelectItem>
                    <SelectItem value="offer_letter">Full-Time Employment Offer</SelectItem>
                    <SelectItem value="certificate">Experience Certificate</SelectItem>
                    <SelectItem value="notice">Performance / Review Notice</SelectItem>
                    <SelectItem value="announcement">Corporate Announcement</SelectItem>
                    <SelectItem value="custom">Custom Workspace Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Subject Line Template
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="text-xs rounded-xl h-9 text-slate-700 dark:text-slate-300 font-bold"
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Captured Letter Content:</p>
                <p className="line-clamp-2 italic text-slate-600 dark:text-slate-400">
                  {emailFormat === 'html'
                    ? (htmlBody.replace(/<[^>]+>/g, ' ').slice(0, 120) || 'Empty HTML content')
                    : (plainText.slice(0, 120) || 'Empty plain text')}...
                </p>
                <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold mt-1">
                  Format: {emailFormat === 'html' ? 'Rich HTML Letterhead' : 'Plain Text'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCreateTemplateOpen(false)}
                className="text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveNewTemplate}
                disabled={isSavingTemplate || !newTemplateName.trim()}
                className="text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white gap-1.5 cursor-pointer"
              >
                {isSavingTemplate ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving Preset...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" /> Save as Preset Template
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
