export type LeadCallStatus =
  | 'not_called'
  | 'called_connected'
  | 'meeting_scheduled'
  | 'follow_up'
  | 'converted'
  | 'not_interested';

export interface AssignedProfile {
  id: string;
  name: string | null;
  email: string;
  empId?: string | null;
  avatarUrl?: string | null;
  role?: string;
  department?: string | null;
}

export interface LeadCallLog {
  id: string;
  leadId: number;
  userId: string;
  user?: {
    id: string;
    name: string | null;
    avatarUrl?: string | null;
  };
  status: LeadCallStatus;
  remarks?: string | null;
  scheduledAt?: string | null;
  createdAt: string;
}

export interface ClientNeeds {
  pain_points?: string[];
  current_pain_points_and_gaps?: string[];
  recommended_solution?: string;
  hardware_needs?: string;
  calling_talking_points?: string[];
}

export interface Lead {
  id: number;
  companyName: string;
  websiteUrl?: string | null;
  googleMapsUrl?: string | null;
  domain?: string | null;
  industrySector?: string | null;
  businessSummary?: string | null;
  techStack: string[] | any;
  authorizedPersonName?: string | null;
  authorizedPersonRole?: string | null;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  whatsappNumber?: string | null;
  officeAddress?: string | null;
  city?: string | null;
  leadScore: number;
  clientNeeds?: ClientNeeds | null;
  recommendedSolution?: string | null;
  
  // Assignment & Tracking
  assignedToId?: string | null;
  assignedTo?: AssignedProfile | null;
  assignedById?: string | null;
  assignedBy?: { id: string; name: string | null; email: string } | null;
  assignedAt?: string | null;
  assignmentNotes?: string | null;

  // Outreach
  status?: string;
  callStatus: LeadCallStatus;
  callNotes?: string | null;
  lastCalledAt?: string | null;
  isArchived?: boolean;

  callLogs?: LeadCallLog[];
  _count?: {
    callLogs: number;
  };
  scanBatch?: {
    id: string;
    query: string;
    sector?: string | null;
    city?: string | null;
    state?: string | null;
    source?: string;
    createdAt: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScanBatchOption {
  id: string;
  query: string;
  sector?: string | null;
  city?: string | null;
  state?: string | null;
  leadsFound: number;
  createdAt: string;
}

export interface LeadStatsOverview {
  totalLeads: number;
  unassignedLeads: number;
  assignedLeads: number;
  statusBreakdown: Record<string, number>;
  employeeStats: Array<{
    employee: {
      id: string;
      name: string | null;
      email?: string;
      empId?: string | null;
      avatarUrl?: string | null;
    };
    totalAssigned: number;
  }>;
}

export type ScanLogStatus = 'running' | 'completed' | 'no_leads' | 'failed';

export interface LeadScanLog {
  id: string;
  jobId?: string | null;
  userId?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role?: string;
    avatarUrl?: string | null;
    department?: string | null;
  } | null;
  query: string;
  sector?: string | null;
  city?: string | null;
  state?: string | null;
  source: string;
  targetCount: number;
  leadsFound: number;
  status: ScanLogStatus;
  message?: string | null;
  errorMessage?: string | null;
  discoveredLeads?: string[] | any;
  createdAt: string;
  completedAt?: string | null;
}

export interface ScanLogsSummary {
  totalRequests: number;
  successfulScans: number;
  zeroLeadsScans: number;
  runningScans: number;
  failedScans: number;
  totalLeadsGenerated: number;
}

