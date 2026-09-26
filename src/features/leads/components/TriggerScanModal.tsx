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
  X,
  ChevronsUpDown,
  Check,
  GraduationCap,
  School,
  HeartPulse,
  Factory,
  Truck,
  Wrench,
  Car,
  Wheat,
  Laptop,
  SunMedium,
  Hotel,
  Calculator,
  CarTaxiFront,
} from 'lucide-react';

const SECTOR_ICON_MAP: Record<string, React.ElementType> = {
  Calculator,
  CarTaxiFront,
  GraduationCap,
  School,
  HeartPulse,
  Factory,
  Truck,
  Wrench,
  Building2,
  Car,
  Wheat,
  Laptop,
  SunMedium,
  Hotel,
};

const SECTOR_COLOR_MAP: Record<string, { bg: string; text: string; border: string; activeBorder: string; badge: string }> = {
  cab_taxi: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    activeBorder: 'border-amber-500',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  ca_finance: {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-500/20',
    activeBorder: 'border-cyan-500',
    badge: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300',
  },
  education: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    activeBorder: 'border-indigo-500',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  },
  schools: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/20',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/20',
    activeBorder: 'border-sky-500',
    badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  healthcare: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
    activeBorder: 'border-rose-500',
    badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  },
  steel: {
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20',
    activeBorder: 'border-orange-500',
    badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  },
  logistics: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    activeBorder: 'border-amber-500',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  industrial: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20',
    activeBorder: 'border-slate-500',
    badge: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  },
  realestate: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    activeBorder: 'border-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  retail_auto: {
    bg: 'bg-violet-500/10 dark:bg-violet-500/20',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-500/20',
    activeBorder: 'border-violet-500',
    badge: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  },
  agro_food: {
    bg: 'bg-lime-500/10 dark:bg-lime-500/20',
    text: 'text-lime-700 dark:text-lime-400',
    border: 'border-lime-500/20',
    activeBorder: 'border-lime-500',
    badge: 'bg-lime-500/15 text-lime-800 dark:text-lime-300',
  },
  tech_it: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    activeBorder: 'border-blue-500',
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  },
  solar: {
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    text: 'text-yellow-600 dark:text-yellow-500',
    border: 'border-yellow-500/20',
    activeBorder: 'border-yellow-500',
    badge: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300',
  },
  hospitality: {
    bg: 'bg-teal-500/10 dark:bg-teal-500/20',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/20',
    activeBorder: 'border-teal-500',
    badge: 'bg-teal-500/15 text-teal-700 dark:text-teal-300',
  },
};

const SECTOR_CATEGORIES = [
  { id: 'all', label: 'All Sectors' },
  { id: 'Business Services', label: 'Business & Cab Services' },
  { id: 'Finance & Legal', label: 'Finance & Legal (CA)' },
  { id: 'Industry & Infra', label: 'Industry & Infra' },
  { id: 'Education & Health', label: 'Education & Health' },
  { id: 'Retail & Trade', label: 'Retail & Trade' },
  { id: 'Tech & Energy', label: 'Tech & Energy' },
];

const CUSTOM_SECTOR_SUGGESTIONS = [
  '🚕 Outstation Cabs & Taxi Services',
  '⚖️ Chartered Accountants & Tax Consultants',
  '🌾 Rice & Dal Mills',
  '☀️ Rooftop Solar EPC',
  '🦷 Dental Clinics',
  '🏗️ TMT Rolling Mills',
  '🚚 Goods Transporters',
  '🏨 Banquet & Lawns',
  '💍 Jewelry Showrooms',
];
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  GEOGRAPHIC_DATA,
  LOCAL_SECTOR_OPTIONS,
  searchAllLocations,
  type StateOption,
  type CityOption,
  type SectorOption,
  type LocationSearchResult,
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

  // 1. Location State (Interactive Textbox + Autocomplete Suggestions)
  const [selectedState, setSelectedState] = useState<string>('CG');
  const [stateInput, setStateInput] = useState<string>('Chhattisgarh');
  const [showStateSuggestions, setShowStateSuggestions] = useState<boolean>(false);

  const [selectedDistrict, setSelectedDistrict] = useState<string>('bhilai_durg');
  const [districtInput, setDistrictInput] = useState<string>('Durg & Bhilai');
  const [showDistrictSuggestions, setShowDistrictSuggestions] = useState<boolean>(false);

  const stateContainerRef = React.useRef<HTMLDivElement>(null);
  const districtContainerRef = React.useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (stateContainerRef.current && !stateContainerRef.current.contains(e.target as Node)) {
        setShowStateSuggestions(false);
      }
      if (districtContainerRef.current && !districtContainerRef.current.contains(e.target as Node)) {
        setShowDistrictSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Smart Search State
  const [locationSearchQuery, setLocationSearchQuery] = useState<string>('');
  const [isLocationSearchFocused, setIsLocationSearchFocused] = useState<boolean>(false);

  // Search Results
  const locationSearchResults = React.useMemo(() => {
    return searchAllLocations(locationSearchQuery);
  }, [locationSearchQuery]);

  const handleSelectSearchResult = (result: LocationSearchResult) => {
    setSelectedState(result.stateCode);
    setSelectedDistrict(result.cityValue);
    setLocationSearchQuery('');
    setIsLocationSearchFocused(false);
    toast.success(`📍 Target set to ${result.cityLabel.split('(')[0].trim()}, ${result.stateLabel.split('(')[0].trim()}`);
  };

  // 2. Industry / Field State
  const SECTORS_DEFAULT_WITH_WEBSITE = React.useMemo(() => new Set(['healthcare', 'education', 'schools', 'tech_it']), []);
  const [selectedSector, setSelectedSector] = useState<string>('education');
  const [sectorCategoryFilter, setSectorCategoryFilter] = useState<string>('all');
  const [isCustomSector, setIsCustomSector] = useState<boolean>(false);
  const [customSectorQuery, setCustomSectorQuery] = useState<string>('');

  // 3. Lead Quantity State ("Kitni Leads Chahiye")
  const [leadCount, setLeadCount] = useState<number>(10);
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);

  // 4. Strict Filtering & Digital Presence (Zero-Website vs Existing Websites)
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [onlyNoWebsite, setOnlyNoWebsite] = useState<boolean>(false); // False by default for education/schools/healthcare
  const [autoExpandRelated, setAutoExpandRelated] = useState<boolean>(true);
  const [scanSource, setScanSource] = useState<'maps' | 'web' | 'chamber_pdf'>('maps');

  // 5. Scanner In-flight State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('');
  const [activeScanLogId, setActiveScanLogId] = useState<string | null>(null);

  const activeScanLogIdRef = React.useRef<string | null>(null);
  const handledScanLogIdsRef = React.useRef<Set<string>>(new Set());
  const onScanCompleteRef = React.useRef(onScanComplete);
  const pollIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    onScanCompleteRef.current = onScanComplete;
  }, [onScanComplete]);

  useEffect(() => {
    activeScanLogIdRef.current = activeScanLogId;
  }, [activeScanLogId]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Resolve matching state object
  const stateQuery = stateInput.trim().toLowerCase();
  const matchedState: StateOption | undefined =
    availableStates.find((s) => s.value.toLowerCase() === selectedState.toLowerCase()) ||
    availableStates.find((s) => {
      const clean = s.label.replace(/🇮🇳/g, '').split('(')[0].trim().toLowerCase();
      return stateQuery && clean === stateQuery;
    }) ||
    availableStates.find((s) => {
      const clean = s.label.replace(/🇮🇳/g, '').split('(')[0].trim().toLowerCase();
      return stateQuery && clean.includes(stateQuery);
    });

  const effectiveStateLabel = stateInput.trim().replace(/🇮🇳/g, '').split('(')[0].trim() ||
    (matchedState ? matchedState.label.replace(/🇮🇳/g, '').split('(')[0].trim() : 'Chhattisgarh');

  const isAllIndia =
    selectedState === 'ALL_INDIA' ||
    effectiveStateLabel.toLowerCase().includes('all india') ||
    effectiveStateLabel.toLowerCase().includes('pan-india') ||
    effectiveStateLabel.toLowerCase().includes('entire india');

  const availableDistricts: CityOption[] = matchedState?.cities || [];

  // Filter states for autocomplete
  const filteredStates = availableStates.filter((s) => {
    if (!stateQuery) return true;
    const cleanLabel = s.label.replace(/🇮🇳/g, '').toLowerCase();
    return cleanLabel.includes(stateQuery) || s.value.toLowerCase().includes(stateQuery);
  });

  // Resolve matching district
  const districtQuery = districtInput.trim().toLowerCase();
  const matchedDistrict: CityOption | undefined =
    availableDistricts.find((d) => d.value.toLowerCase() === selectedDistrict.toLowerCase()) ||
    availableDistricts.find((d) => {
      const clean = d.label.split('(')[0].trim().toLowerCase();
      return districtQuery && clean === districtQuery;
    }) ||
    availableDistricts.find((d) => {
      const clean = d.label.split('(')[0].trim().toLowerCase();
      return districtQuery && clean.includes(districtQuery);
    });

  const effectiveDistrictLabel = districtInput.trim().split('(')[0].trim() ||
    (matchedDistrict ? matchedDistrict.label.split('(')[0].trim() : (availableDistricts[0]?.label.split('(')[0].trim() || 'All Districts'));

  const isAllDistricts =
    isAllIndia ||
    !effectiveDistrictLabel ||
    effectiveDistrictLabel.toLowerCase().startsWith('all') ||
    effectiveDistrictLabel.toLowerCase() === 'all districts';

  // Filter districts within current state
  const currentDistrictsFiltered = availableDistricts.filter((d) => {
    if (!districtQuery) return true;
    const cleanLabel = d.label.toLowerCase();
    return cleanLabel.includes(districtQuery) || d.value.toLowerCase().includes(districtQuery);
  });

  // Cross-state search across India if districtQuery doesn't match current state well
  const otherStateDistricts = React.useMemo(() => {
    if (!districtQuery || districtQuery.length < 2) return [];
    const results: Array<{ district: CityOption; state: StateOption }> = [];
    for (const st of availableStates) {
      if (st.value === matchedState?.value) continue;
      for (const city of st.cities) {
        if (city.label.toLowerCase().includes(districtQuery)) {
          results.push({ district: city, state: st });
        }
      }
    }
    return results.slice(0, 10);
  }, [districtQuery, availableStates, matchedState]);

  // Compute live search query & parameters
  const sectorObj = LOCAL_SECTOR_OPTIONS.find((s) => s.value === selectedSector);
  const sectorLabel = isCustomSector
    ? customSectorQuery.trim() || 'Commercial Businesses'
    : sectorObj?.label || 'Colleges & Coaching Institutes';
  const baseSectorTerms = isCustomSector
    ? customSectorQuery.trim()
    : sectorObj?.baseQuery || sectorLabel;

  // Clean location terms for Maps engine (e.g. "Raipur Chhattisgarh" instead of "Raipur District (Capital & Commercial Hub) Chhattisgarh")
  const cleanDistrict = isAllIndia
    ? 'India'
    : isAllDistricts
    ? effectiveStateLabel
    : (matchedDistrict?.queryKeyword || `${effectiveDistrictLabel.replace(/\s*\(.*?\)/g, '').replace(/\bdistrict\b/gi, '').trim()} ${effectiveStateLabel}`.trim());

  let computedFinalQuery = '';
  if (onlyNoWebsite) {
    if (isAllIndia) {
      computedFinalQuery = `${baseSectorTerms} in India`;
    } else if (isAllDistricts) {
      computedFinalQuery = `${baseSectorTerms} in ${effectiveStateLabel}`;
    } else {
      computedFinalQuery = `${baseSectorTerms} in ${cleanDistrict}`;
    }
  } else {
    if (isAllIndia) {
      computedFinalQuery = `"${sectorLabel}" companies in India -directory -aggregator -jobs -wikipedia`;
    } else if (isAllDistricts) {
      computedFinalQuery = `"${sectorLabel}" in "${effectiveStateLabel}" India -directory -aggregator`;
    } else {
      computedFinalQuery = `"${sectorLabel}" in "${cleanDistrict}" -directory -aggregator`;
    }
  }

  // Poll for scan completion based on database audit log (guaranteed single notification)
  useEffect(() => {
    if (!isScanning || !activeScanLogId) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const scanId = activeScanLogId;
    if (handledScanLogIdsRef.current.has(scanId)) {
      return;
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    const checkStatus = async () => {
      try {
        const res = await api.get('/leads/scan/logs');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const currentLog = res.data.data.find((l: any) => l.id === scanId);
          if (currentLog && currentLog.status !== 'running') {
            // Check if already processed to prevent duplicate notifications
            if (handledScanLogIdsRef.current.has(scanId)) {
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
              }
              return;
            }
            handledScanLogIdsRef.current.add(scanId);

            // Halt interval immediately
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }

            setIsScanning(false);
            setCountdown(null);
            setActiveScanLogId(null);
            activeScanLogIdRef.current = null;

            if (currentLog.status === 'completed' && currentLog.leadsFound > 0) {
              toast.success(
                `🎉 Discovered & added ${currentLog.leadsFound} new leads directly to your CRM table!`,
                { id: `scan-complete-${scanId}` }
              );
              onOpenChange(false);
            } else if (currentLog.status === 'no_leads' || currentLog.leadsFound === 0) {
              toast.info(`Scan finished: 0 matching businesses found for this specific query.`, {
                id: `scan-complete-${scanId}`,
              });
            } else if (currentLog.status === 'failed') {
              toast.error(currentLog.errorMessage || 'AI scan failed.', {
                id: `scan-complete-${scanId}`,
              });
            }

            // Refresh parent leads table exactly once
            if (onScanCompleteRef.current) {
              onScanCompleteRef.current();
            }
          }
        }
      } catch (e) {
        // Ignore network blip during background polling
      }
    };

    pollIntervalRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isScanning, activeScanLogId, onOpenChange]);

  // Informative countdown effect during scanning
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isScanning && countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            setScanStatusMessage('Finalizing: Extracting verified decision-maker dossiers into CRM...');
            return 1;
          }
          if (prev > 60) {
            setScanStatusMessage('1/3: Formulating search query & discovering verified places...');
          } else if (prev > 25) {
            setScanStatusMessage('2/3: Gathering business metadata & strictly verifying location...');
          } else {
            setScanStatusMessage('3/3: Synthesizing tailor-made pitch & contacts into CRM...');
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

      const targetDisplayName = isAllIndia
        ? 'All India'
        : isAllDistricts
        ? `All Districts (${effectiveStateLabel})`
        : `${effectiveDistrictLabel}, ${effectiveStateLabel}`;

      setIsScanning(true);
      setCountdown(Math.min(120, Math.max(45, finalCount * 8)));
      setScanStatusMessage(`Deploying strict scan for ${finalCount} leads in ${targetDisplayName}...`);

      const payload = {
        query: computedFinalQuery,
        sector_query: computedFinalQuery,
        max_results: finalCount,
        target_count: finalCount,
        state: isAllIndia ? 'All India' : effectiveStateLabel,
        city: isAllIndia ? 'Pan-India' : (isAllDistricts ? effectiveStateLabel : effectiveDistrictLabel),
        district: isAllIndia ? 'All' : (isAllDistricts ? 'All' : effectiveDistrictLabel),
        country: 'India',
        sector: sectorLabel,
        category: sectorObj?.category || 'General',
        fallback_to_related: autoExpandRelated,
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
          activeScanLogIdRef.current = res.data.scanLogId;
        }
        toast.success(
          `🎯 Scan initiated for ${finalCount} leads in ${targetDisplayName} (${sectorLabel})!`,
          { id: 'scan-init-toast' }
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

  const handleModalClose = (nextOpen: boolean) => {
    if (!nextOpen && isScanning) {
      toast.info('🚀 Lead discovery is continuing in the background. We will notify you when it finishes!', {
        id: 'bg-scan-notice',
      });
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
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
          {/* 1. Location Selection (State & District with Searchable Typeahead Textboxes) */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Step 1: Select Location (Search City or Pick State & District)
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {isAllIndia ? 'National Coverage' : `${availableDistricts.length} Districts Available`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. State Searchable Textbox */}
              <div className="relative" ref={stateContainerRef}>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  1. State / Region (Type to Search)
                </label>
                <div className="relative flex items-center">
                  <MapPin className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={stateInput}
                    disabled={isScanning}
                    placeholder="Type state (e.g. Chhattisgarh, Maharashtra...)"
                    onChange={(e) => {
                      setStateInput(e.target.value);
                      setShowStateSuggestions(true);
                    }}
                    onFocus={() => setShowStateSuggestions(true)}
                    className="h-9 pl-8 pr-14 text-xs bg-background border-border/80 rounded-lg focus-visible:ring-1 focus-visible:ring-primary font-medium"
                  />
                  <div className="absolute right-1.5 flex items-center gap-0.5">
                    {stateInput && !isScanning && (
                      <button
                        type="button"
                        onClick={() => {
                          setStateInput('');
                          setSelectedState('');
                          setShowStateSuggestions(true);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
                        title="Clear state"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => setShowStateSuggestions((prev) => !prev)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* State Suggestions Dropdown */}
                {showStateSuggestions && !isScanning && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-xl max-h-56 overflow-y-auto p-1 text-xs custom-scrollbar">
                    {stateInput.trim() && !availableStates.some((s) => s.label.toLowerCase().includes(stateInput.trim().toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowStateSuggestions(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-primary/10 text-primary font-medium flex items-center gap-2 transition-colors cursor-pointer mb-1 border-b border-border/40 pb-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">Use custom state: &ldquo;{stateInput.trim()}&rdquo;</span>
                      </button>
                    )}

                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Select State or Region
                    </div>

                    {filteredStates.map((state) => {
                      const isSelected = selectedState === state.value ||
                        stateInput.trim().toLowerCase() === state.label.replace(/🇮🇳/g, '').split('(')[0].trim().toLowerCase();
                      return (
                        <button
                          key={state.value}
                          type="button"
                          onClick={() => {
                            const cleanName = state.label.replace(/🇮🇳/g, '').split('(')[0].trim();
                            setStateInput(cleanName);
                            setSelectedState(state.value);
                            setShowStateSuggestions(false);

                            if (state.cities && state.cities.length > 0) {
                              const defaultCity = state.cities[1] || state.cities[0];
                              setDistrictInput(defaultCity.label.split('(')[0].trim());
                              setSelectedDistrict(defaultCity.value);
                            } else {
                              setDistrictInput('');
                              setSelectedDistrict('');
                            }
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-primary/15 text-primary font-semibold'
                              : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                          }`}
                        >
                          <div className="flex flex-col truncate pr-2">
                            <span className="truncate">{state.label}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {state.value === 'ALL_INDIA' ? 'Pan-India coverage' : `${state.cities.length} Districts`}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                        </button>
                      );
                    })}

                    {filteredStates.length === 0 && (
                      <div className="px-3 py-2 text-muted-foreground text-center text-[11px]">
                        No matching state. Custom text &ldquo;{stateInput}&rdquo; will be used.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 2. District Searchable Textbox */}
              <div className="relative" ref={districtContainerRef}>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                  2. District / City (Type to Search)
                </label>
                <div className="relative flex items-center">
                  <Navigation className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    value={districtInput}
                    disabled={isScanning}
                    placeholder="Type district (e.g. Raipur, Bhilai, Bilaspur...)"
                    onChange={(e) => {
                      setDistrictInput(e.target.value);
                      setShowDistrictSuggestions(true);
                    }}
                    onFocus={() => setShowDistrictSuggestions(true)}
                    className="h-9 pl-8 pr-14 text-xs bg-background border-border/80 rounded-lg focus-visible:ring-1 focus-visible:ring-primary font-medium"
                  />
                  <div className="absolute right-1.5 flex items-center gap-0.5">
                    {districtInput && !isScanning && (
                      <button
                        type="button"
                        onClick={() => {
                          setDistrictInput('');
                          setSelectedDistrict('');
                          setShowDistrictSuggestions(true);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
                        title="Clear district"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isScanning}
                      onClick={() => setShowDistrictSuggestions((prev) => !prev)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
                    >
                      <ChevronsUpDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* District Suggestions Dropdown */}
                {showDistrictSuggestions && !isScanning && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-popover/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-xl max-h-56 overflow-y-auto p-1 text-xs custom-scrollbar">
                    {districtInput.trim() && !availableDistricts.some((d) => d.label.toLowerCase().includes(districtInput.trim().toLowerCase())) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowDistrictSuggestions(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-primary/10 text-primary font-medium flex items-center gap-2 transition-colors cursor-pointer mb-1 border-b border-border/40 pb-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">Use custom location: &ldquo;{districtInput.trim()}&rdquo;</span>
                      </button>
                    )}

                    {/* Districts in Current State */}
                    {currentDistrictsFiltered.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Districts in {effectiveStateLabel}
                        </div>
                        {currentDistrictsFiltered.map((district) => {
                          const isSelected = selectedDistrict === district.value ||
                            districtInput.trim().toLowerCase() === district.label.split('(')[0].trim().toLowerCase();
                          return (
                            <button
                              key={district.value}
                              type="button"
                              onClick={() => {
                                const clean = district.label.split('(')[0].trim();
                                setDistrictInput(clean);
                                setSelectedDistrict(district.value);
                                setShowDistrictSuggestions(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-primary/15 text-primary font-semibold'
                                  : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                              }`}
                            >
                              <span className="truncate pr-2">{district.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </button>
                          );
                        })}
                      </>
                    )}

                    {/* Cross-State Search across other states */}
                    {otherStateDistricts.length > 0 && (
                      <>
                        <div className="px-2 py-1 mt-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t border-border/40 pt-1.5">
                          Other States in India
                        </div>
                        {otherStateDistricts.map(({ district, state }) => (
                          <button
                            key={`${state.value}-${district.value}`}
                            type="button"
                            onClick={() => {
                              const cleanState = state.label.replace(/🇮🇳/g, '').split('(')[0].trim();
                              const cleanDistrict = district.label.split('(')[0].trim();
                              setStateInput(cleanState);
                              setSelectedState(state.value);
                              setDistrictInput(cleanDistrict);
                              setSelectedDistrict(district.value);
                              setShowDistrictSuggestions(false);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-accent hover:text-accent-foreground text-foreground flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="truncate pr-2">{district.label}</span>
                            <span className="text-[10px] font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">
                              {state.label.split('(')[0].trim()}
                            </span>
                          </button>
                        ))}
                      </>
                    )}

                    {currentDistrictsFiltered.length === 0 && otherStateDistricts.length === 0 && (
                      <div className="px-3 py-2 text-muted-foreground text-center text-[11px]">
                        No predefined district found. Custom location &ldquo;{districtInput}&rdquo; will be used.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="outline" className="text-[10px] py-1 px-2.5 bg-background/80 border-primary/20 text-primary flex items-center gap-1.5 font-medium shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                📍 Active Target: {isAllIndia ? 'All India (Pan-India Scan)' : (isAllDistricts ? `All Districts in ${effectiveStateLabel}` : `${effectiveDistrictLabel}, ${effectiveStateLabel}`)}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                (Type any custom city, town, or state freely)
              </span>
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
                className="text-[11px] text-primary hover:underline font-semibold cursor-pointer flex items-center gap-1"
                disabled={isScanning}
              >
                {isCustomSector ? '← Choose from 12 Sectors' : '+ Type Custom Field'}
              </button>
            </div>

            {isCustomSector ? (
              <div className="space-y-2.5 bg-background/60 p-3.5 rounded-xl border border-border/70">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Custom Industry / Business Keywords:
                  </label>
                  <span className="text-[10px] text-muted-foreground">Type any niche or click suggestion</span>
                </div>
                <Input
                  placeholder="e.g. Rice Mills, Solar EPC, Dental Clinics, Spices Exporters, CA Firms..."
                  value={customSectorQuery}
                  onChange={(e) => setCustomSectorQuery(e.target.value)}
                  disabled={isScanning}
                  className="h-9 text-xs bg-background border-border/80 rounded-lg focus-visible:ring-1 focus-visible:ring-primary font-medium"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Quick suggestions:</span>
                  {CUSTOM_SECTOR_SUGGESTIONS.map((sug) => {
                    const cleanSug = sug.replace(/^[\p{Emoji}\s]+/u, '').trim();
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setCustomSectorQuery(cleanSug)}
                        className="text-[10px] px-2.5 py-1 rounded-md bg-muted hover:bg-primary/10 hover:text-primary border border-border/60 text-muted-foreground transition-colors cursor-pointer"
                      >
                        {sug}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Category Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  {SECTOR_CATEGORIES.map((cat) => {
                    const isActive = sectorCategoryFilter === cat.id;
                    const count = cat.id === 'all'
                      ? LOCAL_SECTOR_OPTIONS.length
                      : LOCAL_SECTOR_OPTIONS.filter((s) => s.category === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSectorCategoryFilter(cat.id)}
                        className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-all shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                            : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        {cat.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Refined Cards Grid with Rich Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                  {LOCAL_SECTOR_OPTIONS.filter((sec) =>
                    sectorCategoryFilter === 'all' ? true : sec.category === sectorCategoryFilter
                  ).map((sec) => {
                    const isSelected = selectedSector === sec.value;
                    const IconComp = (sec.iconName && SECTOR_ICON_MAP[sec.iconName]) || Building2;
                    const color = SECTOR_COLOR_MAP[sec.value] || {
                      bg: 'bg-primary/10',
                      text: 'text-primary',
                      border: 'border-primary/20',
                      activeBorder: 'border-primary',
                      badge: 'bg-primary/15 text-primary',
                    };

                    return (
                      <button
                        key={sec.value}
                        type="button"
                        disabled={isScanning}
                        onClick={() => {
                          setSelectedSector(sec.value);
                          if (SECTORS_DEFAULT_WITH_WEBSITE.has(sec.value)) {
                            setOnlyNoWebsite(false);
                          } else {
                            setOnlyNoWebsite(true);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between gap-2.5 cursor-pointer group relative ${
                          isSelected
                            ? 'border-primary bg-primary/[0.08] dark:bg-primary/[0.14] ring-2 ring-primary/40 shadow-xs'
                            : 'border-border/70 bg-card hover:bg-muted/50 hover:border-primary/40'
                        }`}
                      >
                        {/* Top: Icon + Title + Badge + Check */}
                        <div className="flex items-start justify-between gap-2 w-full">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`p-2 rounded-lg ${color.bg} ${color.text} shrink-0 transition-transform group-hover:scale-105 shadow-2xs`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-xs text-foreground leading-snug group-hover:text-primary transition-colors">
                                {sec.label}
                              </h4>
                              {sec.badge && (
                                <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded mt-0.5 ${color.badge}`}>
                                  {sec.badge}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Selected check indicator */}
                          <div className="shrink-0 mt-0.5">
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-primary fill-primary/20" />
                            ) : (
                              <span className="w-4 h-4 rounded-full border border-border/80 block group-hover:border-primary/50 transition-colors" />
                            )}
                          </div>
                        </div>

                        {/* Middle: Details / Business Description */}
                        {sec.description && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {sec.description}
                          </p>
                        )}

                        {/* Bottom: Examples Chip */}
                        {sec.examples && (
                          <div className="text-[10px] text-foreground/80 font-medium bg-muted/60 dark:bg-muted/40 px-2 py-1 rounded-md flex items-center gap-1.5 w-full truncate border border-border/40">
                            <span className="text-muted-foreground shrink-0 font-semibold">🎯 Target:</span>
                            <span className="truncate">{sec.examples}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Sector Summary Info */}
                <div className="flex items-center justify-between text-[11px] px-3 py-2 rounded-lg bg-primary/[0.05] border border-primary/20 text-muted-foreground">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                    <span className="text-foreground font-semibold shrink-0">Selected Sector:</span>
                    <span className="text-primary font-bold truncate">{sectorLabel}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                    Strict keyword locked
                  </span>
                </div>
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
                    <strong className="text-foreground">{isAllIndia ? 'India' : (isAllDistricts ? effectiveStateLabel : `${effectiveDistrictLabel}, ${effectiveStateLabel}`)}</strong> ke aise local businesses save honge jin ke paas verified phone hai par <strong>koi website nahi hai</strong>.
                  </>
                ) : (
                  <>
                    Companies whose physical address, phone code, or business topic does NOT strictly match{' '}
                    <strong className="text-foreground">{isAllIndia ? 'India' : (isAllDistricts ? effectiveStateLabel : `${effectiveDistrictLabel}, ${effectiveStateLabel}`)}</strong> and{' '}
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

          {/* Related Sector Fallback (Auto-expand to sister sectors if target count is not fulfilled) */}
          <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    Auto-Expand to Related Sectors
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">
                    Recommended
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Agar selected sector ({sectorLabel}) me target leads kam padti hain, to AI automatically related sister sectors ({sectorObj?.category || 'Allied'}) se leads fetch karega.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoExpandRelated(!autoExpandRelated)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoExpandRelated ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autoExpandRelated ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
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
            Target: <strong className="text-foreground">{isAllIndia ? 'All India' : (isAllDistricts ? `All Districts (${effectiveStateLabel})` : `${effectiveDistrictLabel}, ${effectiveStateLabel}`)}</strong> • {sectorLabel} •{' '}
            <strong className="text-primary">{isCustomCount ? customCountInput || 10 : leadCount} Leads</strong>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isScanning ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleModalClose(false)}
                  className="h-9 text-xs rounded-lg cursor-pointer border-primary/40 text-primary hover:bg-primary/10 font-semibold"
                >
                  Run in Background
                </Button>
                <Button
                  size="sm"
                  disabled
                  className="h-9 text-xs gap-1.5 rounded-lg font-semibold bg-primary/80 text-primary-foreground shadow-xs cursor-not-allowed px-4"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Scanning Leads ({countdown !== null ? `${countdown}s` : 'active'})...
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-9 text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleTriggerScan}
                  className="h-9 text-xs gap-1.5 rounded-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer px-4"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Start Discovery ({isCustomCount ? customCountInput || 10 : leadCount} Leads)
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
