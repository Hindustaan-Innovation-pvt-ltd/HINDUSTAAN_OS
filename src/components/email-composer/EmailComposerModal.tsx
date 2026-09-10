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
  Video, ExternalLink, Clock, Copy, Briefcase, ChevronDown, Award, Megaphone,
  Settings, Lock, EyeOff, KeyRound, Undo2
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

// Convert plain text into styled HTML wrapper for raw HTML syncing
export function plainTextToHtml(text: string): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap; padding: 24px;">${escaped}</div>`;
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

// Helper to cleanly strip reference number or notice ref from HTML letterhead
export function stripReferenceFromHtml(html: string): string {
  return (html || '')
    .replace(/(Notice Ref|Certificate Ref|Ref):\s*<strong>[^<]*<\/strong>\s*(&nbsp;\|\s*&nbsp;|\|\s*|\s*\|\s*&nbsp;)?/gi, '')
    .replace(/(Notice Ref|Certificate Ref|Ref):\s*[A-Z0-9\/-]+\s*(&nbsp;\|\s*&nbsp;|\|\s*|\s*\|\s*&nbsp;)?/gi, '')
    .replace(/<p([^>]*)>\s*(Date:)/g, '<p$1>$2');
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
    includeRef?: boolean;
    noticeAreas?: string;
    noticeAction?: string;
    certProject?: string;
    certRating?: string;
    announcementAction?: string;
    interviewDate?: string;
    interviewTime?: string;
    interviewMode?: string;
    interviewLocation?: string;
    interviewTopics?: string;
    interviewTools?: string;
    workLocation?: string;
    reportingManager?: string;
  }
) {
  const formattedStartDate = formatDateToCustom(data.startDate) || '08-Sep-2026';
  const formattedInterviewDate = formatDateToCustom(data.interviewDate || data.startDate) || '08-Sep-2026';
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
    .replace(/{{annualCTC}}/g, safeStipend)
    .replace(/{{startDate}}/g, formattedStartDate)
    .replace(/{{interviewDate}}/g, formattedInterviewDate)
    .replace(/{{interviewTime}}/g, data.interviewTime || '3:30 PM');

  let h = (rawHtml || '')
    .replace(/{{referenceId}}/g, data.refId || '3796')
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
    .replace(/{{reportingManager}}/g, data.reportingManager || data.manager || 'Operations & HR Team')
    .replace(/{{workLocation}}/g, data.workLocation || 'Hindustaan Innovations Private Limited, Raipur, Chhattisgarh')
    .replace(/{{projectAccomplished}}/g, data.certProject?.trim() || 'Full Stack Enterprise Systems Development')
    .replace(/{{performanceRating}}/g, data.certRating?.trim() || 'Exemplary / Outstanding')
    .replace(/{{reviewDate}}/g, formattedStartDate)
    .replace(/{{areasOfImprovement}}/g, data.noticeAreas?.trim() || 'Deepening system architecture & cross-functional documentation')
    .replace(/{{supportAction}}/g, data.noticeAction?.trim() || 'Dedicated 1-on-1 mentorship and weekly technical check-ins')
    .replace(/{{actionRequired}}/g, data.announcementAction?.trim() || 'Please review the instructions and align with your team.')
    .replace(/{{interviewDate}}/g, formattedInterviewDate)
    .replace(/{{interviewTime}}/g, data.interviewTime || '3:30 PM')
    .replace(/{{interviewMode}}/g, data.interviewMode || 'In person')
    .replace(/{{interviewLocation}}/g, data.interviewLocation || 'Hindustaan Innovations Private Limited, Raipur, Chhattisgarh')
    .replace(/{{interviewTopics}}/g, data.interviewTopics || 'graphic designing, social media management, content creation, branding, creative campaigns, and social media growth strategies')
    .replace(/{{interviewTools}}/g, data.interviewTools || 'Canva, Photoshop, Illustrator, video editing tools, and other relevant platforms');

  if (data.includeRef === false) {
    h = stripReferenceFromHtml(h);
  }

  return {
    subject: s,
    htmlBody: h,
    plainText: htmlToPlainText(h)
  };
}

export const TEMPLATE_CATEGORIES = [
  { value: 'interview', label: 'Meeting Invitation' },
  { value: 'joining_letter', label: 'Joining Letter' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'custom', label: 'Custom Workspace Template' },
];

export interface RolePreset {
  role: string;
  label: string;
  topics: string;
  tools: string;
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    role: 'Full Stack Developer',
    label: 'Full Stack Developer',
    topics: 'frontend architecture, REST APIs, database schema design, state management, full-lifecycle deployment',
    tools: 'React, Node.js, Express, PostgreSQL / MongoDB, Git, Tailwind CSS'
  },
  {
    role: 'Frontend Developer',
    label: 'Frontend Developer',
    topics: 'responsive UI components, React hooks, performance optimization, CSS layout systems, client-side caching',
    tools: 'React, TypeScript, Next.js / Vite, Tailwind CSS, HTML5/CSS3'
  },
  {
    role: 'Backend Developer',
    label: 'Backend Developer',
    topics: 'API gateway design, microservices, database queries & indexing, authentication/JWT, server performance',
    tools: 'Node.js, Express, PostgreSQL, Prisma ORM, Redis, Docker'
  },
  {
    role: 'ML & Gen AI Engineer',
    label: 'ML & Gen AI Engineer',
    topics: 'LLM integration, Prompt engineering, RAG pipelines, fine-tuning, embeddings & vector databases, Python data processing',
    tools: 'Python, PyTorch, LangChain / LlamaIndex, OpenAI / Groq APIs, Hugging Face, FAISS / Pinecone'
  },
  {
    role: 'UI/UX & Graphic Designer',
    label: 'UI/UX & Graphic Designer',
    topics: 'user research, wireframing, high-fidelity prototypes, design system consistency, branding & visual storytelling',
    tools: 'Figma, Canva, Adobe Photoshop, Illustrator, Adobe XD'
  },
  {
    role: 'None',
    label: 'None / Custom Role (Clear preset)',
    topics: '',
    tools: ''
  }
];

function CategoryDropdown({
  value,
  onChange,
  className = ''
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  const selected = TEMPLATE_CATEGORIES.find((c) => c.value === value) || TEMPLATE_CATEGORIES[0];

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-between gap-2 shadow-xs hover:border-orange-500 dark:hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 transition-all cursor-pointer"
      >
        <span className="truncate">{selected.label}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-[150] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1 max-h-60 overflow-y-auto">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const isCurrent = cat.value === value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  onChange(cat.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                {isCurrent && <Check className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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

  // Format toggle: Rich HTML letterhead vs Simple Plain Email (Plain text as default)
  const [emailFormat, setEmailFormat] = useState<'html' | 'text'>('text');

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
  const [tone, setTone] = useState('Formal & Professional');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [lastSummary, setLastSummary] = useState('');
  // Multi-step AI Generation & Refinement history stack for undo
  const [draftHistory, setDraftHistory] = useState<Array<{
    subject: string;
    htmlBody: string;
    plainText: string;
    tone?: string;
  }>>([]);
  const previousDraftState = draftHistory.length > 0 ? draftHistory[draftHistory.length - 1] : null;

  // Reference / Dispatch ID state & Notice toggle
  const [includeRefNumber, setIncludeRefNumber] = useState(true);
  const [customRefId, setCustomRefId] = useState('');

  // Category specific fields
  const [interviewDate, setInterviewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [interviewTime, setInterviewTime] = useState('3:30 PM');
  const [interviewMode, setInterviewMode] = useState('In person');
  const [interviewLocation, setInterviewLocation] = useState('Hindustaan Innovations Private Limited, Raipur, Chhattisgarh');
  const [interviewTopics, setInterviewTopics] = useState('graphic designing, social media management, content creation, branding, creative campaigns, and social media growth strategies');
  const [interviewTools, setInterviewTools] = useState('Canva, Photoshop, Illustrator, video editing tools, and other relevant platforms');

  const [noticeAreas, setNoticeAreas] = useState('Deepening system architecture & cross-functional documentation');
  const [noticeAction, setNoticeAction] = useState('Dedicated 1-on-1 mentorship and weekly technical check-ins');
  const [certProject, setCertProject] = useState('Full Stack Enterprise Systems Development');
  const [certRating, setCertRating] = useState('Exemplary / Outstanding');
  const [announcementAction, setAnnouncementAction] = useState('Please review the documentation and align with your team.');
  const [workLocation, setWorkLocation] = useState('Hindustaan Innovations Private Limited, Raipur, Chhattisgarh');
  const [reportingManager, setReportingManager] = useState('Operations & HR Team');

  // Edit Pre-Existing Template modal state
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState('');
  const [editTemplateName, setEditTemplateName] = useState('');
  const [editTemplateCategory, setEditTemplateCategory] = useState('interview');
  const [editTemplateSubject, setEditTemplateSubject] = useState('');
  const [editTemplateHtmlBody, setEditTemplateHtmlBody] = useState('');
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);
  const [isDeletingTemplate, setIsDeletingTemplate] = useState(false);

  // Dynamic Encrypted SMTP Configuration state
  const [isSmtpConfigOpen, setIsSmtpConfigOpen] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUserEmail, setSmtpUserEmail] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSenderName, setSmtpSenderName] = useState('Hindustaan Innovations HR');
  const [smtpSenderEmail, setSmtpSenderEmail] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [hasConfiguredSmtp, setHasConfiguredSmtp] = useState(false);

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
  const [newTemplateCategory, setNewTemplateCategory] = useState('interview');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Quick Rename Modal state
  const [isQuickRenameOpen, setIsQuickRenameOpen] = useState(false);
  const [renameTemplateId, setRenameTemplateId] = useState('');
  const [renameTemplateName, setRenameTemplateName] = useState('');
  const [isRenamingTemplate, setIsRenamingTemplate] = useState(false);

  // Delete Confirmation Modal state
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetTemplate, setDeleteTargetTemplate] = useState<EmailTemplateItem | null>(null);

  // Manage All Presets Modal state
  const [isManageTemplatesOpen, setIsManageTemplatesOpen] = useState(false);
  const returnToManageRef = useRef(false);

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
      fetchSmtpConfig();
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
      role: candidateRole || (t.category === 'interview' ? 'Graphic Designer & Social Media Manager' : t.category === 'joining_letter' ? 'Software Engineer' : 'Full Stack Developer'),
      stipend: stipend || (t.category === 'offer_letter' ? '₹6,00,000 PA' : ''),
      startDate,
      duration: duration || (t.category === 'offer_letter' ? '6 Months Probation' : ''),
      manager: reportingManager || user?.name || 'Operations & HR Team',
      workLocation: workLocation || 'Hindustaan Innovations Private Limited, Raipur, Chhattisgarh',
      reportingManager: reportingManager || user?.name || 'Operations & HR Team',
      refId: customRefId || randomRef,
      dateStr: todayStr,
      includeRef: includeRefNumber,
      noticeAreas,
      noticeAction,
      certProject,
      certRating,
      announcementAction,
      interviewDate,
      interviewTime,
      interviewMode,
      interviewLocation,
      interviewTopics,
      interviewTools
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

  // Open Edit Template modal with current template's data
  const handleOpenEditTemplate = () => {
    const current = templates.find((t) => t.id === selectedTemplateId);
    if (!current) return;
    setEditTemplateId(current.id);
    setEditTemplateName(current.name);
    setEditTemplateCategory(current.category);
    setEditTemplateSubject(current.subject);
    setEditTemplateHtmlBody(current.htmlBody);
    setIsEditTemplateOpen(true);
  };

  // Save changes to existing template via PUT /api/email/templates/:id
  const handleSaveEditedTemplate = async () => {
    if (!editTemplateName.trim()) {
      toast.error('Template name cannot be empty');
      return;
    }
    if (!editTemplateSubject.trim()) {
      toast.error('Subject line template cannot be empty');
      return;
    }
    if (!editTemplateHtmlBody.trim()) {
      toast.error('Template HTML body cannot be empty');
      return;
    }

    try {
      setIsUpdatingTemplate(true);
      const res = await api.put(`/email/templates/${editTemplateId}`, {
        name: editTemplateName.trim(),
        category: editTemplateCategory,
        subject: editTemplateSubject.trim(),
        htmlBody: editTemplateHtmlBody
      });

      if (res.data?.success && res.data.data) {
        const updated = res.data.data as EmailTemplateItem;
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

        if (selectedTemplateId === updated.id) {
          setRawSubjectTemplate(updated.subject);
          setRawHtmlTemplate(updated.htmlBody);

          const rendered = interpolateTemplate(updated.htmlBody, updated.subject, {
            name: candidateName || 'Candidate',
            role: candidateRole,
            stipend,
            startDate,
            duration,
            manager: reportingManager || user?.name || 'Operations & HR Team',
            workLocation: workLocation || 'Hindustaan Innovations Private Limited, Raipur, Chhattisgarh',
            reportingManager: reportingManager || user?.name || 'Operations & HR Team',
            refId: customRefId || currentRefId,
            dateStr: currentDateStr,
            includeRef: includeRefNumber,
            noticeAreas,
            noticeAction,
            certProject,
            certRating,
            announcementAction,
            interviewDate,
            interviewTime,
            interviewMode,
            interviewLocation,
            interviewTopics,
            interviewTools
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
        }

        toast.success(`Template "${updated.name}" updated successfully!`);
        setIsEditTemplateOpen(false);
        if (returnToManageRef.current) {
          setIsManageTemplatesOpen(true);
          returnToManageRef.current = false;
        }
      }
    } catch (err: any) {
      console.error('Failed to update template:', err);
      toast.error(err.response?.data?.message || 'Failed to update template');
    } finally {
      setIsUpdatingTemplate(false);
    }
  };

  // Delete template via DELETE /api/email/templates/:id
  const handleDeleteTemplate = async () => {
    if (!editTemplateId) return;
    handlePromptDeleteTemplate(editTemplateId);
  };

  // Open quick rename modal
  const handleOpenQuickRename = (templateId: string) => {
    const target = templates.find((t) => t.id === templateId);
    if (!target) return;
    setRenameTemplateId(target.id);
    setRenameTemplateName(target.name);
    setIsQuickRenameOpen(true);
  };

  // Save quick rename via PUT /api/email/templates/:id
  const handleSaveQuickRename = async () => {
    if (!renameTemplateName.trim()) {
      toast.error('Template name cannot be empty');
      return;
    }
    try {
      setIsRenamingTemplate(true);
      const res = await api.put(`/email/templates/${renameTemplateId}`, {
        name: renameTemplateName.trim()
      });
      if (res.data?.success && res.data.data) {
        const updated = res.data.data as EmailTemplateItem;
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? { ...t, name: updated.name } : t)));
        toast.success(`Template renamed to "${updated.name}" successfully!`);
        setIsQuickRenameOpen(false);
        if (returnToManageRef.current) {
          setIsManageTemplatesOpen(true);
          returnToManageRef.current = false;
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to rename template');
    } finally {
      setIsRenamingTemplate(false);
    }
  };

  // Open delete confirm modal
  const handlePromptDeleteTemplate = (templateId: string) => {
    const target = templates.find((t) => t.id === templateId);
    if (!target) return;
    setDeleteTargetTemplate(target);
    setIsDeleteConfirmOpen(true);
  };

  // Execute template deletion via DELETE /api/email/templates/:id
  const handleConfirmDeleteTemplate = async () => {
    if (!deleteTargetTemplate) return;
    try {
      setIsDeletingTemplate(true);
      const res = await api.delete(`/email/templates/${deleteTargetTemplate.id}`);
      if (res.data?.success) {
        toast.success(`Template "${deleteTargetTemplate.name}" deleted successfully!`);
        setTemplates((prev) => prev.filter((t) => t.id !== deleteTargetTemplate.id));
        if (selectedTemplateId === deleteTargetTemplate.id) {
          handleApplyBlankCanvas();
        }
        setIsDeleteConfirmOpen(false);
        setDeleteTargetTemplate(null);
        if (isEditTemplateOpen) setIsEditTemplateOpen(false);
        if (returnToManageRef.current) {
          setIsManageTemplatesOpen(true);
          returnToManageRef.current = false;
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete template');
    } finally {
      setIsDeletingTemplate(false);
    }
  };

  // Fetch SMTP Configuration
  const fetchSmtpConfig = async () => {
    try {
      const res = await api.get('/email/config');
      if (res.data?.success && res.data.data) {
        const cfg = res.data.data;
        setSmtpHost(cfg.host || '');
        setSmtpPort(cfg.port || 465);
        setSmtpSecure(cfg.secure !== undefined ? cfg.secure : true);
        setSmtpUserEmail(cfg.userEmail || '');
        setSmtpSenderName(cfg.senderName || 'Hindustaan Innovations HR');
        setSmtpSenderEmail(cfg.senderEmail || '');
        setHasConfiguredSmtp(cfg.hasPassword || false);
      }
    } catch (err) {
      console.error('Failed to load SMTP config:', err);
    }
  };

  // Test SMTP Connection
  const handleTestSmtp = async () => {
    const host = smtpHost.trim() || 'smtp.gmail.com';
    const email = smtpUserEmail.trim();
    if (!email) {
      toast.error('Please enter your SMTP Login Email');
      return;
    }
    if (!smtpPassword.trim() && !hasConfiguredSmtp) {
      toast.error('Please enter your 16-character Gmail App Password');
      return;
    }
    try {
      setIsTestingSmtp(true);
      const res = await api.post('/email/config/test', {
        host,
        port: 465,
        secure: true,
        userEmail: email,
        password: smtpPassword.trim(),
        senderName: smtpSenderName.trim() || 'Hindustaan Innovations HR',
        senderEmail: smtpSenderEmail.trim() || email
      });
      if (res.data?.success) {
        toast.success('SMTP Connection Verified Successfully!', {
          description: res.data.message || 'Ready to send emails.'
        });
      } else {
        toast.error(res.data?.message || 'SMTP connection failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'SMTP Connection Test Failed');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Save Dynamic SMTP Configuration
  const handleSaveSmtp = async () => {
    const host = smtpHost.trim() || 'smtp.gmail.com';
    const email = smtpUserEmail.trim();
    if (!email) {
      toast.error('Login Email is required');
      return;
    }
    if (!smtpPassword.trim() && !hasConfiguredSmtp) {
      toast.error('Password is required for first-time SMTP setup');
      return;
    }
    try {
      setIsSavingSmtp(true);
      const res = await api.post('/email/config', {
        host,
        port: 465,
        secure: true,
        userEmail: email,
        password: smtpPassword.trim(),
        senderName: smtpSenderName.trim() || 'Hindustaan Innovations HR',
        senderEmail: smtpSenderEmail.trim() || email,
        isDefault: true
      });
      if (res.data?.success) {
        toast.success('SMTP Configuration Saved & Encrypted!', {
          description: 'Credentials secured with AES-256-GCM and shared across all computers.'
        });
        setHasConfiguredSmtp(true);
        setSmtpPassword('');
        setIsSmtpConfigOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save SMTP configuration');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  // Re-renders the preview instantly with any overridden field values
  const triggerLiveRender = (overrides?: {
    name?: string;
    role?: string;
    stipend?: string;
    startDate?: string;
    duration?: string;
    noticeAreas?: string;
    noticeAction?: string;
    certProject?: string;
    certRating?: string;
    announcementAction?: string;
    includeRef?: boolean;
    refId?: string;
    interviewDate?: string;
    interviewTime?: string;
    interviewMode?: string;
    interviewLocation?: string;
    interviewTopics?: string;
    interviewTools?: string;
    workLocation?: string;
    reportingManager?: string;
  }) => {
    const valName = overrides?.name !== undefined ? overrides.name : candidateName;
    const valRole = overrides?.role !== undefined ? overrides.role : candidateRole;
    const valStipend = overrides?.stipend !== undefined ? overrides.stipend : stipend;
    const valStart = overrides?.startDate !== undefined ? overrides.startDate : startDate;
    const valDur = overrides?.duration !== undefined ? overrides.duration : duration;
    const valWorkLoc = overrides?.workLocation !== undefined ? overrides.workLocation : workLocation;
    const valRepMgr = overrides?.reportingManager !== undefined ? overrides.reportingManager : reportingManager;
    const valNoticeAreas = overrides?.noticeAreas !== undefined ? overrides.noticeAreas : noticeAreas;
    const valNoticeAction = overrides?.noticeAction !== undefined ? overrides.noticeAction : noticeAction;
    const valCertProj = overrides?.certProject !== undefined ? overrides.certProject : certProject;
    const valCertRate = overrides?.certRating !== undefined ? overrides.certRating : certRating;
    const valAnnAction = overrides?.announcementAction !== undefined ? overrides.announcementAction : announcementAction;
    const valIncludeRef = overrides?.includeRef !== undefined ? overrides.includeRef : includeRefNumber;
    const valRefId = overrides?.refId !== undefined ? overrides.refId : (customRefId || currentRefId);
    const valInterviewDate = overrides?.interviewDate !== undefined ? overrides.interviewDate : interviewDate;
    const valInterviewTime = overrides?.interviewTime !== undefined ? overrides.interviewTime : interviewTime;
    const valInterviewMode = overrides?.interviewMode !== undefined ? overrides.interviewMode : interviewMode;
    const valInterviewLocation = overrides?.interviewLocation !== undefined ? overrides.interviewLocation : interviewLocation;
    const valInterviewTopics = overrides?.interviewTopics !== undefined ? overrides.interviewTopics : interviewTopics;
    const valInterviewTools = overrides?.interviewTools !== undefined ? overrides.interviewTools : interviewTools;

    // 1. BLANK CANVAS or custom draft mode: Protect user draft from being overwritten!
    if (selectedTemplateId === 'none' || (rawHtmlTemplate && !rawHtmlTemplate.includes('{{'))) {
      if (overrides?.name !== undefined) {
        const newName = overrides.name;
        const oldName = candidateName;

        const replaceName = (content: string) => {
          if (!content) return content;
          if (oldName && oldName.trim() && content.includes(oldName.trim())) {
            return content.split(oldName.trim()).join(newName.trim() || '[Employee Name]');
          }
          return content
            .replace(/\[(Employee Name|Candidate Name|Recipient Name|Candidate|Employee)\]/gi, newName.trim() || '[Employee Name]')
            .replace(/{{(candidateName|name|employeeName)}}/g, newName.trim() || '[Employee Name]');
        };

        setPlainText(prev => replaceName(prev));
        setHtmlBody(prev => replaceName(prev));
        setSubject(prev => replaceName(prev));
        setPreviewRenderId(prev => prev + 1);
      }
      return;
    }

    if (rawHtmlTemplate && rawHtmlTemplate.includes('{{')) {
      const rendered = interpolateTemplate(rawHtmlTemplate, rawSubjectTemplate || subject, {
        name: valName,
        role: valRole,
        stipend: valStipend,
        startDate: valStart,
        duration: valDur,
        manager: valRepMgr || user?.name || 'Operations & HR Team',
        workLocation: valWorkLoc,
        reportingManager: valRepMgr,
        refId: valRefId,
        dateStr: currentDateStr,
        includeRef: valIncludeRef,
        noticeAreas: valNoticeAreas,
        noticeAction: valNoticeAction,
        certProject: valCertProj,
        certRating: valCertRate,
        announcementAction: valAnnAction,
        interviewDate: valInterviewDate,
        interviewTime: valInterviewTime,
        interviewMode: valInterviewMode,
        interviewLocation: valInterviewLocation,
        interviewTopics: valInterviewTopics,
        interviewTools: valInterviewTools
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
    } else {
      if (overrides?.name !== undefined && candidateName) {
        setHtmlBody((prev) => prev.replace(new RegExp(candidateName, 'g'), overrides.name!));
        setSubject((prev) => prev.replace(new RegExp(candidateName, 'g'), overrides.name!));
        setPlainText((prev) => prev.replace(new RegExp(candidateName, 'g'), overrides.name!));
        setPreviewRenderId((prev) => prev + 1);
      }
    }
  };

  const handleTemplateChange = (id: string) => {
    if (id === 'none') {
      handleApplyBlankCanvas();
      toast.info('Switched to Blank Canvas (Custom AI Email)');
      return;
    }
    const found = templates.find((t) => t.id === id);
    if (found) {
      applyTemplate(found);
    }
  };

  // Keystroke Live-Sync: Instantly re-renders preview & subject as the user types in any input!
  const handleFieldChange = (key: string, value: string) => {
    if (key === 'name') {
      setCandidateName(value);
      triggerLiveRender({ name: value });
    } else if (key === 'role') {
      setCandidateRole(value);
      triggerLiveRender({ role: value });
    } else if (key === 'stipend') {
      setStipend(value);
      triggerLiveRender({ stipend: value });
    } else if (key === 'startDate') {
      setStartDate(value);
      triggerLiveRender({ startDate: value });
    } else if (key === 'duration') {
      setDuration(value);
      triggerLiveRender({ duration: value });
    } else if (key === 'workLocation') {
      setWorkLocation(value);
      triggerLiveRender({ workLocation: value });
    } else if (key === 'reportingManager') {
      setReportingManager(value);
      triggerLiveRender({ reportingManager: value });
    } else if (key === 'noticeAreas') {
      setNoticeAreas(value);
      triggerLiveRender({ noticeAreas: value });
    } else if (key === 'noticeAction') {
      setNoticeAction(value);
      triggerLiveRender({ noticeAction: value });
    } else if (key === 'certProject') {
      setCertProject(value);
      triggerLiveRender({ certProject: value });
    } else if (key === 'certRating') {
      setCertRating(value);
      triggerLiveRender({ certRating: value });
    } else if (key === 'announcementAction') {
      setAnnouncementAction(value);
      triggerLiveRender({ announcementAction: value });
    } else if (key === 'interviewDate') {
      setInterviewDate(value);
      triggerLiveRender({ interviewDate: value });
    } else if (key === 'interviewTime') {
      setInterviewTime(value);
      triggerLiveRender({ interviewTime: value });
    } else if (key === 'interviewMode') {
      setInterviewMode(value);
      triggerLiveRender({ interviewMode: value });
    } else if (key === 'interviewLocation') {
      setInterviewLocation(value);
      triggerLiveRender({ interviewLocation: value });
    } else if (key === 'interviewTopics') {
      setInterviewTopics(value);
      triggerLiveRender({ interviewTopics: value });
    } else if (key === 'interviewTools') {
      setInterviewTools(value);
      triggerLiveRender({ interviewTools: value });
    }
  };

  const handleRoleSelect = (selectedRole: string) => {
    if (selectedRole === 'None') {
      setCandidateRole('');
      setInterviewTopics('');
      setInterviewTools('');
      triggerLiveRender({ role: '', interviewTopics: '', interviewTools: '' });
      return;
    }

    const preset = ROLE_PRESETS.find(p => p.role === selectedRole);
    if (preset) {
      setCandidateRole(preset.role);
      setInterviewTopics(preset.topics);
      setInterviewTools(preset.tools);
      triggerLiveRender({ 
        role: preset.role, 
        interviewTopics: preset.topics, 
        interviewTools: preset.tools 
      });
    } else {
      setCandidateRole(selectedRole);
      triggerLiveRender({ role: selectedRole });
    }
  };

  const handleToggleRefNumber = (checked: boolean) => {
    setIncludeRefNumber(checked);
    triggerLiveRender({ includeRef: checked });
  };

  const handleCustomRefChange = (val: string) => {
    setCustomRefId(val);
    triggerLiveRender({ refId: val || currentRefId });
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
      const currentT = !isNone ? templates.find((t) => t.id === selectedTemplateId) : null;
      const isCompRelevant = currentT?.category === 'offer_letter' || isNone;

      const payload = {
        format: emailFormat,
        templateCategory: isNone ? 'none' : (currentT?.category || 'none'),
        candidateName: candidateName.trim() || (isNone ? 'Recipient' : 'Candidate'),
        candidateEmail: recipientsList[0] || '',
        role: isRoleFieldsOpen ? candidateRole.trim() : '',
        stipend: isRoleFieldsOpen && isCompRelevant ? stipend.trim() : '',
        startDate: isRoleFieldsOpen ? startDate : '',
        duration: isRoleFieldsOpen && (currentT?.category === 'offer_letter' || isNone) ? duration.trim() : '',
        tone,
        prompt: customPrompt,
        meetingLink: meetingLink.trim(),
        meetingDateTime: meetingDateTime.trim(),
        meetingPlatform: meetingPlatform === 'google_meet' ? 'Google Meet' : meetingPlatform === 'zoom' ? 'Zoom' : meetingPlatform === 'teams' ? 'MS Teams' : 'Video Conference'
      };

      const res = await api.post('/email/ai-generate', payload);
      if (res.data?.success && res.data.data) {
        const newSubj = res.data.data.subject || subject;
        let newText = res.data.data.textBody ? formatPlainText(res.data.data.textBody) : (res.data.data.htmlBody ? htmlToPlainText(res.data.data.htmlBody) : plainText);
        let newHtml = res.data.data.htmlBody || (newText ? plainTextToHtml(newText) : htmlBody);

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

        if (subject || plainText || htmlBody) {
          setDraftHistory(prev => [...prev, {
            subject,
            htmlBody,
            plainText,
            tone
          }]);
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
        // Save current draft snapshot before applying refinement to multi-step undo history
        setDraftHistory(prev => [...prev, {
          subject,
          htmlBody,
          plainText,
          tone
        }]);

        const newSubj = res.data.data.subject || subject;
        let newText = res.data.data.textBody ? formatPlainText(res.data.data.textBody) : (res.data.data.htmlBody ? htmlToPlainText(res.data.data.htmlBody) : plainText);
        let newHtml = res.data.data.htmlBody || (newText ? plainTextToHtml(newText) : htmlBody);

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

  // Undo last AI transformation and restore previous draft (multi-step undo)
  const handleUndoLastAiChange = () => {
    if (draftHistory.length === 0) return;
    const previous = draftHistory[draftHistory.length - 1];
    setRawSubjectTemplate(previous.subject);
    setRawHtmlTemplate(previous.htmlBody);
    setSubject(previous.subject);
    setHtmlBody(previous.htmlBody);
    setPlainText(previous.plainText);
    if (previous.tone) {
      setTone(previous.tone);
    }
    setDraftHistory(prev => prev.slice(0, -1));
    setPreviewRenderId(prev => prev + 1);
    toast.info(`Reverted AI change (${draftHistory.length - 1} remaining in history)`);
  };

  // Communication Tone toggle & live AI refinement with undo
  const handleToneClick = async (selectedTone: string) => {
    if (isGeneratingAi) return;

    // If clicking the already selected tone, toggle off / undo
    if (tone === selectedTone) {
      const defaultTone = 'None / Standard';
      setTone(defaultTone);
      // If the latest history entry was this tone adjustment, undo it directly
      if (draftHistory.length > 0) {
        handleUndoLastAiChange();
      } else {
        toast.info(`Tone deselected (Neutral tone active)`);
      }
      return;
    }

    const prevTone = tone;
    setTone(selectedTone);

    const activeContent = emailFormat === 'text' ? plainText.trim() : htmlBody.trim();
    // If draft already has content, live refine it with AI and save previous state to draftHistory
    if (activeContent.length > 30 && selectedTone !== 'None / Standard') {
      try {
        setIsGeneratingAi(true);
        setDraftHistory(prev => [...prev, {
          subject,
          htmlBody,
          plainText,
          tone: prevTone
        }]);

        const instruction = `Adjust the tone and writing style of this email to be ${selectedTone}, keeping all core details, requirements, links, and dates unchanged.`;
        const res = await api.post('/email/ai-generate', {
          format: emailFormat,
          isRefine: true,
          currentSubject: subject,
          currentContent: emailFormat === 'text' ? plainText : htmlBody,
          instruction
        });

        if (res.data?.success && res.data.data) {
          const newSubj = res.data.data.subject || subject;
          let newText = res.data.data.textBody ? formatPlainText(res.data.data.textBody) : (res.data.data.htmlBody ? htmlToPlainText(res.data.data.htmlBody) : plainText);
          let newHtml = res.data.data.htmlBody || (newText ? plainTextToHtml(newText) : htmlBody);

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
          setLastSummary(res.data.data.summary || `Tone refined to ${selectedTone}`);
          setPreviewRenderId(prev => prev + 1);
          toast.success(`Tone applied: ${selectedTone}`, {
            description: 'Click "Undo AI Change" or re-click this tone button to revert.'
          });
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to apply tone');
      } finally {
        setIsGeneratingAi(false);
      }
    } else {
      toast.info(`Tone selected: "${selectedTone}"`);
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
    <>
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
                  <Sparkles className="h-3 w-3 mr-1 inline" /> Groq AI
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 hidden sm:block">
                Draft official meeting invitations, joining letters, offer letters, or clean plain emails with live preview.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-8">
            {/* SMTP Settings Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                fetchSmtpConfig();
                setIsSmtpConfigOpen(true);
              }}
              className="text-xs font-bold gap-1.5 rounded-xl border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
              title="Configure Dynamic SMTP Server & Credentials (AES-256-GCM Encrypted)"
            >
              <Settings className="h-3.5 w-3.5 text-orange-500" />
              SMTP Config
            </Button>

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
          </div>
        </div>

        {/* Main Body: 2 Wide Columns */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Column: Form & AI Controls (Comfortable 460px width) */}
          <div className="w-full lg:w-[480px] xl:w-[520px] border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-[#0B1120] overflow-y-auto shrink-0 custom-scrollbar">
            
            {/* 1. Sender Info Bar */}
            <div className="px-4 py-2 bg-slate-50/90 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  {smtpSenderName || 'Hindustaan Innovations HR'}
                </span>
                <span className="text-slate-500 font-mono text-[10px] truncate">
                  &lt;{smtpSenderEmail || smtpUserEmail || 'hr@hindustaan.com'}&gt;
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  fetchSmtpConfig();
                  setIsSmtpConfigOpen(true);
                }}
                className="text-[10px] font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                title="Configure SMTP Server"
              >
                <Settings className="h-3 w-3" /> SMTP
              </button>
            </div>

            {/* 2. Recipients & Quick Target Selection */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2.5 shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-orange-500" /> Recipients ({recipientsList.length})
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
              <div className="min-h-[36px] max-h-24 overflow-y-auto p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center gap-1.5 custom-scrollbar">
                {recipientsList.length === 0 && (
                  <span className="text-[11px] text-slate-400 pl-1">No recipient added yet. Type email below...</span>
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

              {/* 3. Attach Files */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
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
                  <span>Attach Files</span>
                  <span className="text-[10px] text-slate-400 font-normal">(PDF, Docs, Max 10MB)</span>
                </Button>
                {attachments.length > 0 && (
                  <span className="text-[10px] font-semibold text-slate-500">
                    {attachments.length} file{attachments.length > 1 ? 's' : ''} ({(attachments.reduce((acc, a) => acc + a.size, 0) / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                )}
              </div>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto custom-scrollbar">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-slate-700 shadow-xs group"
                    >
                      <FileText className="h-3 w-3 text-orange-500 shrink-0" />
                      <span className="font-medium max-w-[130px] truncate" title={att.filename}>
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

            {/* Template Selector Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-orange-500" /> Choose Pre-Fixed Template Preset
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsManageTemplatesOpen(true)}
                    className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300/60 dark:hover:bg-slate-700 px-2 py-0.5 rounded-md"
                    title="View, rename or delete any workspace template preset"
                  >
                    <Settings className="h-3 w-3 text-slate-500" /> Manage Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateTemplateOpen(true)}
                    className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> + New Template
                  </button>
                </div>
              </div>
              <Select 
                value={selectedTemplateId} 
                onValueChange={(val) => {
                  if (val === '__add_new__') {
                    setIsCreateTemplateOpen(true);
                  } else if (val === '__manage_all__') {
                    setIsManageTemplatesOpen(true);
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
                  {templates.map(t => {
                    const catObj = TEMPLATE_CATEGORIES.find(c => c.value === t.category);
                    const catLabel = catObj ? catObj.label : t.category;
                    return (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{t.name}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({catLabel})</span>
                      </SelectItem>
                    );
                  })}
                  <SelectItem value="__add_new__" className="text-xs font-bold text-orange-600 dark:text-orange-400 border-t border-slate-100 dark:border-slate-800 mt-1 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5 text-orange-500" /> + Add / Save Current as New Template
                    </span>
                  </SelectItem>
                  <SelectItem value="__manage_all__" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                    <span className="flex items-center gap-1.5">
                      <Settings className="h-3.5 w-3.5 text-slate-500" /> ⚙️ Manage / Rename / Delete Templates...
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode Switch Tabs (AI Assistant vs Manual Customizer) */}
            <div className="p-4 flex-1">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4">
                  <TabsTrigger value="ai" className="rounded-lg text-xs font-bold gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-xs cursor-pointer py-1.5 transition-colors">
                    <Wand2 className="h-3.5 w-3.5 text-orange-500 shrink-0" /> AI Assistant (Groq)
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="rounded-lg text-xs font-bold gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400 data-[state=active]:shadow-xs cursor-pointer py-1.5 transition-colors">
                    <Edit3 className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" /> Manual Customizer
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
                      placeholder={selectedTemplateId === 'none' ? "e.g. Discussion on New Version Release – Team Sync" : "e.g. Meeting Invitation – Software Engineer at Hindustan Innovation"}
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
                      placeholder="e.g. Aarav Sharma"
                      value={candidateName}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="text-xs rounded-xl h-9 bg-slate-50 dark:bg-slate-800/60 font-medium"
                    />
                  </div>

                  {/* Custom Instructions right after Candidate Name */}
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

                  {/* Collapsible Category-Specific Details Accordion */}
                  {(() => {
                    const activeT = templates.find((t) => t.id === selectedTemplateId);
                    const activeCategory = selectedTemplateId === 'none' ? 'none' : (activeT?.category || 'general');

                    return (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/60 dark:bg-slate-900/40">
                        <button
                          type="button"
                          onClick={() => setIsRoleFieldsOpen(!isRoleFieldsOpen)}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            {activeCategory === 'interview' ? (
                              <Video className="h-3.5 w-3.5 text-orange-500" />
                            ) : activeCategory === 'joining_letter' ? (
                              <FileText className="h-3.5 w-3.5 text-blue-500" />
                            ) : activeCategory === 'offer_letter' ? (
                              <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Briefcase className="h-3.5 w-3.5 text-orange-500" />
                            )}
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {activeCategory === 'interview'
                                ? 'Meeting & Interview Schedule Details'
                                : activeCategory === 'joining_letter'
                                ? 'Joining & Reporting Details'
                                : activeCategory === 'offer_letter'
                                ? 'Employment Offer & Compensation Terms'
                                : 'Optional Role & Details'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                              {isRoleFieldsOpen ? 'Expanded' : 'Configure'}
                            </span>
                            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isRoleFieldsOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </button>
                        {isRoleFieldsOpen && (
                          <div className="p-3 pt-2 space-y-2.5 border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/50">
                            {/* Reference Tracking ID Checkbox Control */}
                            {activeCategory !== 'none' && activeCategory !== 'interview' && (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                                <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-300 select-none">
                                  <input
                                    type="checkbox"
                                    checked={includeRefNumber}
                                    onChange={(e) => handleToggleRefNumber(e.target.checked)}
                                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-400 h-3.5 w-3.5 cursor-pointer"
                                  />
                                  <span>
                                    {activeCategory === 'joining_letter'
                                      ? 'Include Joining Ref (HIPL/JL/...)'
                                      : activeCategory === 'offer_letter'
                                      ? 'Include Offer Ref (HIPL/OFR/...)'
                                      : 'Include Official Ref Number'}
                                  </span>
                                </label>
                                {includeRefNumber && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-mono">Ref ID:</span>
                                    <Input
                                      value={customRefId}
                                      onChange={(e) => handleCustomRefChange(e.target.value)}
                                      placeholder={currentRefId}
                                      className="text-xs h-7 w-20 px-2 font-mono font-bold bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                                      title="Customize reference tracking number"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 1. MEETING INVITATION CATEGORY */}
                            {activeCategory === 'interview' && (
                              <>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                                      Candidate Role / Designation
                                    </label>
                                    <span className="text-[9px] text-orange-500 font-semibold">Presets auto-fill topics & tools</span>
                                  </div>
                                  <div className="space-y-1.5">
                                    <Select
                                      value={ROLE_PRESETS.some(p => p.role === candidateRole) ? candidateRole : (candidateRole ? 'custom' : 'None')}
                                      onValueChange={(val) => {
                                        if (val === 'custom') return;
                                        handleRoleSelect(val);
                                      }}
                                    >
                                      <SelectTrigger className="w-full text-xs font-bold rounded-lg bg-slate-50 dark:bg-slate-800/60 h-8 border-slate-200 dark:border-slate-700">
                                        <SelectValue placeholder="Select Role (e.g. Full Stack, Backend, ML...)" />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-64">
                                        {ROLE_PRESETS.map((p) => (
                                          <SelectItem key={p.role} value={p.role} className="text-xs font-medium">
                                            {p.role === 'None' ? 'None (Clear topics & tools)' : p.label}
                                          </SelectItem>
                                        ))}
                                        {candidateRole && !ROLE_PRESETS.some(p => p.role === candidateRole) && (
                                          <SelectItem value="custom" className="text-xs font-bold text-orange-600">
                                            Custom: {candidateRole}
                                          </SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      placeholder="Or customize / type specific role title..."
                                      value={candidateRole}
                                      onChange={(e) => handleFieldChange('role', e.target.value)}
                                      className="text-xs rounded-lg h-7.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-medium"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Meeting Date
                                    </label>
                                    <div className="relative inline-flex items-center w-full">
                                      <input
                                        type="date"
                                        value={interviewDate}
                                        onChange={(e) => handleFieldChange('interviewDate', e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                      />
                                      <div className="w-full h-8 px-2.5 rounded-lg border border-slate-700/80 bg-[#0B1120] hover:bg-slate-900 text-white flex items-center justify-between gap-1 shadow-inner transition-colors cursor-pointer group">
                                        <span className="text-[10px] font-bold tracking-wide text-white truncate">
                                          {formatDateToCustom(interviewDate) || '08-Sep-2026'}
                                        </span>
                                        <Calendar className="h-3 w-3 text-slate-400 group-hover:text-white transition-colors shrink-0" />
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Meeting Time
                                    </label>
                                    <Input
                                      placeholder="e.g. 3:30 PM"
                                      value={interviewTime}
                                      onChange={(e) => handleFieldChange('interviewTime', e.target.value)}
                                      className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Meeting Mode
                                    </label>
                                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleFieldChange('interviewMode', 'In person');
                                          handleRemoveMeeting();
                                        }}
                                        className={`text-xs font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                          interviewMode.toLowerCase().includes('in person') || interviewMode.toLowerCase().includes('offline')
                                            ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                        }`}
                                      >
                                        <Building2 className="h-3.5 w-3.5" /> In person
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleFieldChange('interviewMode', 'Online');
                                        }}
                                        className={`text-xs font-bold py-1.5 px-3 rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                          interviewMode.toLowerCase().includes('online') || interviewMode.toLowerCase().includes('meet') || interviewMode.toLowerCase().includes('virtual')
                                            ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                        }`}
                                      >
                                        <Video className="h-3.5 w-3.5" /> Online (Meet Link)
                                      </button>
                                    </div>
                                  </div>

                                  {(interviewMode.toLowerCase().includes('in person') || interviewMode.toLowerCase().includes('offline')) ? (
                                    <div>
                                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                        Office / Physical Location Address
                                      </label>
                                      <Input
                                        placeholder="e.g. Hindustaan Innovations Private Limited, Raipur, Chhattisgarh"
                                        value={interviewLocation}
                                        onChange={(e) => handleFieldChange('interviewLocation', e.target.value)}
                                        className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                      />
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                                          Google Meet / Video Meeting Link
                                        </label>
                                        <button
                                          type="button"
                                          onClick={handleOpenGoogleMeetNew}
                                          className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                                        >
                                          <ExternalLink className="h-3 w-3" /> Create Room ↗
                                        </button>
                                      </div>
                                      <Input
                                        placeholder="https://meet.google.com/xxx-yyyy-zzz"
                                        value={meetingLink}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setMeetingLink(val);
                                          handleInsertOrUpdateMeeting(val, interviewTime);
                                        }}
                                        className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-mono text-slate-900 dark:text-slate-100"
                                      />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Discussion Topics & Experience Focus
                                  </label>
                                  <Input
                                    placeholder="e.g. frontend architecture, REST APIs, database schema design"
                                    value={interviewTopics}
                                    onChange={(e) => handleFieldChange('interviewTopics', e.target.value)}
                                    className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Required Tools / Familiarity
                                  </label>
                                  <Input
                                    placeholder="e.g. React, Node.js, Express, PostgreSQL"
                                    value={interviewTools}
                                    onChange={(e) => handleFieldChange('interviewTools', e.target.value)}
                                    className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                  />
                                </div>
                              </>
                            )}

                            {/* 2. JOINING LETTER CATEGORY */}
                            {activeCategory === 'joining_letter' && (
                              <>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Designation / Role Title
                                  </label>
                                  <Input
                                    placeholder="e.g. Software Engineer"
                                    value={candidateRole}
                                    onChange={(e) => handleFieldChange('role', e.target.value)}
                                    className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Date of Joining
                                    </label>
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
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Reporting Authority / Manager
                                    </label>
                                    <Input
                                      placeholder="e.g. Operations & HR Team"
                                      value={reportingManager}
                                      onChange={(e) => handleFieldChange('reportingManager', e.target.value)}
                                      className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Work Location / Office Address
                                  </label>
                                  <Input
                                    placeholder="e.g. Hindustaan Innovations, Raipur, Chhattisgarh"
                                    value={workLocation}
                                    onChange={(e) => handleFieldChange('workLocation', e.target.value)}
                                    className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                  />
                                </div>
                              </>
                            )}

                            {/* 3. OFFER LETTER CATEGORY */}
                            {activeCategory === 'offer_letter' && (
                              <>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Designation / Role Title
                                  </label>
                                  <Input
                                    placeholder="e.g. Software Engineer"
                                    value={candidateRole}
                                    onChange={(e) => handleFieldChange('role', e.target.value)}
                                    className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Compensation / Annual CTC
                                    </label>
                                    <Input
                                      placeholder="e.g. ₹6,00,000 PA or ₹25,000/mo"
                                      value={stipend}
                                      onChange={(e) => handleFieldChange('stipend', e.target.value)}
                                      className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Commencement Date
                                    </label>
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
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Probation / Tenure Duration
                                    </label>
                                    <Input
                                      placeholder="e.g. 6 Months Probation"
                                      value={duration}
                                      onChange={(e) => handleFieldChange('duration', e.target.value)}
                                      className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Reporting Authority
                                    </label>
                                    <Input
                                      placeholder="e.g. Operations & HR Team"
                                      value={reportingManager}
                                      onChange={(e) => handleFieldChange('reportingManager', e.target.value)}
                                      className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Work Mode / Location
                                  </label>
                                  <Input
                                    placeholder="e.g. Raipur, Chhattisgarh (Hybrid)"
                                    value={workLocation}
                                    onChange={(e) => handleFieldChange('workLocation', e.target.value)}
                                    className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                  />
                                </div>
                              </>
                            )}

                            {/* 4. BLANK CANVAS / FALLBACK */}
                            {activeCategory !== 'interview' && activeCategory !== 'joining_letter' && activeCategory !== 'offer_letter' && (
                              <>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                    Role / Position Title (Optional)
                                  </label>
                                  <Input
                                    placeholder="e.g. Software Engineer"
                                    value={candidateRole}
                                    onChange={(e) => handleFieldChange('role', e.target.value)}
                                    className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Stipend / CTC (Optional)
                                    </label>
                                    <Input
                                      placeholder="e.g. ₹25,000/mo"
                                      value={stipend}
                                      onChange={(e) => handleFieldChange('stipend', e.target.value)}
                                      className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Start Date
                                    </label>
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
                                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                                      Duration (Optional)
                                    </label>
                                    <Input
                                      placeholder="e.g. 6 Months"
                                      value={duration}
                                      onChange={(e) => handleFieldChange('duration', e.target.value)}
                                      className="text-xs rounded-lg h-8 bg-slate-50 dark:bg-slate-800/60 font-medium"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">Communication Tone</label>
                      {tone && tone !== 'None / Standard' && (
                        <button
                          type="button"
                          disabled={isGeneratingAi}
                          onClick={() => handleToneClick(tone)}
                          className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-semibold flex items-center gap-0.5"
                          title="Deselect tone and undo change"
                        >
                          <Undo2 className="h-2.5 w-2.5" /> Deselect / Reset
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Formal & Professional', 'Warm & Welcoming', 'Direct & Concise', 'Performance Oriented', 'None / Standard'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          disabled={isGeneratingAi}
                          onClick={() => handleToneClick(t)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            tone === t
                              ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-orange-300'
                          }`}
                          title={tone === t ? 'Click to toggle off / undo tone' : `Click to apply ${t} tone`}
                        >
                          {tone === t && <Check className="h-3 w-3" />}
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Video Conference / Google Meet Card (Hidden when In-Person mode is selected) */}
                  {(!interviewMode.toLowerCase().includes('in person') && !interviewMode.toLowerCase().includes('offline')) && (
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
                )}

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
                      {/* 1. Google Meet Invitation Toggle (Add / Remove) */}
                      {isMeetingAttached ? (
                        <button
                          type="button"
                          disabled={isGeneratingAi}
                          onClick={handleRemoveMeeting}
                          className="text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 dark:hover:text-white px-2.5 py-1 rounded-lg border border-rose-500/30 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Click to remove Google Meet invitation from email"
                        >
                          <X className="h-3 w-3" /> ✓ Remove Google Meet
                        </button>
                      ) : (
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
                      )}

                      {/* 2. Undo AI Refinement Button */}
                      {draftHistory.length > 0 && (
                        <button
                          type="button"
                          disabled={isGeneratingAi}
                          onClick={handleUndoLastAiChange}
                          className="text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500 text-amber-700 hover:text-white dark:text-amber-300 dark:hover:text-slate-950 px-2.5 py-1 rounded-lg border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1 shadow-2xs animate-in fade-in"
                          title="Undo AI changes (reverts NDA clause, formality, tone, bullets)"
                        >
                          <Undo2 className="h-3 w-3" /> ↶ Undo AI Change {draftHistory.length > 1 ? `(${draftHistory.length})` : ''}
                        </button>
                      )}
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

            {/* Bottom Primary Dispatching Action */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950 shrink-0">
              <Button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending || isGeneratingAi}
                className="w-full h-11 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-lg text-xs gap-2 cursor-pointer"
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
                {/* Revert / Undo AI Refinement Button */}
                {draftHistory.length > 0 && (
                  <button
                    type="button"
                    disabled={isGeneratingAi}
                    onClick={handleUndoLastAiChange}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-300 dark:hover:text-slate-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs animate-in fade-in"
                    title="Undo AI changes (reverts NDA clause, formality, tone, bullets)"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    ↶ Undo AI Change {draftHistory.length > 1 ? `(${draftHistory.length})` : ''}
                  </button>
                )}

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
                      <p>
                        <strong className="text-slate-900 dark:text-slate-100 font-bold">From:</strong>{' '}
                        <span className="text-slate-800 dark:text-slate-200">
                          {smtpSenderName || 'Hindustaan Innovations HR'} &lt;{smtpSenderEmail || smtpUserEmail || 'hr@hindustaan.com'}&gt;
                        </span>
                      </p>
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
      </DialogContent>
    </Dialog>

    {/* Create / Save Preset Template Modal */}
    <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[110]">
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
            <CategoryDropdown
              value={newTemplateCategory}
              onChange={setNewTemplateCategory}
            />
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

    {/* Edit Pre-Existing Template Dialog */}
    <Dialog
      open={isEditTemplateOpen}
      onOpenChange={(open) => {
        setIsEditTemplateOpen(open);
        if (!open && returnToManageRef.current) {
          setIsManageTemplatesOpen(true);
          returnToManageRef.current = false;
        }
      }}
    >
      <DialogContent className="sm:max-w-[680px] p-6 rounded-2xl max-h-[90vh] flex flex-col overflow-hidden z-[140]">
        <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-orange-500" /> Edit Template: {editTemplateName || 'Official Template'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Rename, modify category, edit default subject line, adjust template structure, or delete/remove this template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-3 overflow-y-auto flex-1 pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Template Name (Rename)
              </label>
              <Input
                placeholder="e.g. Candidate Shortlist & Interview Invitation"
                value={editTemplateName}
                onChange={(e) => setEditTemplateName(e.target.value)}
                className="text-xs rounded-xl h-9"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Category
              </label>
              <CategoryDropdown
                value={editTemplateCategory}
                onChange={setEditTemplateCategory}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Default Subject Line Template
            </label>
            <Input
              value={editTemplateSubject}
              onChange={(e) => setEditTemplateSubject(e.target.value)}
              className="text-xs rounded-xl h-9 font-semibold"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Template Body (HTML / Letterhead)
              </label>
              <span className="text-[10px] text-slate-400">Supports standard HTML & dynamic tags</span>
            </div>
            <Textarea
              value={editTemplateHtmlBody}
              onChange={(e) => setEditTemplateHtmlBody(e.target.value)}
              className="text-xs font-mono rounded-xl min-h-[220px] bg-slate-900 text-slate-100 p-3 leading-relaxed border-slate-700"
            />
          </div>

          {/* Variable Quick Reference */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Insert Dynamic Variable Tags:</span>
            <div className="flex flex-wrap gap-1 font-mono text-[10px]">
              {[
                '{{candidateName}}',
                '{{employeeName}}',
                '{{role}}',
                '{{referenceId}}',
                '{{currentDate}}',
                '{{interviewDate}}',
                '{{interviewTime}}',
                '{{interviewMode}}',
                '{{interviewLocation}}',
                '{{interviewTopics}}',
                '{{interviewTools}}',
                '{{startDate}}',
                '{{reviewDate}}',
                '{{stipend}}',
                '{{annualCTC}}',
                '{{duration}}',
                '{{workLocation}}',
                '{{reportingManager}}'
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setEditTemplateHtmlBody((prev) => prev + tag)}
                  className="bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300 hover:bg-orange-500/20 hover:text-orange-500 cursor-pointer transition-colors"
                  title="Click to append to template body"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => handlePromptDeleteTemplate(editTemplateId)}
            disabled={isDeletingTemplate}
            className="text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer"
            title="Permanently remove this template"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete Template
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditTemplateOpen(false);
                if (returnToManageRef.current) {
                  setIsManageTemplatesOpen(true);
                  returnToManageRef.current = false;
                }
              }}
              className="text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveEditedTemplate}
              disabled={isUpdatingTemplate || !editTemplateName.trim()}
              className="text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white gap-1.5 cursor-pointer"
            >
              {isUpdatingTemplate ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving Changes...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Quick Rename Template Modal */}
    <Dialog
      open={isQuickRenameOpen}
      onOpenChange={(open) => {
        setIsQuickRenameOpen(open);
        if (!open && returnToManageRef.current) {
          setIsManageTemplatesOpen(true);
          returnToManageRef.current = false;
        }
      }}
    >
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[140]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-orange-500" /> Rename Template
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Update the official display name for this template preset in the workspace.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveQuickRename();
          }}
          className="space-y-4 py-2"
        >
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Template Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={renameTemplateName}
              onChange={(e) => setRenameTemplateName(e.target.value)}
              placeholder="e.g. Senior Software Engineer Offer Letter"
              className="text-xs rounded-xl h-9 font-semibold"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsQuickRenameOpen(false);
                if (returnToManageRef.current) {
                  setIsManageTemplatesOpen(true);
                  returnToManageRef.current = false;
                }
              }}
              className="text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isRenamingTemplate || !renameTemplateName.trim()}
              className="text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white gap-1.5 cursor-pointer shadow-sm"
            >
              {isRenamingTemplate ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Renaming...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Save New Name
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Modal */}
    <Dialog
      open={isDeleteConfirmOpen}
      onOpenChange={(open) => {
        setIsDeleteConfirmOpen(open);
        if (!open && returnToManageRef.current) {
          setIsManageTemplatesOpen(true);
          returnToManageRef.current = false;
        }
      }}
    >
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#0B1120] border-rose-200 dark:border-rose-950/60 rounded-2xl shadow-2xl z-[150]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-500" /> Delete Template Preset?
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
            Are you sure you want to permanently delete template <strong className="text-slate-900 dark:text-white">&quot;{deleteTargetTemplate?.name}&quot;</strong>? This template preset will be removed from workspace presets and cannot be recovered.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsDeleteConfirmOpen(false);
              setDeleteTargetTemplate(null);
              if (returnToManageRef.current) {
                setIsManageTemplatesOpen(true);
                returnToManageRef.current = false;
              }
            }}
            className="text-xs font-bold rounded-xl cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmDeleteTemplate}
            disabled={isDeletingTemplate}
            className="text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-1.5 cursor-pointer shadow-sm"
          >
            {isDeletingTemplate ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" /> Permanently Delete
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Manage Workspace Templates Modal */}
    <Dialog open={isManageTemplatesOpen} onOpenChange={setIsManageTemplatesOpen}>
      <DialogContent className="sm:max-w-[700px] p-6 rounded-2xl max-h-[85vh] flex flex-col overflow-hidden bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 z-[115]">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-500" /> Manage Official Template Presets
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Rename, edit, or delete any preset email template in your workspace.
              </DialogDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setIsManageTemplatesOpen(false);
                setIsCreateTemplateOpen(true);
              }}
              className="text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white gap-1 cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" /> + New Template
            </Button>
          </div>
        </DialogHeader>

        <div className="py-3 flex-1 overflow-y-auto space-y-2 pr-1">
          {templates.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No custom templates saved yet. Click &quot;+ New Template&quot; to create one.
            </div>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3 hover:border-orange-300 dark:hover:border-orange-500/30 transition-all"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                      {t.name}
                    </span>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 px-1.5 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30 shrink-0">
                      {(() => {
                        const catObj = TEMPLATE_CATEGORIES.find((c) => c.value === t.category);
                        return catObj ? catObj.label : t.category;
                      })()}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Subject: {t.subject}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      handleTemplateChange(t.id);
                      setIsManageTemplatesOpen(false);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors cursor-pointer shadow-2xs"
                    title="Load and use this template right now"
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      returnToManageRef.current = true;
                      setIsManageTemplatesOpen(false);
                      handleOpenQuickRename(t.id);
                    }}
                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Rename template"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      returnToManageRef.current = true;
                      setIsManageTemplatesOpen(false);
                      setSelectedTemplateId(t.id);
                      setEditTemplateId(t.id);
                      setEditTemplateName(t.name);
                      setEditTemplateCategory(t.category);
                      setEditTemplateSubject(t.subject);
                      setEditTemplateHtmlBody(t.htmlBody);
                      setIsEditTemplateOpen(true);
                    }}
                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Full layout & HTML editor"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      returnToManageRef.current = true;
                      setIsManageTemplatesOpen(false);
                      handlePromptDeleteTemplate(t.id);
                    }}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsManageTemplatesOpen(false)}
            className="text-xs font-bold rounded-xl cursor-pointer"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Dynamic AES-256-GCM Encrypted SMTP Configuration Modal */}
    <Dialog open={isSmtpConfigOpen} onOpenChange={setIsSmtpConfigOpen}>
      <DialogContent className="max-w-md p-6 bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[110]">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Gmail SMTP Configuration
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Secured with AES-256-GCM and synced across all your computers automatically.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* 1. Gmail Address */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Gmail Address <span className="text-rose-500">*</span>
            </label>
            <Input
              placeholder="e.g. hr@company.com or yourname@gmail.com"
              value={smtpUserEmail}
              onChange={(e) => {
                setSmtpUserEmail(e.target.value);
                setSmtpSenderEmail(e.target.value);
              }}
              className="text-xs rounded-xl h-9.5 font-medium"
            />
          </div>

          {/* 2. Gmail App Password (16 chars) */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
              <span>Gmail App Password (16 chars) <span className="text-rose-500">*</span></span>
              {hasConfiguredSmtp && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                  <Check className="h-3 w-3" /> Saved & Active in DB
                </span>
              )}
            </label>
            <div className="relative">
              <Input
                type={showSmtpPassword ? 'text' : 'password'}
                placeholder={hasConfiguredSmtp ? '•••••••••••••••• (Saved in DB - leave blank to keep)' : '16-character Google App Password'}
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                className="text-xs rounded-xl h-9.5 font-medium pr-8 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Leave blank to keep current saved password from the database.
            </span>
          </div>

          {/* 3. Sender Display Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Sender Display Name
            </label>
            <Input
              placeholder="e.g. Suyash ML & GEN AI or Hindustaan Innovations HR"
              value={smtpSenderName}
              onChange={(e) => setSmtpSenderName(e.target.value)}
              className="text-xs rounded-xl h-9.5 font-medium"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Recipients will see: <strong className="text-slate-600 dark:text-slate-300">{smtpSenderName || 'Your Name'} &lt;{smtpUserEmail || 'your-email@gmail.com'}&gt;</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestSmtp}
            disabled={isTestingSmtp || (!smtpHost.trim() && !hasConfiguredSmtp) || (!smtpUserEmail.trim() && !hasConfiguredSmtp)}
            className="text-xs font-bold rounded-xl gap-1.5 cursor-pointer"
          >
            {isTestingSmtp ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-orange-500" /> Testing...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Test Connection
              </>
            )}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSmtpConfigOpen(false)}
              className="text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveSmtp}
              disabled={isSavingSmtp || (!smtpHost.trim() && !hasConfiguredSmtp) || (!smtpUserEmail.trim() && !hasConfiguredSmtp)}
              className="text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white gap-1.5 cursor-pointer shadow-sm"
            >
              {isSavingSmtp ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" /> Save Configuration
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
);
}
