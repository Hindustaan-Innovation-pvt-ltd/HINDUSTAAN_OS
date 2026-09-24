import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  MapPin,
  Building,
  Layers,
  Trash2,
  Globe,
  Compass,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { LeadScanLog, ScanLogsSummary, ScanLogStatus } from '../types/lead.types';

interface ScanLogsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogsUpdated?: () => void;
}

export const ScanLogsModal: React.FC<ScanLogsModalProps> = ({
  open,
  onOpenChange,
  onLogsUpdated,
}) => {
  const [logs, setLogs] = useState<LeadScanLog[]>([]);
  const [summary, setSummary] = useState<ScanLogsSummary>({
    totalRequests: 0,
    successfulScans: 0,
    zeroLeadsScans: 0,
    runningScans: 0,
    failedScans: 0,
    totalLeadsGenerated: 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const res = await api.get('/leads/scan/logs');
      if (res.data?.success) {
        setLogs(res.data.data || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
        if (onLogsUpdated) onLogsUpdated();
      }
    } catch (err: any) {
      console.error('Failed to load scan logs:', err);
      if (!quiet) toast.error('Failed to fetch scan logs');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [onLogsUpdated]);

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, fetchLogs]);

  // Auto-poll if any scan is running
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const hasRunning = logs.some((l) => l.status === 'running');
    if (open && hasRunning) {
      interval = setInterval(() => {
        fetchLogs(true);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, logs, fetchLogs]);

  const handleDeleteLog = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/leads/scan/logs/${id}`);
      if (res.data?.success) {
        toast.success('Scan log removed');
        setLogs((prev) => prev.filter((l) => l.id !== id));
        fetchLogs(true);
      }
    } catch (err: any) {
      toast.error('Failed to delete scan log');
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === 'completed' && !(log.status === 'completed' && log.leadsFound > 0)) {
      return false;
    }
    if (filterStatus === 'no_leads' && !(log.status === 'no_leads' || (log.status === 'completed' && log.leadsFound === 0))) {
      return false;
    }
    if (filterStatus === 'running' && log.status !== 'running') {
      return false;
    }
    if (filterStatus === 'failed' && log.status !== 'failed') {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchQuery = (log.query || '').toLowerCase().includes(q);
      const matchCity = (log.city || '').toLowerCase().includes(q);
      const matchSector = (log.sector || '').toLowerCase().includes(q);
      const matchUser = (log.user?.name || '').toLowerCase().includes(q);
      return matchQuery || matchCity || matchSector || matchUser;
    }

    return true;
  });

  const getStatusBadge = (log: LeadScanLog) => {
    if (log.status === 'running') {
      return (
        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1.5 py-1 px-2.5 animate-pulse font-medium">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Scanning & Crawling...
        </Badge>
      );
    }
    if (log.status === 'completed' && log.leadsFound > 0) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-1 px-2.5 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          {log.leadsFound} Leads Generated
        </Badge>
      );
    }
    if (log.status === 'no_leads' || (log.status === 'completed' && log.leadsFound === 0)) {
      return (
        <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 gap-1.5 py-1 px-2.5 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          0 Leads Found
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 gap-1.5 py-1 px-2.5 font-medium">
        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        Failed / Offline
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border border-border/80 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="p-5 border-b border-border/70 bg-gradient-to-r from-primary/5 via-muted/20 to-transparent shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                    Lead Generation Request Logs
                  </DialogTitle>
                  <Badge variant="outline" className="text-xs font-semibold bg-background">
                    {summary.totalRequests} Total Requests
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Complete audit of all AI lead discovery runs: how many requests were sent, leads brought back, and zero-match cases.
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs()}
              disabled={loading}
              className="gap-2 text-xs shrink-0 h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* 5-Metric KPI Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4">
            <div className="bg-background/80 border border-border/70 rounded-xl p-2.5 shadow-2xs flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                Requests Sent
              </span>
              <span className="text-lg font-bold text-foreground mt-0.5">
                {summary.totalRequests}
              </span>
              <span className="text-[10px] text-muted-foreground">Total API dispatches</span>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2.5 shadow-2xs flex flex-col">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Total Leads Found
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {summary.totalLeadsGenerated}
              </span>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">Added to Hindustaan CRM</span>
            </div>

            <div className="bg-background/80 border border-border/70 rounded-xl p-2.5 shadow-2xs flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Successful (Leads Ayi)
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {summary.successfulScans}
              </span>
              <span className="text-[10px] text-muted-foreground">Brought ≥ 1 lead</span>
            </div>

            <div className="bg-background/80 border border-border/70 rounded-xl p-2.5 shadow-2xs flex flex-col">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Zero Leads (Nahi Ayi)
              </span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {summary.zeroLeadsScans}
              </span>
              <span className="text-[10px] text-muted-foreground">0 businesses discovered</span>
            </div>

            <div className="bg-background/80 border border-border/70 rounded-xl p-2.5 shadow-2xs flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 ${summary.runningScans > 0 ? 'text-blue-500 animate-spin' : 'text-muted-foreground'}`} />
                In-Flight
              </span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {summary.runningScans}
              </span>
              <span className="text-[10px] text-muted-foreground">Actively crawling</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
            {[
              { id: 'all', label: `All (${summary.totalRequests})` },
              { id: 'completed', label: `With Leads (${summary.successfulScans})` },
              { id: 'no_leads', label: `0 Leads (${summary.zeroLeadsScans})` },
              { id: 'running', label: `In Progress (${summary.runningScans})` },
              { id: 'failed', label: `Failed (${summary.failedScans})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === tab.id
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-background hover:bg-muted text-muted-foreground border border-border/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search query, city..."
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>
        </div>

        {/* Logs List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <RefreshCw className="w-7 h-7 animate-spin text-primary mb-2" />
              <p className="text-xs">Loading lead generation history...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground mb-3 border border-border/60">
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground/70" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">No Request Logs Found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {searchQuery || filterStatus !== 'all'
                  ? 'No logs match the selected filter criteria. Try clearing filters.'
                  : 'No lead generation requests have been dispatched yet. Click "Discover Leads by Location" to run a scan.'}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasDiscoveredNames =
                Array.isArray(log.discoveredLeads) && log.discoveredLeads.length > 0;

              return (
                <div
                  key={log.id}
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className={`border rounded-xl p-3.5 bg-background hover:bg-muted/10 transition-all cursor-pointer shadow-2xs ${
                    log.status === 'running'
                      ? 'border-blue-500/40 bg-blue-500/5'
                      : log.status === 'completed' && log.leadsFound > 0
                      ? 'border-emerald-500/30'
                      : log.status === 'no_leads'
                      ? 'border-amber-500/30'
                      : 'border-border/70'
                  }`}
                >
                  {/* Row 1: Status Badge, Time, and Actions */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(log)}

                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-muted-foreground/80" />
                        {formatDate(log.createdAt)}
                      </span>

                      {log.source && (
                        <Badge variant="outline" className="text-[10px] font-mono capitalize py-0 px-1.5 bg-muted/30">
                          {log.source === 'maps' ? '📍 Google Maps' : '🌐 Web Crawl'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteLog(log.id, e)}
                        className="w-7 h-7 text-muted-foreground hover:text-rose-500"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>

                      <div className="text-muted-foreground">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Target Search Query & Territory */}
                  <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-foreground">
                          "{log.query}"
                        </span>
                        {log.sector && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                            {log.sector}
                          </Badge>
                        )}
                        {log.city && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary shrink-0" />
                            {log.city}{log.state ? `, ${log.state}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground shrink-0 font-medium">
                      Target Requested:{' '}
                      <span className="font-bold text-foreground">{log.targetCount} Leads</span>
                      {' • '}
                      Fetched:{' '}
                      <span
                        className={`font-bold ${
                          log.leadsFound > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {log.leadsFound} Leads
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Initiator & Progress/Error message */}
                  <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between gap-2 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5 border border-border">
                        <AvatarImage src={log.user?.avatarUrl || ''} />
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                          {log.user?.name ? log.user.name.slice(0, 2).toUpperCase() : 'AD'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-muted-foreground">
                        Triggered by:{' '}
                        <strong className="text-foreground">
                          {log.user?.name || 'Admin'}
                        </strong>
                      </span>
                    </div>

                    {log.errorMessage ? (
                      <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                        Error: {log.errorMessage}
                      </span>
                    ) : log.message ? (
                      <span className="text-[11px] text-muted-foreground truncate max-w-sm">
                        {log.message}
                      </span>
                    ) : null}
                  </div>

                  {/* Expandable Preview: Discovered Businesses */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/60 bg-muted/20 p-3 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-primary" />
                          Discovered Businesses in this Run ({log.leadsFound}):
                        </span>
                        {log.jobId && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Job ID: {log.jobId}
                          </span>
                        )}
                      </div>

                      {hasDiscoveredNames ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {log.discoveredLeads.map((name: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 bg-background border border-border/70 rounded-md font-medium text-foreground flex items-center gap-1"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : log.status === 'running' ? (
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Crawl in progress. Newly identified businesses will appear here once saved.
                        </p>
                      ) : log.leadsFound === 0 ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Zero businesses qualified for this specific search query and territory filter.
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {log.leadsFound} leads were persisted into the CRM database.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3 text-xs shrink-0">
          <span className="text-muted-foreground text-[11px]">
            Showing {filteredLogs.length} of {summary.totalRequests} logged requests
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs font-medium"
          >
            Close Logs
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
