import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles,
  MapPin,
  Globe,
  Navigation,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  Layers,
  Terminal,
  Search,
  Building2,
  ChevronRight,
  ShieldCheck,
  Filter,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  GEOGRAPHIC_DATA,
  LOCAL_SECTOR_OPTIONS,
  type StateOption,
  type CityOption,
  type SectorOption,
} from '../utils/locationEngine';

interface TriggerScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete?: () => void;
}

const PRESET_LEAD_COUNTS = [
  { count: 5, label: '5 Leads', desc: 'Quick 30s Discovery' },
  { count: 10, label: '10 Leads', desc: 'Standard (Recommended)' },
  { count: 20, label: '20 Leads', desc: 'Deep Territory Batch' },
  { count: 50, label: '50 Leads', desc: 'Full Market Campaign' },
];

export const TriggerScanModal: React.FC<TriggerScanModalProps> = ({
  open,
  onOpenChange,
  onScanComplete,
}) => {
  const indiaCountry = GEOGRAPHIC_DATA.find((c) => c.value === 'IN') || GEOGRAPHIC_DATA[0];
  const availableStates: StateOption[] = indiaCountry.states;

  // 1. Location State (State -> District)
  const [selectedState, setSelectedState] = useState<string>('CG');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('bhilai_durg');

  // 2. Industry / Field State
  const [selectedSector, setSelectedSector] = useState<string>('education');
  const [isCustomSector, setIsCustomSector] = useState<boolean>(false);
  const [customSectorQuery, setCustomSectorQuery] = useState<string>('');

  // 3. Lead Quantity State ("Kitni Leads Chahiye")
  const [leadCount, setLeadCount] = useState<number>(10);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);

  // 4. Strict Filtering & Digital Presence (Zero-Website vs Existing Websites)
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [onlyNoWebsite, setOnlyNoWebsite] = useState<boolean>(true);
  const [scanSource, setScanSource] = useState<'maps' | 'web' | 'chamber_pdf'>('maps');

  // 5. Scanner In-flight State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('');
  const [activeScanLogId, setActiveScanLogId] = useState<string | null>(null);

  // Active State & District objects
  const currentState: StateOption =
    availableStates.find((s) => s.value === selectedState) || availableStates[1] || availableStates[0];
  const availableDistricts: CityOption[] = currentState.cities || [];
  const currentDistrict: CityOption =
    availableDistricts.find((d) => d.value === selectedDistrict) || availableDistricts[0] || {
      value: 'all_districts',
      label: 'All Districts',
      queryKeyword: currentState.label,
    };

  const isAllIndia = selectedState === 'ALL_INDIA';

  // Handle State Change -> Reset District to first available
  const handleStateChange = (stateVal: string) => {
    setSelectedState(stateVal);
    const stateObj = availableStates.find((s) => s.value === stateVal);
    if (stateObj && stateObj.cities.length > 0) {
      setSelectedDistrict(stateObj.cities[0].value);
    }
  };

  // Compute live search query & parameters
  const sectorObj = LOCAL_SECTOR_OPTIONS.find((s) => s.value === selectedSector);
  const sectorLabel = isCustomSector
    ? customSectorQuery.trim() || 'Commercial Businesses'
    : sectorObj?.label || 'Colleges & Coaching Institutes';
  const baseSectorTerms = isCustomSector
    ? customSectorQuery.trim()
    : sectorObj?.baseQuery || 'colleges coaching institutes';

  let computedFinalQuery = '';
  if (onlyNoWebsite) {
    if (isAllIndia) {
      computedFinalQuery = `${sectorLabel} in India`;
    } else if (currentDistrict.value.startsWith('all_')) {
      computedFinalQuery = `${sectorLabel} in ${currentState.label.split('(')[0].trim()}`;
    } else {
      computedFinalQuery = `${sectorLabel} in ${currentDistrict.label.split('(')[0].trim()} ${currentState.label.split('(')[0].trim()}`;
    }
  } else {
    if (isAllIndia) {
      computedFinalQuery = `"${sectorLabel}" companies in India -directory -aggregator -jobs -wikipedia`;
    } else if (currentDistrict.value.startsWith('all_')) {
      computedFinalQuery = `"${sectorLabel}" in "${currentState.label.split('(')[0].trim()}" India -directory -aggregator`;
    } else {
      computedFinalQuery = `"${sectorLabel}" in "${currentDistrict.label.split('(')[0].trim()}" "${currentState.label.split('(')[0].trim()}" -directory -aggregator`;
    }
  }

  // Poll for scan completion based on database audit log
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval>;
    if (isScanning && activeScanLogId) {
      pollInterval = setInterval(async () => {
        try {
          const res = await api.get('/leads/scan/logs');
          if (res.data?.success && Array.isArray(res.data.data)) {
            const currentLog = res.data.data.find((l: any) => l.id === activeScanLogId);
            if (currentLog && currentLog.status !== 'running') {
              setIsScanning(false);
              setCountdown(null);
              setActiveScanLogId(null);
              if (currentLog.status === 'completed' && currentLog.leadsFound > 0) {
                toast.success(`🎉 Discovered & added ${currentLog.leadsFound} new leads directly to your CRM table!`);
                setTimeout(() => onOpenChange(false), 1200);
              } else if (currentLog.status === 'no_leads' || currentLog.leadsFound === 0) {
                toast.info(`Scan finished: 0 matching businesses found for this specific query.`);
              } else if (currentLog.status === 'failed') {
                toast.error(currentLog.errorMessage || 'AI scan failed.');
              }
              if (onScanComplete) onScanComplete();
            }
          }
        } catch (e) {
          // Ignore network blip during polling
        }
      }, 3000);
    }
    return () => clearInterval(pollInterval);
  }, [isScanning, activeScanLogId, onScanComplete, onOpenChange]);

  // Informative countdown effect during scanning (does not prematurely abort background polling)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isScanning && countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            setScanStatusMessage('Finalizing: LLM extracting verified decision-maker dossiers into Hindustaan OS...');
            return 1; // Stay active at 1s until database audit poll confirms completion
          }
          if (prev > 60) {
            setScanStatusMessage('1/3: Formulating strict search query & discovering verified places...');
          } else if (prev > 25) {
            setScanStatusMessage('2/3: Gathering business metadata & strictly verifying location...');
          } else {
            setScanStatusMessage('3/3: LLM synthesizing tailor-made pitch & contacts into Hindustaan OS...');
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isScanning, countdown]);

  const handleTriggerScan = async () => {
    try {
      const finalCount = isCustomCount
        ? Math.max(1, Math.min(50, parseInt(customCountInput, 10) || 10))
        : leadCount;

      setIsScanning(true);
      setCountdown(Math.min(120, Math.max(45, finalCount * 8)));
      setScanStatusMessage(`Deploying strict scan for ${finalCount} leads in ${isAllIndia ? 'All India' : currentDistrict.label}...`);

      const payload = {
        query: computedFinalQuery,
        sector_query: computedFinalQuery,
        max_results: finalCount,
        target_count: finalCount,
        state: isAllIndia ? 'All India' : currentState.label,
        city: isAllIndia ? 'Pan-India' : currentDistrict.label,
        district: isAllIndia ? 'All' : currentDistrict.label,
        country: 'India',
        sector: sectorLabel,
        is_all_india: isAllIndia,
        strict_mode: strictMode,
        only_no_website: onlyNoWebsite,
        scan_source: onlyNoWebsite ? 'maps' : scanSource,
        is_tender: false,
      };

      const res = await api.post('/leads/scan', payload);
      if (res.data?.success) {
        if (res.data.scanLogId) {
          setActiveScanLogId(res.data.scanLogId);
        }
        toast.success(
          `🎯 Scan initiated for ${finalCount} leads in ${isAllIndia ? 'All India' : currentDistrict.label} (${sectorLabel})!`
        );
      } else {
        toast.info(res.data?.message || 'Scan registered in background.');
      }
    } catch (err: any) {
      console.error('Failed to trigger scan:', err);
      toast.error(err?.response?.data?.message || 'Failed to dispatch scan to AI engine');
      setIsScanning(false);
      setCountdown(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isScanning && onOpenChange(val)}>
      <DialogContent className="max-w-xl sm:max-w-2xl bg-card border border-border/80 shadow-2xl rounded-2xl p-0 overflow-hidden font-sans">
        {/* Header with Gradient Accent */}
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-b from-primary/5 via-transparent to-transparent border-b border-border/60">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="font-sans text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                  Targeted Lead Discovery Engine
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
                    Strict Mode
                  </span>
                </DialogTitle>
                <DialogDescription className="font-sans text-xs text-muted-foreground mt-0.5">
                  100% Geo-anchored & Topic-locked discovery. Non-matching locations and unrelated domains are strictly rejected.
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Engine Online
            </Badge>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 space-y-4 text-xs max-h-[72vh] overflow-y-auto custom-scrollbar">
          {/* 1. Location Selection (State -> District / All India) */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Step 1: Select Location (State & District)
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {isAllIndia ? 'National Coverage' : `${currentState.cities?.length || 0} Districts in State`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* State Select */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  1. Select State (or All India)
                </label>
                <Select value={selectedState} onValueChange={handleStateChange} disabled={isScanning}>
                  <SelectTrigger className="h-9 text-xs bg-background border-border/80 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {availableStates.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        <span className="font-medium">{state.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District Select */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  2. Select District / Region
                </label>
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  disabled={isScanning || availableDistricts.length === 0}
                >
                  <SelectTrigger className="h-9 text-xs bg-background border-border/80 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {availableDistricts.map((district) => (
                      <SelectItem key={district.value} value={district.value}>
                        <span className="font-medium">{district.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="text-[10px] py-0.5 px-2 bg-background/80 border-primary/20 text-primary">
                📍 Active Target: {isAllIndia ? 'All India (Pan-India)' : `${currentDistrict.label}, ${currentState.label.split('(')[0].trim()}`}
              </Badge>
            </div>
          </div>

          {/* 2. Industry / Field Selection */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Step 2: Select Field / Business Sector
              </span>
              <button
                type="button"
                onClick={() => setIsCustomSector(!isCustomSector)}
                className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                disabled={isScanning}
              >
                {isCustomSector ? '← Choose from Sectors' : '+ Type Custom Field'}
              </button>
            </div>

            {isCustomSector ? (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground">
                  Custom Industry / Business Keywords:
                </label>
                <Input
                  placeholder="e.g. Rice Mills, Solar EPC, Dental Clinics, Spices Exporters"
                  value={customSectorQuery}
                  onChange={(e) => setCustomSectorQuery(e.target.value)}
                  disabled={isScanning}
                  className="h-9 text-xs bg-background border-border/80 rounded-lg"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LOCAL_SECTOR_OPTIONS.map((sec) => {
                  const isSelected = selectedSector === sec.value;
                  return (
                    <button
                      key={sec.value}
                      type="button"
                      disabled={isScanning}
                      onClick={() => setSelectedSector(sec.value)}
                      className={`p-2.5 rounded-lg border text-left transition-all text-[11px] leading-tight flex flex-col justify-between cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs ring-1 ring-primary/30'
                          : 'border-border/70 bg-background/80 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className="line-clamp-2">{sec.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Lead Quantity Selector ("Kitni Leads Chahiye") */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                Step 3: Kitni Leads Chahiye? (Lead Quantity)
              </span>
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                {isCustomCount ? `${customCountInput || 10} Leads` : `${leadCount} Leads`}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_LEAD_COUNTS.map((preset) => {
                const isSelected = !isCustomCount && leadCount === preset.count;
                return (
                  <button
                    key={preset.count}
                    type="button"
                    disabled={isScanning}
                    onClick={() => {
                      setIsCustomCount(false);
                      setLeadCount(preset.count);
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'border-primary bg-primary/15 text-primary font-bold shadow-xs ring-2 ring-primary/40'
                        : 'border-border/70 bg-background/80 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="text-sm font-bold">{preset.label}</span>
                    <span className="text-[9px] opacity-80">{preset.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">Ya Custom Number:</span>
              <Input
                type="number"
                min={1}
                max={50}
                placeholder="e.g. 15"
                value={isCustomCount ? customCountInput : ''}
                onFocus={() => setIsCustomCount(true)}
                onChange={(e) => {
                  setIsCustomCount(true);
                  setCustomCountInput(e.target.value);
                }}
                disabled={isScanning}
                className="h-8 w-24 text-xs bg-background border-border/80 rounded-lg text-center font-bold"
              />
              <span className="text-[10px] text-muted-foreground">(Max 50 leads per targeted batch)</span>
            </div>
          </div>

          {/* 4. Strict Location & Topic Locking Verification */}
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground">Strict Filtering Guardrail Active</span>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                  Zero Non-Matching
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {onlyNoWebsite ? (
                  <>
                    <strong className="text-amber-600 dark:text-amber-400">Zero-Website Filter Active:</strong> Jinki website pehle se hai unhe strictly drop kiya jayega. Sirf{' '}
                    <strong className="text-foreground">{isAllIndia ? 'India' : currentDistrict.label}</strong> ke aise local businesses save honge jin ke paas verified phone hai par <strong>koi website nahi hai</strong>.
                  </>
                ) : (
                  <>
                    Companies whose physical address, phone code, or business topic does NOT strictly match{' '}
                    <strong className="text-foreground">{isAllIndia ? 'India' : currentDistrict.label}</strong> and{' '}
                    <strong className="text-foreground">{sectorLabel}</strong> will be automatically filtered out.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Target Website Presence Mode (Only Businesses Without Website vs Existing Websites) */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Step 2: Target Website Status (Digital Presence)
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 font-bold ${
                  onlyNoWebsite
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                }`}
              >
                {onlyNoWebsite ? '🎯 Zero-Website Leads Only' : '🌐 Existing Websites'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setOnlyNoWebsite(true);
                  setScanSource('maps');
                }}
                disabled={isScanning}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  onlyNoWebsite
                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
                    : 'border-border/70 bg-background/50 hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-semibold text-xs flex items-center gap-1.5 ${
                      onlyNoWebsite ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Without Website (Offline)
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary uppercase font-bold"
                  >
                    Pitch Website
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Google Maps businesses with verified phones but <strong>zero website</strong>. Perfect for pitching custom website creation.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOnlyNoWebsite(false);
                  setScanSource('web');
                }}
                disabled={isScanning}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  !onlyNoWebsite
                    ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40'
                    : 'border-border/70 bg-background/50 hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-semibold text-xs flex items-center gap-1.5 ${
                      !onlyNoWebsite ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    With Existing Website
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground uppercase font-bold"
                  >
                    Web Scrape
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Companies that already have a website. For pitching website redesigns, mobile apps, or custom AI software.
                </p>
              </button>
            </div>
          </div>

          {/* 5. Terminal Query Preview */}
          <div className="p-3 rounded-xl bg-muted/50 border border-border/60 space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between text-muted-foreground font-sans text-[10px] font-semibold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-primary" /> Formulated Query Preview
              </span>
              <span>Target: {isCustomCount ? customCountInput || 10 : leadCount} Leads</span>
            </div>
            <p className="text-foreground font-medium break-all bg-background/80 p-2 rounded-lg border border-border/60 text-[11px]">
              {computedFinalQuery}
            </p>
          </div>

          {/* Progress / Scanning status */}
          {isScanning && (
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-primary flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {scanStatusMessage}
                </span>
                <span className="font-mono text-xs font-bold text-primary">
                  {countdown !== null ? `${countdown}s` : ''}
                </span>
              </div>
              <div className="w-full bg-primary/20 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(5, ((90 - (countdown || 0)) / 90) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="px-6 py-3.5 bg-muted/20 border-t border-border/60 flex items-center justify-between sm:justify-between">
          <div className="text-[11px] text-muted-foreground hidden sm:block">
            Target: <strong className="text-foreground">{isAllIndia ? 'All India' : currentDistrict.label}</strong> • {sectorLabel} •{' '}
            <strong className="text-primary">{isCustomCount ? customCountInput || 10 : leadCount} Leads</strong>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isScanning}
              className="h-9 text-xs rounded-lg cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="h-9 text-xs gap-1.5 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer px-4"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Scanning Leads...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Start Discovery ({isCustomCount ? customCountInput || 10 : leadCount} Leads)
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
