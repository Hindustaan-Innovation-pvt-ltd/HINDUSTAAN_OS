import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  PhoneCall,
  CalendarCheck,
  TrendingUp,
  Inbox,
  UserCheck,
  Building,
} from 'lucide-react';
import type { LeadStatsOverview } from '../types/lead.types';

interface LeadTrackingStatsProps {
  stats: LeadStatsOverview | null;
  loading?: boolean;
  onFilterEmployee?: (empId: string) => void;
  selectedEmployeeFilter?: string;
}

export const LeadTrackingStats: React.FC<LeadTrackingStatsProps> = ({
  stats,
  loading = false,
  onFilterEmployee,
  selectedEmployeeFilter,
}) => {
  if (!stats && loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse bg-muted/40 h-24 border-border/50" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const {
    totalLeads = 0,
    unassignedLeads = 0,
    assignedLeads = 0,
    statusBreakdown = {},
    employeeStats = [],
  } = stats;

  const meetings = statusBreakdown['meeting_scheduled'] || 0;
  const converted = statusBreakdown['converted'] || 0;
  const connected = statusBreakdown['called_connected'] || 0;

  return (
    <div className="space-y-4 mb-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Leads */}
        <Card className="border-border/60 bg-card hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Leads
              </p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-foreground">
                {totalLeads}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Discovered by AI Engine</p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Building className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Assigned Queue */}
        <Card className="border-border/60 bg-card hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assigned to Team
              </p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-emerald-600 dark:text-emerald-400">
                {assignedLeads}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {unassignedLeads} unassigned in queue
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Connected Calls */}
        <Card className="border-border/60 bg-card hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Connected Calls
              </p>
              <h3 className="text-2xl font-bold tracking-tight mt-1 text-sky-600 dark:text-sky-400">
                {connected}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Spoke with Decision Maker</p>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <PhoneCall className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Meetings & Converted */}
        <Card className="border-border/60 bg-card hover:shadow-md transition-all">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Meetings / Deals
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                  {meetings}
                </h3>
                {converted > 0 && (
                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                    +{converted} Won
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">Scheduled Demos & Discovery</p>
            </div>
            <div className="p-3 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Assignment Tracking Bar */}
      {employeeStats.length > 0 && onFilterEmployee && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border/60 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap flex items-center gap-1.5 pl-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            Tracking by Employee:
          </span>
          <button
            onClick={() => onFilterEmployee('')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
              !selectedEmployeeFilter
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background hover:bg-muted text-foreground border-border/80'
            }`}
          >
            All Team ({assignedLeads})
          </button>
          <button
            onClick={() => onFilterEmployee('unassigned')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
              selectedEmployeeFilter === 'unassigned'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-background hover:bg-muted text-foreground border-border/80'
            }`}
          >
            Unassigned ({unassignedLeads})
          </button>
          {employeeStats.map((item) => {
            const isSelected = selectedEmployeeFilter === item.employee.id;
            return (
              <button
                key={item.employee.id}
                onClick={() => onFilterEmployee(item.employee.id)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background hover:bg-muted text-foreground border-border/80'
                }`}
              >
                <Avatar className="w-4 h-4 border">
                  <AvatarImage src={item.employee.avatarUrl || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {item.employee.name?.slice(0, 2).toUpperCase() || 'EM'}
                  </AvatarFallback>
                </Avatar>
                <span>{item.employee.name}</span>
                <Badge
                  variant="secondary"
                  className={`text-[10px] px-1.5 py-0 font-bold ${
                    isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : ''
                  }`}
                >
                  {item.totalAssigned}
                </Badge>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
