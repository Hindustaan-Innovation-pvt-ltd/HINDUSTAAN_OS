import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Phone,
  MessageSquare,
  Search,
  Building,
  ExternalLink,
  Target,
  Clock,
  Sparkles,
  MapPin,
  Loader2,
  FileText,
  PhoneCall,
  CheckCircle2,
  Globe,
  Printer,
  Download,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Lead, LeadCallStatus } from '../types/lead.types';
import { LeadDossierModal } from '../components/LeadDossierModal';
import { exportLeadsToPDF } from '../utils/leadPdfExport';

const STATUS_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All My Leads' },
  { id: 'not_called', label: 'Pending Call' },
  { id: 'called_connected', label: 'Connected' },
  { id: 'meeting_scheduled', label: 'Meetings' },
  { id: 'follow_up', label: 'Follow Up' },
  { id: 'converted', label: 'Won Deals' },
];

export default function MyAssignedLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedLeadForDossier, setSelectedLeadForDossier] = useState<Lead | null>(null);
  const [dossierOpen, setDossierOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchMyLeads();
  }, [search, activeTab]);

  const fetchMyLeads = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (activeTab !== 'all') params.callStatus = activeTab;

      const res = await api.get('/leads/my-assigned', { params });
      if (res.data?.success) {
        setLeads(res.data.data || []);
      }
    } catch (err: any) {
      console.error('Failed to load my leads:', err);
      toast.error('Failed to fetch assigned leads');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDossier = (lead: Lead) => {
    setSelectedLeadForDossier(lead);
    setDossierOpen(true);
  };

  const handleLeadUpdated = (updatedLead: Lead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l))
    );
  };

  const pendingCallsCount = leads.filter((l) => l.callStatus === 'not_called').length;
  const meetingsCount = leads.filter((l) => l.callStatus === 'meeting_scheduled').length;

  const handleExportPDF = (mode: 'print' | 'download' = 'print') => {
    if (leads.length === 0) {
      toast.error('No assigned leads to export or print.');
      return;
    }

    const filterParts: string[] = [];
    if (activeTab !== 'all') {
      const t = STATUS_TABS.find((st) => st.id === activeTab);
      if (t) filterParts.push(`Status: ${t.label}`);
    }
    if (search.trim()) filterParts.push(`Search: "${search.trim()}"`);

    const res = exportLeadsToPDF({
      leads,
      title: 'My Assigned Commercial Leads',
      subtitle: `Assigned Outreach List • Total: ${leads.length} leads`,
      filterDescription: filterParts.length > 0 ? filterParts.join(' | ') : undefined,
      mode,
      filename: `my_assigned_leads_${new Date().toISOString().slice(0, 10)}.pdf`,
    });

    if (res.success) {
      if (res.message) toast.success(res.message);
    } else {
      toast.error(res.message || 'Failed to generate PDF');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                My Assigned Leads
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Leads assigned to you by your manager. Review decision-maker dossiers and log your calls.
              </p>
            </div>
          </div>
        </div>

        {/* Quick stats pills & Print Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Total Assigned:</span>
            <span className="font-bold text-foreground">{leads.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs">
            <span className="text-amber-600 dark:text-amber-400 font-medium">Pending Call:</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{pendingCallsCount}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Meetings:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{meetingsCount}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs border-primary/40 hover:bg-primary/5 text-foreground font-medium shadow-2xs h-8"
              >
                <Printer className="w-3.5 h-3.5 text-primary" />
                Print / PDF
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border shadow-lg">
              <DropdownMenuItem
                onClick={() => handleExportPDF('print')}
                className="gap-2.5 text-xs py-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Print Leads (PDF)</p>
                  <p className="text-[10px] text-muted-foreground">Opens print preview dialog</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExportPDF('download')}
                className="gap-2.5 text-xs py-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Download PDF Report</p>
                  <p className="text-[10px] text-muted-foreground">Saves landscape A4 file</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Container */}
      <Card className="border-border/60 bg-card shadow-sm">
        {/* Status Tabs */}
        <div className="p-4 border-b border-border/60 flex items-center justify-between gap-4 flex-wrap bg-muted/20">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background hover:bg-muted text-muted-foreground border border-border/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies or contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>

        {/* Lead Cards Grid */}
        <CardContent className="p-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Loading your assigned leads...</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Building className="w-8 h-8 opacity-40" />
              <p className="font-semibold text-sm">No leads assigned yet</p>
              <p className="text-xs">Your manager will assign client leads to your queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leads.map((lead) => {
                const whatsAppPhone = (lead.whatsappNumber || lead.primaryPhone || '').replace(/[^0-9]/g, '');
                const whatsAppMessage = encodeURIComponent(
                  `Hello ${lead.authorizedPersonName || 'Sir/Madam'}, I'm reaching out from Hindustaan regarding custom software & AI automation solutions for ${lead.companyName}.`
                );

                return (
                  <Card
                    key={lead.id}
                    className="border-border/70 bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <CardHeader className="p-4 pb-2 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm text-foreground">{lead.companyName}</h3>
                            {/* Google Business Profile button */}
                            <a
                              href={lead.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.companyName + ' ' + (lead.city || ''))}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:text-blue-600 transition-colors inline-flex items-center"
                              title="Open Google Business Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            {/* Website indicator */}
                            {lead.websiteUrl ? (
                              <a
                                href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline flex items-center gap-0.5 text-[10px] font-normal"
                                title="Visit Official Website"
                              >
                                <Globe className="w-3 h-3 text-emerald-500" />
                              </a>
                            ) : (
                              <span className="text-[9px] font-semibold px-1 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                No Website
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            {lead.industrySector && <span>{lead.industrySector}</span>}
                            {lead.city && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />
                                  {lead.city}
                                </span>
                              </>
                            )}
                          </p>
                        </div>

                        <Badge
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 ${
                            lead.callStatus === 'called_connected'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                              : lead.callStatus === 'meeting_scheduled'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : lead.callStatus === 'converted'
                              ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30'
                              : lead.callStatus === 'follow_up'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {lead.callStatus.replace('_', ' ')}
                        </Badge>
                      </div>

                      {/* Decision Maker */}
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                        <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold uppercase tracking-wider">
                          <Target className="w-3 h-3" />
                          <span>Contact Person</span>
                        </div>
                        <p className="font-semibold text-xs text-foreground mt-0.5">
                          {lead.authorizedPersonName || 'Executive Director / Owner'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {lead.authorizedPersonRole || 'Managing Director'}
                        </p>
                      </div>

                      {/* Instructions if any */}
                      {lead.assignmentNotes && (
                        <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                          <strong>Manager Note:</strong> {lead.assignmentNotes}
                        </div>
                      )}
                    </CardHeader>

                    <CardContent className="p-4 pt-2 border-t border-border/40 mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {lead.primaryPhone && (
                          <a
                            href={`tel:${lead.primaryPhone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary text-primary-foreground text-xs font-semibold shadow hover:opacity-90 transition-opacity"
                          >
                            <Phone className="w-3 h-3" />
                            Call
                          </a>
                        )}

                        {whatsAppPhone && (
                          <a
                            href={`https://wa.me/${whatsAppPhone}?text=${whatsAppMessage}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold shadow hover:bg-emerald-700 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            WhatsApp
                          </a>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDossier(lead)}
                        className="h-8 text-xs gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Dossier & Notes
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calling Dossier Dialog */}
      <LeadDossierModal
        open={dossierOpen}
        onOpenChange={setDossierOpen}
        lead={selectedLeadForDossier}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  );
}
