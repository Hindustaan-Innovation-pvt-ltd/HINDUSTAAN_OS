import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2, PlayCircle, Calendar, ShieldAlert, Search, X } from 'lucide-react';
import api from '@/lib/api';
import { useUser } from '@/context/UserContext';

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
  userName?: string;
  userRole?: string;
  userEmail?: string;
}

interface AttendanceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
}

export default function AttendanceHistoryModal({ isOpen, onClose, userId, userName }: AttendanceHistoryModalProps) {
  const { user } = useUser();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Admin tabs
  const [adminTab, setAdminTab] = useState<'managers' | 'interns'>('interns');
  const [managerSearch, setManagerSearch] = useState('');
  const [internSearch, setInternSearch] = useState('');

  // Manager tabs
  const [managerTab, setManagerTab] = useState<'interns' | 'my'>('interns');
  const [managerInternSearch, setManagerInternSearch] = useState('');

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
      setError(err.response?.data?.message || "Could not fetch attendance history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen, userId]);

  const filteredRecords = records.filter(rec => {
    if (user?.role === 'admin') {
      if (adminTab === 'managers') {
        if (rec.userRole !== 'manager') return false;
        if (managerSearch.trim()) {
          return rec.userName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                 rec.userEmail?.toLowerCase().includes(managerSearch.toLowerCase());
        }
        return true;
      } else {
        if (rec.userRole !== 'intern') return false;
        if (internSearch.trim()) {
          return rec.userName?.toLowerCase().includes(internSearch.toLowerCase()) ||
                 rec.userEmail?.toLowerCase().includes(internSearch.toLowerCase());
        }
        return true;
      }
    }
    if (user?.role === 'manager') {
      if (managerTab === 'interns') {
        if (rec.userRole !== 'intern') return false;
        if (managerInternSearch.trim()) {
          return rec.userName?.toLowerCase().includes(managerInternSearch.toLowerCase()) ||
                 rec.userEmail?.toLowerCase().includes(managerInternSearch.toLowerCase());
        }
        return true;
      }
      return rec.userId === user?.id;
    }
    return true;
  });

  const uniqueManagers = [...new Set(records.filter(r => r.userRole === 'manager').map(r => r.userName).filter(Boolean))];
  const uniqueInterns = [...new Set(records.filter(r => r.userRole === 'intern').map(r => r.userName).filter(Boolean))];

  const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div className="relative mt-2">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const tabClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${active ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-slate-800 text-slate-400 hover:text-white'}`;

  const CountBadge = ({ count }: { count: number }) =>
    count > 0 ? <span className="ml-1.5 bg-violet-500/30 text-violet-200 px-1.5 rounded text-[10px]">{count}</span> : null;

  const formatDate = (isoString: string) => {
    if (!isoString || isoString === "-") return "-";
    try {
      return new Date(isoString).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
    } catch { return isoString; }
  };

  const formatTime = (isoString: string) => {
    if (!isoString || isoString === "-") return "-";
    try {
      return new Date(isoString).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return isoString; }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-slate-900/95 border-slate-800 text-white rounded-2xl backdrop-blur-xl shadow-2xl p-6">
        <DialogHeader className="pb-4 border-b border-slate-800">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
            <Clock className="h-5 w-5 text-violet-400" />
            Attendance History & Policy Log {userName ? `(${userName})` : ""}
          </DialogTitle>
          <p className="text-xs text-slate-400 mt-1">
            Review session timelines and compliance with maximum working hours limits.
          </p>
        </DialogHeader>

        {/* ── ADMIN FILTERS ── */}
        {user?.role === 'admin' && (
          <div className="flex flex-col gap-2 pt-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button className={tabClass(adminTab === 'managers')} onClick={() => { setAdminTab('managers'); setManagerSearch(''); }}>
                All Managers <CountBadge count={uniqueManagers.length} />
              </button>
              <button className={tabClass(adminTab === 'interns')} onClick={() => { setAdminTab('interns'); setInternSearch(''); }}>
                All Interns <CountBadge count={uniqueInterns.length} />
              </button>
            </div>
            {adminTab === 'managers' && (
              <SearchBar value={managerSearch} onChange={setManagerSearch} placeholder="Search manager by name or email..." />
            )}
            {adminTab === 'interns' && (
              <SearchBar value={internSearch} onChange={setInternSearch} placeholder="Search intern by name or email..." />
            )}
          </div>
        )}

        {/* ── MANAGER FILTERS ── */}
        {user?.role === 'manager' && (
          <div className="flex flex-col gap-2 pt-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button className={tabClass(managerTab === 'interns')} onClick={() => { setManagerTab('interns'); setManagerInternSearch(''); }}>
                All Interns <CountBadge count={uniqueInterns.length} />
              </button>
              <button className={tabClass(managerTab === 'my')} onClick={() => { setManagerTab('my'); setManagerInternSearch(''); }}>
                My Attendance
              </button>
            </div>
            {managerTab === 'interns' && (
              <SearchBar value={managerInternSearch} onChange={setManagerInternSearch} placeholder="Search intern by name or email..." />
            )}
          </div>
        )}

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
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-center">
              <Calendar className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm font-semibold text-slate-400">No attendance records found</p>
              <p className="text-xs text-slate-500 mt-1">Sessions will appear here once you perform Check In / Check Out.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((rec) => {
                const isMissed = rec.attendanceStatus === "MISSED_CHECKOUT";
                const isActive = rec.attendanceStatus === "ACTIVE";
                const isCompleted = rec.attendanceStatus === "COMPLETED";

                return (
                  <div
                    key={rec.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isMissed
                        ? "bg-red-950/20 border-red-500/30"
                        : isActive
                        ? "bg-violet-950/20 border-violet-500/30"
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-white">{formatDate(rec.checkInTime)}</span>
                            {rec.userName && (
                              <span className="text-xs font-bold text-violet-300 bg-violet-500/15 px-2.5 py-0.5 rounded-md border border-violet-500/30">
                                {rec.userName} {rec.userRole ? `(${rec.userRole})` : ''}
                              </span>
                            )}
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
