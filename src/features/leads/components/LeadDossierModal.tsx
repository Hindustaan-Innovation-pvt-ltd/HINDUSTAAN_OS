import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Phone,
  Mail,
  MessageSquare,
  Globe,
  Building2,
  MapPin,
  ExternalLink,
  Target,
  Sparkles,
  CheckCircle2,
  Clock,
  UserCheck,
  Save,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Lead, LeadCallStatus } from '../types/lead.types';

interface LeadDossierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

const CALL_STATUS_OPTIONS: { label: string; value: LeadCallStatus; color: string }[] = [
  { label: 'Not Called', value: 'not_called', color: 'bg-muted text-muted-foreground' },
  { label: 'Called & Connected', value: 'called_connected', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30' },
  { label: 'Meeting Scheduled', value: 'meeting_scheduled', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  { label: 'Follow Up Needed', value: 'follow_up', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  { label: 'Deal Won / Converted', value: 'converted', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30' },
  { label: 'Not Interested', value: 'not_interested', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' },
];

const QUICK_TAGS = [
  'Spoke with Director',
  'Interested in AI Automation',
  'Requested Proposal',
  'Call back tomorrow',
  'Left Voicemail / Not Answered',
  'Has existing ERP / exploring upgrade',
];

export const LeadDossierModal: React.FC<LeadDossierModalProps> = ({
  open,
  onOpenChange,
  lead,
  onLeadUpdated,
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LeadCallStatus>('not_called');
  const [savingNotes, setSavingNotes] = useState(false);

  React.useEffect(() => {
    if (lead) {
      setNotesDraft(lead.callNotes || '');
      setSelectedStatus(lead.callStatus || 'not_called');
    }
  }, [lead]);

  if (!lead) return null;

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    toast.success('Phone number copied to clipboard');
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSaveCallStatus = async () => {
    try {
      setSavingNotes(true);
      const res = await api.patch(`/leads/${lead.id}/status`, {
        callStatus: selectedStatus,
        callNotes: notesDraft.trim(),
      });

      if (res.data?.success) {
        toast.success('Call notes and status saved!');
        if (onLeadUpdated) {
          onLeadUpdated(res.data.data);
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (err: any) {
      console.error('Error saving status:', err);
      toast.error(err.response?.data?.message || 'Error updating lead status');
    } finally {
      setSavingNotes(false);
    }
  };

  const whatsAppPhone = (lead.whatsappNumber || lead.primaryPhone || '').replace(/[^0-9]/g, '');
  const whatsAppMessage = encodeURIComponent(
    `Hello ${lead.authorizedPersonName || 'Sir/Madam'}, I'm reaching out from Hindustaan regarding digital technology & software solutions for ${lead.companyName}. Would you be open for a brief 5-minute discovery call this week?`
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border shadow-2xl p-0">
        {/* Header Banner */}
        <div className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">{lead.companyName}</h2>
                <a
                  href={lead.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.companyName + ' ' + (lead.city || ''))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-xs font-medium bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20"
                  title="Open Google Business Profile"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Google Profile
                </a>
                {lead.websiteUrl ? (
                  <a
                    href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-xs font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                    title="Open Official Website"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    Website
                  </a>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                    No Website (Pure Offline Business)
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {lead.industrySector && (
                  <Badge variant="secondary" className="text-xs">
                    {lead.industrySector}
                  </Badge>
                )}
                {lead.city && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {lead.city}
                  </span>
                )}
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-mono">
                  Priority Score: {Math.round(lead.leadScore || 0)}/100
                </Badge>
              </div>
            </div>

            {/* Assigned Tracking Pill */}
            {lead.assignedTo ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <Avatar className="w-5 h-5 border">
                  <AvatarImage src={lead.assignedTo.avatarUrl || undefined} />
                  <AvatarFallback className="text-[9px]">
                    {lead.assignedTo.name?.slice(0, 2).toUpperCase() || 'EM'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {lead.assignedTo.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Assigned Rep</p>
                </div>
              </div>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-500/40">
                Unassigned
              </Badge>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Decision Maker Card */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              Target Decision Maker
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-foreground">
                  {lead.authorizedPersonName || 'Senior Executive / Business Owner'}
                </h4>
                <p className="text-xs text-muted-foreground font-medium">
                  {lead.authorizedPersonRole || 'Director / Managing Partner'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {lead.primaryPhone && (
                  <>
                    <a
                      href={`tel:${lead.primaryPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow hover:opacity-90 transition-opacity"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Dial {lead.primaryPhone}
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyPhone(lead.primaryPhone!)}
                      className="h-8 px-2"
                    >
                      {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </>
                )}

                {whatsAppPhone && (
                  <a
                    href={`https://wa.me/${whatsAppPhone}?text=${whatsAppMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow hover:bg-emerald-700 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                )}

                {lead.primaryEmail && (
                  <a
                    href={`mailto:${lead.primaryEmail}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium border border-border hover:bg-muted/80 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* AI Talking Points & Recommended Pitch */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4" />
                Recommended Solution to Pitch
              </h4>
              <p className="text-xs text-foreground leading-relaxed">
                {lead.recommendedSolution ||
                  lead.clientNeeds?.recommended_solution ||
                  'Custom ERP / CRM workflow automation, WhatsApp commerce integration, and AI-enabled client self-service portal tailored to their business sector.'}
              </p>
            </div>

            {/* Pain points */}
            {lead.clientNeeds?.pain_points && lead.clientNeeds.pain_points.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Identified Gaps & Pain Points
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lead.clientNeeds.pain_points.map((point: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-muted/30 border border-border/60 text-xs flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Call Logging & Status Update */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" />
              Log Call Outcome & Remarks
            </h4>

            {/* Status Selector */}
            <div className="flex items-center gap-2 flex-wrap">
              {CALL_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    selectedStatus === opt.value
                      ? `${opt.color} ring-2 ring-primary/40 shadow-sm font-bold`
                      : 'bg-background hover:bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Quick remark chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-muted-foreground font-semibold uppercase">Add tag:</span>
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() =>
                    setNotesDraft((prev) => (prev ? `${prev} | ${tag}` : tag))
                  }
                  className="px-2 py-0.5 rounded text-[10px] bg-muted hover:bg-muted/80 text-foreground border border-border/60 transition-colors"
                >
                  + {tag}
                </button>
              ))}
            </div>

            {/* Notes textarea */}
            <Textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Record calling notes, client feedback, scheduled demo date, or objections..."
              rows={3}
              className="resize-none text-xs bg-background"
            />

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSaveCallStatus}
                disabled={savingNotes}
                className="gap-2 font-semibold shadow"
              >
                {savingNotes ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Call Log
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
