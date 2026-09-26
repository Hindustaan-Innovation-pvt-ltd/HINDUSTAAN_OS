import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Sparkles,
  Phone,
  PhoneCall,
  UserCheck,
  ArrowRightLeft,
  Download,
  ExternalLink,
  MessageSquare,
  FileText,
  Loader2,
  RefreshCw,
  Building,
  MoreVertical,
  CheckCircle2,
  Clock,
  MapPin,
  Globe,
  History,
  Layers,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Lead, LeadStatsOverview, LeadCallStatus, ScanBatchOption } from '../types/lead.types';
import { LeadTrackingStats } from '../components/LeadTrackingStats';
import { AssignLeadDialog } from '../components/AssignLeadDialog';
import { LeadDossierModal } from '../components/LeadDossierModal';
import { TriggerScanModal } from '../components/TriggerScanModal';
import { ScanLogsModal } from '../components/ScanLogsModal';
import { getEffectiveLocation } from '../utils/locationEngine';

const STATUS_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Leads' },
  { id: 'not_called', label: 'Pending Call' },
  { id: 'called_connected', label: 'Connected' },
  { id: 'meeting_scheduled', label: 'Meetings' },
  { id: 'follow_up', label: 'Follow Up' },
  { id: 'converted', label: 'Won Deals' },
];

export default function LeadsDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scanBatches, setScanBatches] = useState<ScanBatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [groupByBatch, setGroupByBatch] = useState<boolean>(true);
  const [collapsedBatches, setCollapsedBatches] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<LeadStatsOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [hasPhoneOnly, setHasPhoneOnly] = useState<boolean>(false);

  // Modals
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<Lead | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState<boolean>(false);
  const [selectedLeadForDossier, setSelectedLeadForDossier] = useState<Lead | null>(null);
  const [dossierOpen, setDossierOpen] = useState<boolean>(false);
  const [scanModalOpen, setScanModalOpen] = useState<boolean>(false);
  const [scanLogsOpen, setScanLogsOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [search, activeTab, employeeFilter, industryFilter, hasPhoneOnly]);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.get('/leads/stats/overview');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load lead stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchLeads = async (overrides?: {
    search?: string;
    activeTab?: string;
    employeeFilter?: string;
    industryFilter?: string;
    hasPhoneOnly?: boolean;
  }) => {
    try {
      setLoading(true);
      const activeSearch = overrides?.search !== undefined ? overrides.search : search;
      const activeStatus = overrides?.activeTab !== undefined ? overrides.activeTab : activeTab;
      const activeEmp = overrides?.employeeFilter !== undefined ? overrides.employeeFilter : employeeFilter;
      const activeInd = overrides?.industryFilter !== undefined ? overrides.industryFilter : industryFilter;
      const activePhone = overrides?.hasPhoneOnly !== undefined ? overrides.hasPhoneOnly : hasPhoneOnly;

      const params: any = {};
      if (activeSearch.trim()) params.search = activeSearch.trim();
      if (activeStatus !== 'all') params.callStatus = activeStatus;
      if (activeEmp) params.assignedToId = activeEmp;
      if (activeInd !== 'all') params.industry = activeInd;
      if (activePhone) params.hasPhone = 'true';

      const res = await api.get('/leads', { params });
      if (res.data?.success) {
        setLeads(res.data.data || []);
        if (Array.isArray(res.data.scanBatches)) {
          setScanBatches(res.data.scanBatches);
        }
      }
    } catch (err: any) {
      console.error('Failed to load leads:', err);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  // Batches computed from leads
  const availableBatches = React.useMemo(() => {
    const map = new Map<string, {
      id: string;
      query: string;
      createdAt: string;
      count: number;
      shortTitle: string;
      formattedDate: string;
    }>();

    leads.forEach((l) => {
      const bId = l.scanBatch?.id || 'initial';
      const bQuery = l.scanBatch?.query || 'Direct / CRM Seed Leads';
      const bDate = l.scanBatch?.createdAt || l.createdAt || '';

      if (!map.has(bId)) {
        const d = bDate ? new Date(bDate) : new Date();
        const formattedDate = d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
        });

        let shortTitle = bQuery
          .replace(/ in .*$/i, '')
          .replace(/ -directory.*$/i, '')
          .trim();
        if (shortTitle.length > 25) {
          shortTitle = shortTitle.slice(0, 23) + '...';
        }

        map.set(bId, {
          id: bId,
          query: bQuery,
          createdAt: bDate,
          count: 0,
          shortTitle: shortTitle || 'Scan Run',
          formattedDate,
        });
      }
      map.get(bId)!.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => {
      const tA = new Date(a.createdAt).getTime() || 0;
      const tB = new Date(b.createdAt).getTime() || 0;
      return tB - tA;
    });
  }, [leads]);

  const filteredLeads = React.useMemo(() => {
    return leads.filter((l) => {
      if (selectedBatchId !== 'all') {
        const bId = l.scanBatch?.id || 'initial';
        if (bId !== selectedBatchId) return false;
      }
      return true;
    });
  }, [leads, selectedBatchId]);

  const groupedLeads = React.useMemo(() => {
    const batchMap = new Map<string, {
      batch: {
        id: string;
        query: string;
        sector?: string | null;
        city?: string | null;
        state?: string | null;
        createdAt: string;
        shortTitle: string;
        formattedDate: string;
      };
      leads: Lead[];
    }>();

    filteredLeads.forEach((lead) => {
      const bId = lead.scanBatch?.id || 'initial';
      const bQuery = lead.scanBatch?.query || 'Direct / CRM Seed Leads';
      const bDate = lead.scanBatch?.createdAt || lead.createdAt || '';

      if (!batchMap.has(bId)) {
        const d = bDate ? new Date(bDate) : new Date();
        const formattedDate = d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        let shortTitle = bQuery
          .replace(/ in .*$/i, '')
          .replace(/ -directory.*$/i, '')
          .trim();
        if (shortTitle.length > 36) {
          shortTitle = shortTitle.slice(0, 34) + '...';
        }

        batchMap.set(bId, {
          batch: {
            id: bId,
            query: bQuery,
            sector: lead.scanBatch?.sector || lead.industrySector || '',
            city: lead.scanBatch?.city || lead.city || '',
            state: lead.scanBatch?.state || '',
            createdAt: bDate,
            shortTitle: shortTitle || 'Scan Run',
            formattedDate,
          },
          leads: [],
        });
      }
      batchMap.get(bId)!.leads.push(lead);
    });

    return Array.from(batchMap.values()).sort((a, b) => {
      const tA = new Date(a.batch.createdAt).getTime() || 0;
      const tB = new Date(b.batch.createdAt).getTime() || 0;
      return tB - tA;
    });
  }, [filteredLeads]);

  const toggleBatchCollapse = (batchId: string) => {
    setCollapsedBatches((prev) => ({
      ...prev,
      [batchId]: !prev[batchId],
    }));
  };

  const handleOpenAssign = (lead: Lead) => {
    setSelectedLeadForAssign(lead);
    setAssignDialogOpen(true);
  };

  const handleOpenDossier = (lead: Lead) => {
    setSelectedLeadForDossier(lead);
    setDossierOpen(true);
  };

  const handleLeadUpdated = (updatedLead: Lead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? { ...l, ...updatedLead } : l))
    );
    fetchStats();
  };

  const exportCSV = () => {
    const targetLeads = filteredLeads.length > 0 ? filteredLeads : leads;
    if (targetLeads.length === 0) {
      toast.error('No leads to export');
      return;
    }
    const headers = [
      'Generation Batch',
      'Company Name',
      'Website',
      'Industry',
      'Target Contact',
      'Role',
      'Phone',
      'Email',
      'City',
      'Lead Score',
      'Assigned Employee',
      'Call Status',
      'Call Notes',
    ];
    const rows = targetLeads.map((l) => [
      `"${(l.scanBatch?.query || 'Direct / CRM').replace(/"/g, '""')}"`,
      `"${l.companyName || ''}"`,
      `"${l.websiteUrl || ''}"`,
      `"${l.industrySector || ''}"`,
      `"${l.authorizedPersonName || ''}"`,
      `"${l.authorizedPersonRole || ''}"`,
      `"${l.primaryPhone || ''}"`,
      `"${l.primaryEmail || ''}"`,
      `"${l.city || ''}"`,
      l.leadScore || 0,
      `"${l.assignedTo?.name || 'Unassigned'}"`,
      `"${l.callStatus || 'not_called'}"`,
      `"${(l.callNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hindustaan_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Leads exported as CSV');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AI Client Analysis & Lead Intelligence
            </h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
              Manager / Admin Hub
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Automated commercial lead discovery, decision-maker dossiers, and employee outreach tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="gap-2 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats();
              fetchLeads();
            }}
            className="gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setScanLogsOpen(true)}
            className="gap-2 text-xs border-primary/40 hover:bg-primary/5 text-foreground font-medium"
          >
            <History className="w-3.5 h-3.5 text-primary" />
            Scan Logs & Audits
          </Button>

          <Button
            size="sm"
            onClick={() => setScanModalOpen(true)}
            className="gap-2 text-xs font-semibold shadow bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Discover Leads by Location
          </Button>
        </div>
      </div>

      {/* KPI Tracking Stats & Employee Filter Bar */}
      <LeadTrackingStats
        stats={stats}
        loading={loadingStats}
        onFilterEmployee={(empId) => setEmployeeFilter(empId)}
        selectedEmployeeFilter={employeeFilter}
      />

      {/* Main Leads Card */}
      <Card className="border-border/60 shadow-sm bg-card">
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

          <div className="flex items-center gap-2">
            <Button
              variant={hasPhoneOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHasPhoneOnly(!hasPhoneOnly)}
              className="text-xs gap-1.5 h-8"
            >
              <Phone className="w-3.5 h-3.5" />
              Direct Phone Only
            </Button>
          </div>
        </div>

        {/* Lead Generation Requests / Discovery Batches Bar ("Jab Jab Leads Generate Kiye") */}
        <div className="px-4 py-2 border-b border-border/60 flex items-center justify-between gap-3 bg-muted/20 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar flex-1 pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5 shrink-0 uppercase tracking-wider mr-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Generation Batches:
            </span>

            <button
              onClick={() => setSelectedBatchId('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                selectedBatchId === 'all'
                  ? 'bg-primary text-primary-foreground shadow-2xs font-bold'
                  : 'bg-background hover:bg-muted text-muted-foreground border border-border/60'
              }`}
            >
              <span>All Scans</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedBatchId === 'all'
                    ? 'bg-primary-foreground/20 text-primary-foreground font-bold'
                    : 'bg-muted text-foreground'
                }`}
              >
                {leads.length}
              </span>
            </button>

            {availableBatches.map((b) => {
              const isSelected = selectedBatchId === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatchId(b.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-all flex items-center gap-1.5 shrink-0 max-w-[280px] ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-2xs font-semibold'
                      : 'bg-background hover:bg-muted text-muted-foreground border border-border/60 font-medium'
                  }`}
                  title={b.query}
                >
                  <span className="truncate">{b.shortTitle}</span>
                  <span className="text-[10px] opacity-75 font-mono">({b.formattedDate})</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {b.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant={groupByBatch ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGroupByBatch(!groupByBatch)}
              className="text-xs h-7 gap-1.5 px-2.5 font-medium"
            >
              <Layers className="w-3.5 h-3.5" />
              {groupByBatch ? 'Grouped by Batch' : 'Flat List'}
            </Button>
          </div>
        </div>

        {/* Search & Industry Filter */}
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search companies, decision makers, cities, or domains..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Industry Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="Steel & Heavy Manufacturing">Steel & Heavy Manufacturing</SelectItem>
                <SelectItem value="Solar & Renewable Energy">Solar & Renewable</SelectItem>
                <SelectItem value="Healthcare & Hospitals">Healthcare</SelectItem>
                <SelectItem value="Mining & Minerals">Mining & Minerals</SelectItem>
                <SelectItem value="IT & Tech Services">IT & Tech</SelectItem>
                <SelectItem value="Education & Universities">Education</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Leads Table Content */}
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Loading commercial leads...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Building className="w-8 h-8 opacity-40" />
              <p className="font-semibold text-sm">No commercial leads found</p>
              <p className="text-xs">Try adjusting your filters or click "Discover Leads by Location" to run a scan.</p>
            </div>
          ) : groupByBatch && selectedBatchId === 'all' ? (
            /* GROUPED BY BATCH VIEW */
            <div className="divide-y divide-border/60">
              {groupedLeads.map((group) => {
                const isCollapsed = Boolean(collapsedBatches[group.batch.id]);
                return (
                  <div key={group.batch.id} className="border-b border-border/40 last:border-b-0">
                    {/* Batch Header Bar */}
                    <div
                      onClick={() => toggleBatchCollapse(group.batch.id)}
                      className="px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors flex items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap flex-1">
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        </div>

                        <div>
                          <div className="font-bold text-xs text-foreground flex items-center gap-2 flex-wrap">
                            <span>{group.batch.query}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-background text-foreground/80 border-border/60">
                              {group.leads.length} {group.leads.length === 1 ? 'Lead' : 'Leads'}
                            </Badge>
                          </div>

                          <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              {group.batch.formattedDate}
                            </span>
                            {group.batch.city && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-primary" />
                                  {group.batch.city}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground"
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Batch Leads Table */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/20 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/40">
                            <tr>
                              <th className="py-2.5 px-4">Company & Location</th>
                              <th className="py-2.5 px-4">Decision Maker</th>
                              <th className="py-2.5 px-4">Phone / WhatsApp</th>
                              <th className="py-2.5 px-4">Score</th>
                              <th className="py-2.5 px-4">Assigned To</th>
                              <th className="py-2.5 px-4">Call Status</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {group.leads.map((lead) => {
                              const effectiveLoc = getEffectiveLocation(lead);
                              return (
                                <tr
                                  key={lead.id}
                                  className="hover:bg-muted/30 transition-colors group cursor-pointer"
                                  onClick={() => handleOpenDossier(lead)}
                                >
                                  {/* Company */}
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                                      <span>{lead.companyName}</span>
                                      {/* Google Business Profile / Maps button */}
                                      <a
                                        href={lead.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.companyName + ' ' + (lead.city || ''))}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-blue-500 hover:text-blue-600 transition-colors inline-flex items-center"
                                        title="Open Google Business Profile"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                      {/* Website or No Website indicator */}
                                      {lead.websiteUrl ? (
                                        <a
                                          href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-primary hover:underline flex items-center gap-0.5 text-[10px] font-normal"
                                          title="Visit Official Website"
                                        >
                                          <Globe className="w-3 h-3 text-emerald-500" />
                                        </a>
                                      ) : (
                                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                          No Website
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                      {lead.industrySector && (
                                        <span className="truncate max-w-[140px]">{lead.industrySector}</span>
                                      )}
                                      {effectiveLoc && (
                                        <>
                                          <span>•</span>
                                          <span className="flex items-center gap-0.5 font-medium text-foreground/80">
                                            <MapPin className="w-2.5 h-2.5 text-primary" />
                                            {effectiveLoc}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </td>

                                  {/* Decision Maker */}
                                  <td className="py-3 px-4">
                                    <div className="font-semibold text-foreground">
                                      {lead.authorizedPersonName || (
                                        <span className="text-muted-foreground italic font-normal">Not detected</span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {lead.authorizedPersonRole || 'Executive'}
                                    </div>
                                  </td>

                                  {/* Phone / WhatsApp */}
                                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                    {lead.primaryPhone ? (
                                      <div className="flex items-center gap-2">
                                        <a
                                          href={`tel:${lead.primaryPhone}`}
                                          className="font-mono text-primary font-medium hover:underline flex items-center gap-1"
                                        >
                                          <Phone className="w-3 h-3" />
                                          {lead.primaryPhone}
                                        </a>
                                        {lead.whatsappNumber && (
                                          <a
                                            href={`https://wa.me/${lead.whatsappNumber.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-emerald-500 hover:text-emerald-600 transition-colors"
                                            title="WhatsApp Chat"
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground text-[11px]">No phone listed</span>
                                    )}
                                  </td>

                                  {/* Score */}
                                  <td className="py-3 px-4">
                                    <Badge
                                      variant="secondary"
                                      className="font-mono text-[11px] font-bold bg-primary/10 text-primary border-primary/20"
                                    >
                                      {Math.round(lead.leadScore || 0)}
                                    </Badge>
                                  </td>

                                  {/* Assigned Employee */}
                                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                                    {lead.assignedTo ? (
                                      <div className="flex items-center gap-1.5">
                                        <Avatar className="w-5 h-5 border">
                                          <AvatarImage src={lead.assignedTo.avatarUrl || undefined} />
                                          <AvatarFallback className="text-[8px]">
                                            {lead.assignedTo.name?.slice(0, 2).toUpperCase() || 'EM'}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-foreground text-xs">
                                          {lead.assignedTo.name}
                                        </span>
                                      </div>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30"
                                      >
                                        Unassigned
                                      </Badge>
                                    )}
                                  </td>

                                  {/* Call Status */}
                                  <td className="py-3 px-4">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                        lead.callStatus === 'called_connected'
                                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                          : lead.callStatus === 'meeting_scheduled'
                                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                          : lead.callStatus === 'converted'
                                          ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                          : lead.callStatus === 'follow_up'
                                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                          : 'bg-muted text-muted-foreground'
                                      }`}
                                    >
                                      {lead.callStatus.replace('_', ' ')}
                                    </span>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1.5">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleOpenAssign(lead)}
                                        className="h-7 text-[11px] gap-1 px-2 text-primary border-primary/30 hover:bg-primary/10"
                                      >
                                        <ArrowRightLeft className="w-3 h-3" />
                                        {lead.assignedTo ? 'Reassign' : 'Transfer'}
                                      </Button>

                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenDossier(lead)}
                                        className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                                      >
                                        <FileText className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* FLAT TABLE VIEW (When a single batch is selected or Group by Batch is toggled off) */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] font-bold border-b border-border/60">
                  <tr>
                    <th className="py-3 px-4">Company & Location</th>
                    <th className="py-3 px-4">Decision Maker</th>
                    <th className="py-3 px-4">Phone / WhatsApp</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Call Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredLeads.map((lead) => {
                    const effectiveLoc = getEffectiveLocation(lead);
                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDossier(lead)}
                      >
                        {/* Company */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                            <span>{lead.companyName}</span>
                            {/* Google Business Profile / Maps button */}
                            <a
                              href={lead.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.companyName + ' ' + (lead.city || ''))}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-500 hover:text-blue-600 transition-colors inline-flex items-center"
                              title="Open Google Business Profile"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            {/* Website or No Website indicator */}
                            {lead.websiteUrl ? (
                              <a
                                href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-primary hover:underline flex items-center gap-0.5 text-[10px] font-normal"
                                title="Visit Official Website"
                              >
                                <Globe className="w-3 h-3 text-emerald-500" />
                              </a>
                            ) : (
                              <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                No Website
                              </span>
                            )}
                            {lead.scanBatch?.query && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 font-medium bg-primary/5 text-primary border-primary/20"
                              >
                                {lead.scanBatch.query.replace(/ in .*$/i, '').slice(0, 24)}
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            {lead.industrySector && (
                              <span className="truncate max-w-[140px]">{lead.industrySector}</span>
                            )}
                            {effectiveLoc && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 font-medium text-foreground/80">
                                  <MapPin className="w-2.5 h-2.5 text-primary" />
                                  {effectiveLoc}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Decision Maker */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">
                            {lead.authorizedPersonName || (
                              <span className="text-muted-foreground italic font-normal">Not detected</span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {lead.authorizedPersonRole || 'Executive'}
                          </div>
                        </td>

                        {/* Phone / WhatsApp */}
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          {lead.primaryPhone ? (
                            <div className="flex items-center gap-2">
                              <a
                                href={`tel:${lead.primaryPhone}`}
                                className="font-mono text-primary font-medium hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {lead.primaryPhone}
                              </a>
                              {lead.whatsappNumber && (
                                <a
                                  href={`https://wa.me/${lead.whatsappNumber.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-500 hover:text-emerald-600 transition-colors"
                                  title="WhatsApp Chat"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">No phone listed</span>
                          )}
                        </td>

                        {/* Priority Score */}
                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className="font-mono text-[11px] font-bold bg-primary/10 text-primary border-primary/20"
                          >
                            {Math.round(lead.leadScore || 0)}
                          </Badge>
                        </td>

                        {/* Assigned Employee */}
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          {lead.assignedTo ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="w-5 h-5 border">
                                <AvatarImage src={lead.assignedTo.avatarUrl || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {lead.assignedTo.name?.slice(0, 2).toUpperCase() || 'EM'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground text-xs">
                                {lead.assignedTo.name}
                              </span>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/30"
                            >
                              Unassigned
                            </Badge>
                          )}
                        </td>

                        {/* Call Status */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              lead.callStatus === 'called_connected'
                                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                : lead.callStatus === 'meeting_scheduled'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : lead.callStatus === 'converted'
                                ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                : lead.callStatus === 'follow_up'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {lead.callStatus.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAssign(lead)}
                              className="h-7 text-[11px] gap-1 px-2 text-primary border-primary/30 hover:bg-primary/10"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              {lead.assignedTo ? 'Reassign' : 'Transfer'}
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDossier(lead)}
                              className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                            >
                              <FileText className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer / Assign Dialog */}
      <AssignLeadDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        lead={selectedLeadForAssign}
        onAssigned={handleLeadUpdated}
      />

      {/* Calling Dossier Dialog */}
      <LeadDossierModal
        open={dossierOpen}
        onOpenChange={setDossierOpen}
        lead={selectedLeadForDossier}
        onLeadUpdated={handleLeadUpdated}
      />

      {/* Targeted AI Location Discovery Modal */}
      <TriggerScanModal
        open={scanModalOpen}
        onOpenChange={setScanModalOpen}
        onScanComplete={() => {
          setActiveTab('all');
          setSelectedBatchId('all');
          setEmployeeFilter('');
          setIndustryFilter('all');
          setSearch('');
          fetchStats();
          fetchLeads({
            activeTab: 'all',
            search: '',
            employeeFilter: '',
            industryFilter: 'all',
          });
        }}
      />

      {/* AI Lead Generation Scan Request Logs & Audits */}
      <ScanLogsModal
        open={scanLogsOpen}
        onOpenChange={setScanLogsOpen}
        onLogsUpdated={() => {
          fetchStats();
          fetchLeads();
        }}
      />
    </div>
  );
}
