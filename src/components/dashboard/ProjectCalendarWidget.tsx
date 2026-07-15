import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  MoreVertical, 
  Plus, 
  Video, 
  Clock, 
  Flag, 
  CheckCircle2,
  Settings
} from 'lucide-react';
import { format, isSameDay, isBefore, isAfter, startOfDay, addDays, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import { useNotifications } from '@/context/NotificationContext';
import { PremiumTimePicker } from '@/components/ui/premium-time-picker';
import { ProjectDatePicker } from '@/components/ui/project-date-picker';

// Data Structures
type EventType = 'deadline' | 'completed' | 'milestone' | 'leave' | 'meeting';

const formatTimeForDisplay = (timeStr: string) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hours12 = h % 12 || 12;
  return `${hours12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const to24HourFormat = (timeStr: string) => {
  if (!timeStr) return '09:00';
  if (!timeStr.includes('AM') && !timeStr.includes('PM')) return timeStr;
  const [time, modifier] = timeStr.split(' ');
  if (!time || !modifier) return '09:00';
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

interface ProjectEvent {
  id: string;
  date: Date;
  type: EventType;
  title: string;
  description?: string;
  time?: string;
  assignees?: { name: string; initials: string }[];
}

const DEFAULT_START_DATE = new Date(2026, 6, 1); // July 1, 2026
const DEFAULT_END_DATE = new Date(2026, 9, 1); // October 1, 2026

const MOCK_EVENTS: ProjectEvent[] = [
  { id: '1', date: new Date(2026, 6, 12), type: 'deadline', title: 'Backend Deadline', assignees: [{ name: 'Rahul Sharma', initials: 'RS' }] },
  { id: '2', date: new Date(2026, 6, 15), type: 'milestone', title: 'Sprint Planning', assignees: [{ name: 'Amanda Smith', initials: 'AS' }] },
  { id: '3', date: new Date(2026, 6, 5), type: 'completed', title: 'DB Schema Finalized', assignees: [{ name: 'Rahul Sharma', initials: 'RS' }] },
  { id: '4', date: new Date(2026, 6, 20), type: 'leave', title: 'Priya on Leave', assignees: [{ name: 'Priya Patel', initials: 'PP' }] },
  { id: '5', date: new Date(2026, 7, 1), type: 'milestone', title: 'Alpha Release', assignees: [{ name: 'Team', initials: 'TM' }] },
];

export function ProjectCalendarWidget() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<'event'|'meeting'>('event');

  const [startDate, setStartDate] = useState<Date>(() => {
    const saved = localStorage.getItem('hindustaan_project_start_date');
    return saved ? new Date(saved) : DEFAULT_START_DATE;
  });
  const [endDate, setEndDate] = useState<Date>(() => {
    const saved = localStorage.getItem('hindustaan_project_end_date');
    return saved ? new Date(saved) : DEFAULT_END_DATE;
  });
  const [events, setEvents] = useState<ProjectEvent[]>(() => {
    const saved = localStorage.getItem('hindustaan_calendar_events');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((e: any) => ({ ...e, date: new Date(e.date) }));
      } catch (e) {
        return MOCK_EVENTS;
      }
    }
    return MOCK_EVENTS;
  });

  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hindustaan_calendar_events' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setEvents(parsed.map((evt: any) => ({ ...evt, date: new Date(evt.date) })));
        } catch (err) {}
      }
    };
    const handleLocalUpdate = (e: CustomEvent) => {
      if (e.detail.key === 'hindustaan_calendar_events') {
        try {
          const parsed = typeof e.detail.value === 'string' ? JSON.parse(e.detail.value) : e.detail.value;
          if (Array.isArray(parsed)) {
            setEvents(parsed.map((evt: any) => ({ ...evt, date: new Date(evt.date) })));
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleLocalUpdate as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleLocalUpdate as EventListener);
    };
  }, []);

  const [isAllEventsOpen, setIsAllEventsOpen] = useState(false);
  const [eventToView, setEventToView] = useState<ProjectEvent | null>(null);
  const [eventToEdit, setEventToEdit] = useState<ProjectEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<ProjectEvent | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('09:00 AM');
  const [editTime, setEditTime] = useState('09:00 AM');
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
  const [editDate, setEditDate] = useState<Date>(new Date());

  const { addNotification } = useNotifications();

  const pushNotification = (title: string, message: string, type: any) => {
    addNotification({
      type: type,
      category: 'Projects',
      icon: type === 'alert' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️',
      title: title,
      message: message,
      group: 'Today',
    });
  };

  // Dynamic calculations based on today
  const today = new Date();

  // Ensure we render the correct default month. If today is outside the project range, show the nearest valid month.
  const initialMonth = isBefore(today, startDate) ? startDate : isAfter(today, endDate) ? endDate : today;
  const [month, setMonth] = useState<Date>(initialMonth);

  const totalDays = differenceInDays(endDate, startDate);
  const daysCompleted = isBefore(today, startDate) ? 0 : isAfter(today, endDate) ? totalDays : differenceInDays(today, startDate);
  const daysRemaining = Math.max(0, totalDays - daysCompleted);
  const progressPercent = totalDays > 0 ? Math.round((daysCompleted / totalDays) * 100) : 0;

  const workingDays = totalDays; // Simplification, could exclude weekends

  const upcomingEvents = useMemo(() => {
    // Keep events in "Upcoming" until 24 hours after their date
    const cutoffDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    return [...events]
      .filter(e => isAfter(e.date, cutoffDate))
      .reverse();
  }, [events, today]);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsSheetOpen(true);
  };

  const handleScheduleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const type = (formData.get('type') || (scheduleType === 'event' ? 'milestone' : 'sync')) as EventType;

    if (!title || !scheduleDate) return;

    const newEvent: ProjectEvent = {
      id: Math.random().toString(),
      date: new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate()),
      type: type,
      title: title,
      time: scheduleTime,
      assignees: [{ name: 'Current User', initials: 'CU' }]
    };

    const nextEvents = [...events, newEvent];
    setEvents(nextEvents);
    localStorage.setItem('hindustaan_calendar_events', JSON.stringify(nextEvents));
    window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key: 'hindustaan_calendar_events', value: nextEvents } }));

    toast.success(`${scheduleType === 'event' ? 'Event' : 'Meeting'} Scheduled Successfully`, {
      description: 'Your calendar has been updated with the new item.',
    });
    setIsScheduleOpen(false);
  };

  const handleBulkDelete = () => {
    if (selectedEventIds.length === 0) return;
    const nextEvents = events.filter(e => !selectedEventIds.includes(e.id));
    setEvents(nextEvents);
    localStorage.setItem('hindustaan_calendar_events', JSON.stringify(nextEvents));
    window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key: 'hindustaan_calendar_events', value: nextEvents } }));
    toast.success(`Deleted ${selectedEventIds.length} events successfully.`);
    setSelectedEventIds([]);
  };

  const handleSelectEvent = (id: string, e: React.SyntheticEvent) => {
    e.stopPropagation();
    setSelectedEventIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getDayEvents = (day: Date) => {
    return events.filter(e => isSameDay(e.date, day));
  };

  const getEventColor = (type: string) => {
    switch(type) {
      case 'deadline': return 'bg-rose-500';
      case 'meeting': return 'bg-blue-500';
      case 'milestone': return 'bg-purple-500';
      case 'completed': return 'bg-emerald-500';
      case 'leave': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getEventBadgeStyles = (type: string) => {
    switch(type) {
      case 'deadline': return 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10';
      case 'meeting': return 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10';
      case 'milestone': return 'text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-500/10';
      case 'completed': return 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10';
      case 'leave': return 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10';
      default: return 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-500/30 bg-slate-50 dark:bg-slate-500/10';
    }
  };

  return (
    <>
      <datalist id="event-types">
        <option value="milestone">Milestone</option>
        <option value="deadline">Deadline</option>
        <option value="meeting">Meeting</option>
        <option value="leave">Leave / OOO</option>
        <option value="sync">Sync</option>
        <option value="review">Review</option>
        <option value="brainstorm">Brainstorming</option>
      </datalist>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Timeline Settings</DialogTitle>
            <DialogDescription>
              Update the project's start and end dates.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="dark:text-slate-200 font-semibold">Start Date</Label>
              <Input 
                type="date" 
                className="dark:text-white dark:bg-slate-800/50 dark:border-slate-700 dark:[color-scheme:dark]"
                defaultValue={format(startDate, 'yyyy-MM-dd')} 
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime())) {
                    setStartDate(d);
                    localStorage.setItem('hindustaan_project_start_date', d.toISOString());
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label className="dark:text-slate-200 font-semibold">End Date</Label>
              <Input 
                type="date" 
                className="dark:text-white dark:bg-slate-800/50 dark:border-slate-700 dark:[color-scheme:dark]"
                defaultValue={format(endDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime())) {
                    setEndDate(d);
                    localStorage.setItem('hindustaan_project_end_date', d.toISOString());
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSettingsOpen(false)} className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-[#5B7CFF] dark:text-white dark:hover:bg-[#5B7CFF]/80 font-bold">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className="rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-lg shadow-slate-200/20 dark:shadow-none flex flex-col overflow-hidden bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
      <CardHeader className="pb-6 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-br from-orange-50/50 via-white to-rose-50/30 dark:from-orange-950/20 dark:via-slate-950 dark:to-rose-950/10 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-orange-500" />
              Project Timeline
            </CardTitle>
            <CardDescription 
              className="text-xs font-semibold mt-1 cursor-pointer hover:text-orange-600 dark:hover:text-orange-400 transition-colors flex items-center gap-1.5 border border-transparent hover:border-orange-200 dark:hover:border-orange-900/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 w-fit px-1.5 -ml-1.5 py-0.5 rounded-md"
              onClick={() => setIsSettingsOpen(true)}
              title="Click to change project dates"
            >
              {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
              <Settings className="h-3 w-3 opacity-50" />
            </CardDescription>
          </div>

          <div className="flex gap-2">
            <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 font-bold text-[10px] hidden sm:flex">
              Deadline Tomorrow
            </Badge>
          </div>
        </div>

        {/* Dashboard Summary */}
        <div className="grid grid-cols-3 gap-3 pt-5 mt-4 border-t border-slate-100/80 dark:border-slate-800/60 relative z-10">
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Working Days</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">{workingDays}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/30 shadow-sm">
            <span className="text-[10px] font-bold text-emerald-600/80 dark:text-emerald-500/80 uppercase tracking-wider mb-0.5">Completed</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{daysCompleted}</span>
          </div>
          <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100/50 dark:border-orange-900/30 shadow-sm">
            <span className="text-[10px] font-bold text-orange-600/80 dark:text-orange-500/80 uppercase tracking-wider mb-0.5">Remaining</span>
            <span className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">{daysRemaining}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 relative z-10">
          <div className="relative flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden shadow-inner">
            <Progress value={progressPercent} className="h-full bg-transparent [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:via-orange-400 [&>div]:to-rose-500" />
          </div>
          <span className="text-sm font-black text-slate-700 dark:text-slate-300 w-10 text-right">{progressPercent}%</span>
        </div>
      </CardHeader>

      <CardContent className="p-0 grid grid-cols-1 xl:grid-cols-2 h-full">
        {/* Left Side: Calendar & Legend */}
        <div className="p-4 sm:p-6 flex flex-col items-center border-b xl:border-b-0 xl:border-r border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950/20 w-full overflow-hidden">
          <TooltipProvider delayDuration={100}>
          <Calendar
            mode="single"
            selected={selectedDay}
            onSelect={(day) => day && handleDayClick(day)}
            month={month}
            onMonthChange={setMonth}
            startMonth={startDate}
            endMonth={endDate}
            className="rounded-2xl border border-slate-100/50 dark:border-slate-800/50 p-3 sm:p-5 bg-white/60 dark:bg-slate-950/60 shadow-lg shadow-slate-200/20 dark:shadow-none w-full flex justify-center backdrop-blur-md"
            classNames={{
              month_caption: "flex justify-center pt-1 pb-3 relative items-center w-full",
              day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105 transition-all duration-200 relative cursor-pointer outline-none focus:ring-2 focus:ring-orange-500/50",
              today: "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-500/30 shadow-sm",
              selected: "bg-gradient-to-br from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600 hover:text-white focus:from-orange-600 focus:to-rose-600 focus:text-white font-bold shadow-md shadow-orange-500/30 hover:scale-105 transition-all",
              weekday: "text-slate-400 dark:text-slate-500 rounded-md w-10 font-bold text-[0.75rem] uppercase tracking-wider",
              month: "w-full relative text-slate-900 dark:text-white",
              caption_label: "text-sm font-black text-slate-800 dark:text-slate-100 text-center",
              button_previous: "h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0 opacity-70 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white absolute left-1 flex items-center justify-center transition-all shadow-sm z-10",
              button_next: "h-8 w-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0 opacity-70 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white absolute right-1 flex items-center justify-center transition-all shadow-sm z-10",
            }}
            components={{
              DayButton: ({ day, modifiers, ...props }) => {
                const isToday = isSameDay(day.date, today);
                const events = getDayEvents(day.date);

                return (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        {...props}
                        className={cn(
                          "relative h-10 w-10 rounded-lg flex flex-col items-center justify-center font-semibold text-sm transition-all outline-none",
                          modifiers.selected ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : 
                          isToday ? "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30" : 
                          "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
                          modifiers.outside && "text-slate-300 dark:text-slate-600 cursor-default hover:bg-transparent"
                        )}
                        onClick={(e) => {
                          if (!modifiers.outside) {
                            if (props.onClick) props.onClick(e);
                            handleDayClick(day.date);
                          }
                        }}
                      >
                        <span>{day.date.getDate()}</span>

                        {/* Event Dots */}
                        {!modifiers.outside && events.length > 0 && (
                          <div className="absolute bottom-1 flex gap-0.5">
                            {events.slice(0, 3).map((e, i) => (
                              <div key={i} className={cn("h-1 w-1 rounded-full", getEventColor(e.type), modifiers.selected && "bg-white")} />
                            ))}
                            {events.length > 3 && <div className={cn("h-1 w-1 rounded-full bg-slate-400", modifiers.selected && "bg-white/70")} />}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>
                    {!modifiers.outside && (
                      <TooltipContent side="right" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium p-3 rounded-xl shadow-xl border-0 z-[100]">
                        <p className="font-bold mb-1 border-b border-slate-700 dark:border-slate-200 pb-1">{format(day.date, 'EEEE, MMM d')}</p>
                        {events.length > 0 ? (
                          <div className="space-y-1.5 mt-2">
                            {events.map((e, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs">
                                <div className={cn("h-2 w-2 rounded-full", getEventColor(e.type))} />
                                <span>{e.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">No scheduled events</p>
                        )}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              }
            }}
          />
        </TooltipProvider>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-orange-500" /><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Today</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Completed</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-rose-500" /><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Deadline</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-purple-500" /><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Milestone</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-400" /><span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Leave</span></div>
        </div>
        </div>

        {/* Right Side: Upcoming Events & Quick Actions */}
        <div className="p-4 sm:p-6 flex flex-col h-full bg-slate-50/30 dark:bg-slate-900/10 min-w-0 w-full overflow-hidden">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-orange-500" /> Upcoming Events
                </h4>
              </div>
              <div className="flex items-center gap-3">
                {isSelectionMode && selectedEventIds.length > 0 && (
                  <Button onClick={handleBulkDelete} size="sm" className="h-7 px-3 text-[10px] font-bold rounded-full shadow-sm bg-rose-500 hover:bg-rose-600 text-white dark:bg-rose-600 dark:hover:bg-rose-700 border-0">Delete ({selectedEventIds.length})</Button>
                )}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Select</span>
                  <Switch 
                    checked={isSelectionMode} 
                    onCheckedChange={(checked) => {
                      setIsSelectionMode(checked);
                      if (!checked) setSelectedEventIds([]);
                    }}
                    size="sm"
                    className="data-[state=checked]:bg-orange-500 data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-800 dark:border dark:border-slate-600 [&>span]:bg-white"
                  />
                </div>
                {!isSelectionMode && (
                  <Button onClick={() => setIsAllEventsOpen(true)} variant="outline" size="sm" className="h-7 px-3 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-full bg-white dark:bg-slate-900 shadow-sm hover:text-orange-600 dark:hover:text-orange-400 transition-all cursor-pointer">View History</Button>
                )}
              </div>
            </div>
            
            {isSelectionMode && upcomingEvents.length > 0 && (
              <div className="flex justify-start mb-3 pl-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    if (selectedEventIds.length === upcomingEvents.length) {
                      setSelectedEventIds([]);
                    } else {
                      setSelectedEventIds(upcomingEvents.map(e => e.id));
                    }
                  }}
                  className="h-7 text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full px-3"
                >
                  {upcomingEvents.length > 0 && selectedEventIds.length === upcomingEvents.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            )}
            
            <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
              {upcomingEvents.length > 0 ? upcomingEvents.map((evt) => (
                <div 
                  key={evt.id} 
                  onClick={(e) => isSelectionMode ? handleSelectEvent(evt.id, e) : setEventToView(evt)} 
                  className={cn(
                    "group relative flex items-center gap-3.5 p-3 rounded-2xl bg-white dark:bg-slate-950/80 shadow-sm border hover:shadow-md transition-all duration-300 pr-8 cursor-pointer",
                    isSelectionMode && selectedEventIds.includes(evt.id) ? "border-orange-500 dark:border-orange-500 shadow-orange-500/10" : "border-slate-100 dark:border-slate-800/80 hover:border-orange-200 dark:hover:border-orange-900/50 hover:-translate-y-0.5"
                  )}
                >
                  {isSelectionMode && (
                    <div className="pl-1 flex items-center h-full">
                      {selectedEventIds.includes(evt.id) ? (
                        <CheckCircle2 className="h-5 w-5 text-orange-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-orange-400 transition-colors" />
                      )}
                    </div>
                  )}
                  <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/30 dark:to-orange-900/10 shrink-0 border border-orange-100/50 dark:border-orange-500/20 shadow-inner">
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase leading-none mb-0.5 tracking-wider">{format(evt.date, 'MMM')}</span>
                    <span className="text-sm font-black text-orange-700 dark:text-orange-300 leading-none">{format(evt.date, 'dd')}</span>
                  </div>
                  <div className="flex flex-col overflow-hidden flex-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{evt.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("h-1.5 w-1.5 rounded-full", getEventColor(evt.type))} />
                        <span className="text-[10px] font-semibold text-slate-500 capitalize">{evt.type}</span>
                      </div>
                      {evt.time && (
                        <>
                          <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded leading-none">{formatTimeForDisplay(evt.time)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEventToEdit(evt); }} className="font-semibold text-sm cursor-pointer">
                        Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEventToDelete(evt); }} className="font-semibold text-sm text-rose-600 focus:text-rose-600 cursor-pointer">
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )) : (
                <div className="text-xs text-slate-500 italic p-4 text-center bg-white dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">No upcoming events.</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/60 relative">
            <Button 
              onClick={() => { setScheduleType('event'); setIsScheduleOpen(true); }}
              variant="outline" 
              size="sm" 
              className="flex-1 rounded-xl border border-orange-200 dark:border-orange-900/30 text-orange-700 dark:text-orange-300 font-bold h-11 bg-gradient-to-b from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-900 hover:from-orange-100 hover:to-orange-50 dark:hover:from-orange-800/30 dark:hover:to-orange-900/20 shadow-sm hover:shadow transition-all whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4 text-orange-500" /> New Event
            </Button>
            <Button 
              onClick={() => { setScheduleType('meeting'); setIsScheduleOpen(true); }}
              variant="outline" 
              size="sm" 
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold h-11 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm hover:shadow transition-all whitespace-nowrap"
            >
              <Video className="mr-2 h-4 w-4 text-blue-500" /> Sync Meeting
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Side Sheet for Day Details */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 p-0 flex flex-col shadow-2xl">
          {selectedDay && (
            <>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white">
                    {format(selectedDay, 'EEEE')}
                  </SheetTitle>
                  <SheetDescription className="text-sm font-bold text-slate-500 flex items-center">
                    <CalendarIcon className="mr-1.5 h-4 w-4" />
                    {format(selectedDay, 'MMMM d, yyyy')}
                  </SheetDescription>
                </SheetHeader>
              </div>

              <ScrollArea className="flex-1 p-6">
                <div className="space-y-8 pb-10">

                  {/* Events Section */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                      <Flag className="mr-2 h-4 w-4 text-orange-500" />
                      Scheduled Events
                    </h3>
                    {getDayEvents(selectedDay).length > 0 ? (
                      <div className="space-y-3">
                        {getDayEvents(selectedDay).map(evt => (
                          <Card key={evt.id} className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="flex items-center">
                              <div className={cn("w-1.5 h-16 shrink-0", getEventColor(evt.type))} />
                              <div className="p-3 flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{evt.title}</h4>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{evt.type}</span>
                                        {evt.time && (
                                          <>
                                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">{evt.time}</span>
                                          </>
                                        )}
                                      </div>
                                  </div>
                                  {evt.assignees && (
                                    <div className="flex -space-x-1.5">
                                      {evt.assignees.map((a, i) => (
                                        <Avatar key={i} className="h-6 w-6 border-2 border-white dark:border-slate-900">
                                          <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-[8px] font-bold">{a.initials}</AvatarFallback>
                                        </Avatar>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="h-6 w-6 text-slate-300 dark:text-slate-600 mb-2" />
                        <span className="text-sm font-semibold text-slate-500">No events scheduled.</span>
                        <Button variant="link" className="text-orange-500 h-auto p-0 mt-1 text-xs font-bold">Schedule something</Button>
                      </div>
                    )}
                  </div>

                  {/* Activity/Work Logs placeholder */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-orange-500" />
                      Work Logs & Standups
                    </h3>
                    <div className="space-y-3">
                      {isBefore(selectedDay, startOfDay(new Date())) ? (
                         <div className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg font-medium">
                           3 standups submitted. 24 hours logged across team.
                         </div>
                      ) : (
                         <div className="text-sm text-slate-400 italic p-3 text-center border border-slate-100 dark:border-slate-800 rounded-lg">
                           Logs will appear after end of day.
                         </div>
                      )}
                    </div>
                  </div>

                </div>
              </ScrollArea>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950">
                <Button onClick={() => setIsSheetOpen(false)} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md">
                  Close Details
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] bg-white dark:bg-slate-950 rounded-3xl">
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 px-6 py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              {scheduleType === 'event' ? <CalendarIcon className="w-32 h-32 transform rotate-12 translate-x-4 -translate-y-4 text-white" /> : <Video className="w-32 h-32 transform rotate-12 translate-x-4 -translate-y-4 text-white" />}
            </div>
            <DialogHeader className="relative z-10 text-left">
              <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                  {scheduleType === 'event' ? <CalendarIcon className="h-6 w-6 text-white" /> : <Video className="h-6 w-6 text-white" />}
                </div>
                Schedule {scheduleType === 'event' ? 'New Event' : 'Team Meeting'}
              </DialogTitle>
              <DialogDescription className="text-white/80 font-medium text-sm mt-3 leading-relaxed">
                Add a new {scheduleType} to the project calendar. It will be visible to all assignees.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <form onSubmit={handleScheduleSubmit} className="p-6 space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="title" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Title</Label>
              <Input id="title" name="title" placeholder={scheduleType === 'event' ? "e.g. Q3 Roadmap Review" : "e.g. Weekly Standup Sync"} required className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500/30 focus-visible:border-orange-500 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white transition-all duration-300 shadow-sm text-base font-semibold" />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2.5 relative">
                <Label htmlFor="date" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</Label>
                <ProjectDatePicker name="date" value={scheduleDate} onChange={(d) => d && setScheduleDate(d)} className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500/30 focus-visible:border-orange-500 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white transition-all duration-300 shadow-sm pl-4 font-semibold" />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="time" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</Label>
                <PremiumTimePicker name="time" value={scheduleTime} onChange={setScheduleTime} />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Type</Label>
              <div className="relative group">
                <Input name="type" list="event-types" defaultValue={scheduleType === 'event' ? 'milestone' : 'sync'} className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500/30 focus-visible:border-orange-500 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white transition-all duration-300 shadow-sm pl-12 font-semibold" placeholder="e.g. Milestone, Launch..." />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 pointer-events-none group-hover:scale-110 transition-transform">
                  <Flag className="h-4 w-4 text-orange-500" />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 sm:justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsScheduleOpen(false)} className="rounded-xl font-bold h-12 px-6 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl h-12 px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black shadow-[0_8px_20px_-8px_rgba(249,115,22,0.6)] hover:shadow-[0_12px_25px_-8px_rgba(249,115,22,0.8)] transition-all duration-300 hover:-translate-y-0.5 border-0">
                Schedule {scheduleType === 'event' ? 'Event' : 'Meeting'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Event History Modal */}
      <Dialog open={isAllEventsOpen} onOpenChange={setIsAllEventsOpen}>
        <DialogContent className="sm:max-w-[425px] md:max-w-[600px] rounded-3xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl">
          <div className="bg-slate-50/50 dark:bg-slate-900/20 p-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
                <Clock className="mr-3 h-6 w-6 text-orange-500" />
                Event History
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium pt-1">
                View all past and upcoming events, deadlines, and milestones.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 pt-4">
            <ScrollArea className="max-h-[50vh] pr-4">
              <div className="space-y-4">
                {[...events]
                  .sort((a, b) => b.date.getTime() - a.date.getTime())
                  .map((evt) => {
                    const isPast = isBefore(evt.date, startOfDay(today));
                    return (
                    <div key={evt.id} className={cn("flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 rounded-xl border transition-all", isPast ? "bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/50 opacity-80" : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-500/30")}>
                      <div className="flex flex-col items-center justify-center h-14 w-14 rounded-xl bg-white dark:bg-slate-950 shadow-sm border border-slate-200 dark:border-slate-800 shrink-0">
                        <span className={cn("text-[10px] font-bold uppercase leading-none", isPast ? "text-slate-400 dark:text-slate-500" : "text-slate-500 dark:text-slate-400")}>{format(evt.date, 'MMM')}</span>
                        <span className={cn("text-lg font-black leading-none mt-1", isPast ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-white")}>{format(evt.date, 'dd')}</span>
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-bold", isPast ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white")}>{evt.title}</span>
                          {isPast && <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 py-0 h-4 border-slate-200 dark:border-slate-700">Past</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider", getEventBadgeStyles(evt.type))}>
                            {evt.type}
                          </Badge>
                          {evt.time && (
                            <span className="text-xs font-semibold text-slate-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" /> {evt.time}
                            </span>
                          )}
                        </div>
                      </div>
                      {evt.assignees && evt.assignees.length > 0 && (
                        <div className="flex -space-x-2 mt-3 sm:mt-0 mr-2">
                          {evt.assignees.map((a, i) => (
                            <TooltipProvider key={i}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Avatar className="h-8 w-8 border-2 border-white dark:border-slate-900 cursor-pointer shadow-sm">
                                    <AvatarFallback className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white text-[10px] font-bold">{a.initials}</AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{a.name}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                        </div>
                      )}
                    </div>
                  )})}
                {events.length === 0 && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 italic p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    No events found in history.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white text-rose-600 flex items-center">
              Delete Event
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">"{eventToDelete?.title}"</span>? Please provide a reason for the team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const reason = formData.get('reason') as string;
            setEvents(events.filter(ev => ev.id !== eventToDelete?.id));
            pushNotification('Event Deleted', `"${eventToDelete?.title}" deleted. Reason: ${reason}`, 'alert');
            toast.error('Event Deleted', { description: `Reason: ${reason}. Employees notified.` });
            setEventToDelete(null);
          }}>
            <div className="space-y-2 py-4">
              <Label htmlFor="delete-reason" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-rose-600">Reason for Deletion (Required)</Label>
              <Textarea id="delete-reason" name="reason" required placeholder="e.g. Cancelled by client, duplicated event..." className="rounded-xl border-rose-200 dark:border-rose-500/30 focus-visible:ring-rose-500" />
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setEventToDelete(null)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">Confirm Delete</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!eventToEdit} onOpenChange={(open) => !open && setEventToEdit(null)}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-0 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] bg-white dark:bg-slate-950 rounded-3xl">
          <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 px-6 py-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <CalendarIcon className="w-32 h-32 transform rotate-12 translate-x-4 -translate-y-4 text-white" />
            </div>
            <DialogHeader className="relative z-10 text-left">
              <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                Edit Event Details
              </DialogTitle>
              <DialogDescription className="text-white/80 font-medium text-sm mt-3 leading-relaxed">
                Update event details. Please provide a reason for these changes to notify the team.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get('title') as string;
            const type = formData.get('type') as EventType;
            const reason = formData.get('reason') as string;

            if (!title || !editDate) return;

            setEvents(events.map(ev => {
              if (ev.id === eventToEdit?.id) {
                return { ...ev, title, time: editTime, type, date: new Date(editDate.getFullYear(), editDate.getMonth(), editDate.getDate()) };
              }
              return ev;
            }));

            pushNotification('Event Edited', `"${title}" updated. Reason: ${reason}`, 'warning');
            toast.success('Event Updated', { description: `Reason: ${reason}. Employees notified.` });
            setEventToEdit(null);
          }} className="p-6 space-y-6">
            <div className="space-y-2.5">
              <Label htmlFor="edit-title" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Title</Label>
              <Input id="edit-title" name="title" defaultValue={eventToEdit?.title} required className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 shadow-sm text-base font-semibold" />
            </div>
            
            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2.5 relative">
                <Label htmlFor="edit-date" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</Label>
                <ProjectDatePicker name="date" value={editDate} onChange={(d) => d && setEditDate(d)} className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 shadow-sm pl-4 font-semibold" />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="edit-time" className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</Label>
                <PremiumTimePicker name="time" value={editTime} onChange={setEditTime} />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event Type</Label>
              <div className="relative group">
                <Input name="type" list="event-types" defaultValue={eventToEdit?.type || 'milestone'} className="rounded-2xl h-12 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 shadow-sm pl-12 font-semibold" placeholder="e.g. Deadline, Client Sync..." />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 pointer-events-none group-hover:scale-110 transition-transform">
                  <Flag className="h-4 w-4 text-indigo-500" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2.5">
              <Label htmlFor="edit-reason" className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Reason for Edit (Required)</Label>
              <Textarea id="edit-reason" name="reason" required placeholder="e.g. Rescheduled due to client request..." className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-indigo-200 dark:border-indigo-500/30 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 shadow-sm min-h-[90px] pt-4 font-medium" />
            </div>

            <DialogFooter className="pt-2 sm:justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setEventToEdit(null)} className="rounded-xl font-bold h-12 px-6 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl h-12 px-8 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-black shadow-[0_8px_20px_-8px_rgba(99,102,241,0.6)] hover:shadow-[0_12px_25px_-8px_rgba(99,102,241,0.8)] transition-all duration-300 hover:-translate-y-0.5 border-0">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!eventToView} onOpenChange={(open) => !open && setEventToView(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden shadow-2xl">
          {eventToView && (
            <>
              <div className="p-8 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950">
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn("h-14 w-14 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg", getEventColor(eventToView.type))}>
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-90 leading-none">{format(eventToView.date, 'MMM')}</span>
                    <span className="text-xl font-black leading-none mt-1">{format(eventToView.date, 'dd')}</span>
                  </div>
                  <div>
                    <Badge variant="outline" className={cn("mb-2 border-0 uppercase tracking-widest text-[9px] font-black px-2.5 py-0.5", getEventBadgeStyles(eventToView.type))}>
                      {eventToView.type}
                    </Badge>
                    <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {eventToView.title}
                    </DialogTitle>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span>{format(eventToView.date, 'EEEE, MMMM do, yyyy')} {eventToView.time && `• ${eventToView.time}`}</span>
                </div>
              </div>

              <div className="p-8 space-y-8 bg-white dark:bg-slate-950">
                {eventToView.description && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Details & Links</label>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/60">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {eventToView.description}
                      </p>
                    </div>
                  </div>
                )}

                {eventToView.assignees && eventToView.assignees.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center justify-between">
                      <span>Participants ({eventToView.assignees.length})</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {eventToView.assignees.map((assignee, idx) => (
                        <div key={idx} className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full pl-1 pr-3 py-1 shadow-sm">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[9px] font-bold">
                              {assignee.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{assignee.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                {eventToView.type === 'meeting' && eventToView.description?.includes('Link:') && (
                  <Button 
                    onClick={() => {
                      const linkMatch = eventToView.description?.match(/Link:\s*(https?:\/\/[^\s]+)/);
                      if (linkMatch && linkMatch[1]) {
                        window.open(linkMatch[1], '_blank');
                      }
                    }}
                    className="rounded-xl px-6 font-bold bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-400 dark:border-indigo-500/30 dark:hover:bg-indigo-500/10 shadow-sm"
                  >
                    <Video className="w-4 h-4 mr-2" /> Join Meeting
                  </Button>
                )}
                <Button onClick={() => setEventToView(null)} className="rounded-xl px-8 font-bold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
    </>
  );
}
