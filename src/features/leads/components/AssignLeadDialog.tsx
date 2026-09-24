import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Loader2, ArrowRightLeft, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import type { Lead } from '../types/lead.types';

interface AssignLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onAssigned?: (updatedLead: Lead) => void;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  department?: string;
}

export const AssignLeadDialog: React.FC<AssignLeadDialogProps> = ({
  open,
  onOpenChange,
  lead,
  onAssigned,
}) => {
  const [employees, setEmployees] = useState<TeamMember[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loadingEmployees, setLoadingEmployees] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      fetchTeamMembers();
      if (lead?.assignedToId) {
        setSelectedEmployeeId(lead.assignedToId);
      } else {
        setSelectedEmployeeId('');
      }
      setNotes(lead?.assignmentNotes || '');
    }
  }, [open, lead]);

  const fetchTeamMembers = async () => {
    try {
      setLoadingEmployees(true);
      const res = await api.get('/team');
      const data = res.data?.data || res.data || [];
      // Include employees and interns
      const team = data.filter((m: any) =>
        ['employee', 'intern'].includes((m.role || '').toLowerCase())
      );
      setEmployees(team);
    } catch (err: any) {
      console.error('Failed to load team members:', err);
      toast.error('Failed to load employee list');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleAssign = async () => {
    if (!lead) return;
    if (!selectedEmployeeId) {
      toast.error('Please select an employee to transfer this lead to');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/leads/${lead.id}/assign`, {
        employeeId: selectedEmployeeId,
        notes: notes.trim(),
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Lead assigned successfully!');
        if (onAssigned) {
          onAssigned(res.data.data);
        }
        onOpenChange(false);
      } else {
        toast.error(res.data?.message || 'Failed to assign lead');
      }
    } catch (err: any) {
      console.error('Error assigning lead:', err);
      toast.error(err.response?.data?.message || 'Server error while assigning lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Transfer / Assign Lead</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign client outreach responsibility to a sales rep or intern.
              </p>
            </div>
          </div>
        </DialogHeader>

        {lead && (
          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">{lead.companyName}</span>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                Score: {Math.round(lead.leadScore || 0)}/100
              </Badge>
            </div>
            {lead.authorizedPersonName && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Target: </span>
                {lead.authorizedPersonName} ({lead.authorizedPersonRole || 'Executive'})
              </div>
            )}
            {lead.assignedTo && (
              <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1 border-t border-border/40">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Currently assigned to: <strong>{lead.assignedTo.name}</strong></span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Assignee (Sales Rep / Intern)
            </label>
            {loadingEmployees ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Loading team members...
              </div>
            ) : (
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an employee to assign..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2 py-0.5">
                        <Avatar className="w-6 h-6 border">
                          <AvatarImage src={emp.avatarUrl} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {emp.name ? emp.name.slice(0, 2).toUpperCase() : 'EM'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-xs">{emp.name}</span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          ({emp.role})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Outreach Instructions / Priority Notes (Optional)
            </label>
            <Textarea
              placeholder="e.g. Call this client today before 3 PM. Focus on custom ERP & WhatsApp bot pitch."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAssign}
            disabled={submitting || !selectedEmployeeId}
            className="gap-2 font-semibold shadow-md"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                Transfer Lead
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
