import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2, PlayCircle, Calendar, ShieldAlert } from 'lucide-react';
import api from '@/lib/api';

interface AttendanceRecord {
  id: string;
  userId: string;
  checkInTime: string;
  checkOutTime: string;
  workedMinutes: number;
  workedHours: string;
  configuredWorkingHours: number;
  attendanceStatus: string;
  statusDisplay: string;
  invalidReason?: string;
}

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
}

export default function AttendanceHistoryModal({ isOpen, onClose, userId, userName }: AttendanceHistoryModalProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = userId ? `/attendance/history?userId=${userId}` : `/attendance/history`;
      const res = await api.get(endpoint);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setRecords(res.data.data);
      } else {
        setError("Failed to load attendance records.");
      }
    } catch (err: any) {
      console.error("Error fetching attendance history:", err);
      setError(err.response?.data?.message || "Could not fetch attendance history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, userId]);

  const formatDate = (isoString: string) => {
    if (!isoString || isoString === "-") return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return isoString;
    }
  };

  const formatTime = (isoString: string) => {
    if (!isoString || isoString === "-") return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-slate-900/95 border-slate-800 text-white rounded-2xl backdrop-blur-xl shadow-2xl p-6">
        <DialogHeader className="pb-4 border-b border-slate-800 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-violet-400" />
              Attendance History & Policy Log {userName ? `(${userName})` : ""}
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              Review session timelines and compliance with maximum working hours limits.
            </p>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm">Loading attendance records...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-center">
              <Calendar className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-semibold text-slate-400">No attendance records found</p>
              <p className="text-xs text-slate-500 mt-1">Sessions will appear here once you perform Check In / Check Out.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((rec) => {
                const isMissed = rec.attendanceStatus === "MISSED_CHECKOUT";
                const isActive = rec.attendanceStatus === "ACTIVE";
                const isCompleted = rec.attendanceStatus === "COMPLETED";

                return (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isMissed
                        ? "bg-red-950/20 border-red-500/30 dark:bg-red-950/10"
                        : isActive
                        ? "bg-violet-950/20 border-violet-500/30 dark:bg-violet-950/10"
                        : "bg-slate-800/40 border-slate-700/50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {isMissed && <ShieldAlert className="h-5 w-5 text-red-400" />}
                          {isActive && <PlayCircle className="h-5 w-5 text-violet-400 animate-pulse" />}
                          {isCompleted && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{formatDate(rec.checkInTime)}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-bold tracking-wider ${
                                isMissed
                                  ? "border-red-500/40 text-red-400 bg-red-500/10"
                                  : isActive
                                  ? "border-violet-500/40 text-violet-300 bg-violet-500/10"
                                  : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                              }`}
                            >
                              {rec.statusDisplay}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-1.5">
                            <div>
                              <span className="text-slate-500 mr-1">Check In:</span>
                              <span className="font-medium text-slate-300">{formatTime(rec.checkInTime)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 mr-1">Check Out:</span>
                              <span className="font-medium text-slate-300">{formatTime(rec.checkOutTime)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 mr-1">Max Policy Limit:</span>
                              <span className="font-medium text-slate-300">{rec.configuredWorkingHours}h</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end sm:border-l sm:border-slate-700/50 sm:pl-4">
                        <span className="text-xs text-slate-400">Worked Duration</span>
                        <span className={`text-base font-bold ${isMissed ? "text-red-400" : "text-white"}`}>
                          {rec.workedHours}
                        </span>
                      </div>
                    </div>

                    {isMissed && rec.invalidReason && (
                      <div className="mt-3 pt-3 border-t border-red-500/20 flex items-center gap-2 text-xs text-red-300/90">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                        <span>{rec.invalidReason}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
