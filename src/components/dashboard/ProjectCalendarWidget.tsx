import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  MoreVertical, 
  Plus, 
  Video, 
  Clock, 
  Flag, 
  CheckCircle2 
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

// Data Structures
type EventType = 'deadline' | 'completed' | 'milestone' | 'leave';

interface ProjectEvent {
  id: string;
  date: Date;
  type: EventType;
  title: string;
  description?: string;
  time?: string;
  assignees?: { name: string; initials: string }[];
}

const START_DATE = new Date(2026, 6, 1); // July 1, 2026
const END_DATE = new Date(2026, 9, 1); // October 1, 2026

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
  const [scheduleType, setScheduleType] = useState<'event'|'meeting'>('event');
  const [events, setEvents] = useState<ProjectEvent[]>(MOCK_EVENTS);
  const [isAllEventsOpen, setIsAllEventsOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<ProjectEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<ProjectEvent | null>(null);

  const pushNotification = (title: string, message: string, type: string) => {
    try {
      const saved = localStorage.getItem('hindustaan_notifications');
      let notifications = [];
      if (saved) {
        notifications = JSON.parse(saved);
      }
      const newNotif = {
        id: Date.now(),
        type: type,
        category: 'Projects',
        icon: type === 'alert' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️',
        title: title,
        message: message,
        time: 'Just now',
        unread: true,
        group: 'Today'
      };
      notifications.unshift(newNotif);
      localStorage.setItem('hindustaan_notifications', JSON.stringify(notifications));
      window.dispatchEvent(new Event('hindustaan_notifications_updated'));
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamic calculations based on today
  const today = new Date();
  
  // Ensure we render the correct default month. If today is outside the project range, show the nearest valid month.
  const initialMonth = isBefore(today, START_DATE) ? START_DATE : isAfter(today, END_DATE) ? END_DATE : today;
  const [month, setMonth] = useState<Date>(initialMonth);

  const totalDays = differenceInDays(END_DATE, START_DATE);
  const daysCompleted = isBefore(today, START_DATE) ? 0 : isAfter(today, END_DATE) ? totalDays : differenceInDays(today, START_DATE);
  const daysRemaining = totalDays - daysCompleted;
  const progressPercent = Math.round((daysCompleted / totalDays) * 100);

  const workingDays = totalDays; // Simplification, could exclude weekends

  // Upcoming events
  const upcomingEvents = useMemo(() => {
    const limitDate = addDays(startOfDay(today), 4);
    return events
      .filter(e => (isAfter(e.date, startOfDay(today)) || isSameDay(e.date, startOfDay(today))) && isBefore(e.date, limitDate))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, today]);

  const handleDayClick = (day: Date) => {
    setSelectedDay(day);
    setIsSheetOpen(true);
  };

  const handleScheduleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    const type = (formData.get('type') || (scheduleType === 'event' ? 'milestone' : 'sync')) as EventType;

    if (!title || !dateStr) return;
    
    // Parse the local date string to avoid timezone shifts
    const [year, month, day] = dateStr.split('-').map(Number);
    const newEvent: ProjectEvent = {
      id: Math.random().toString(),
      date: new Date(year, month - 1, day),
      type: type,
      title: title,
      time: timeStr,
      assignees: [{ name: 'Current User', initials: 'CU' }]
    };

    setEvents(prev => [...prev, newEvent]);

    toast.success(`${scheduleType === 'event' ? 'Event' : 'Meeting'} Scheduled Successfully`, {
      description: 'Your calendar has been updated with the new item.',
    });
    setIsScheduleOpen(false);
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
    <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
      <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              <CalendarIcon className="mr-2 h-5 w-5 text-orange-500" />
              Project Timeline
            </CardTitle>
            <CardDescription className="text-xs font-semibold mt-1">July 1 - Oct 1, 2026</CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 font-bold text-[10px] hidden sm:flex">
              Deadline Tomorrow
            </Badge>
          </div>
        </div>

        {/* Dashboard Summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800/60">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Working Days</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{workingDays}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{daysCompleted}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remaining</span>
            <span className="text-xl font-black text-orange-600 dark:text-orange-400">{daysRemaining}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Progress value={progressPercent} className="h-2 flex-1 bg-slate-100 dark:bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-orange-500 [&>div]:to-orange-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{progressPercent}%</span>
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
            startMonth={START_DATE}
            endMonth={END_DATE}
            className="rounded-xl border-0 p-2 sm:p-4 bg-white dark:bg-slate-950/50 shadow-inner w-full flex justify-center"
            classNames={{
              day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer outline-none focus:ring-2 focus:ring-orange-500/50",
              today: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-500/30",
              selected: "bg-orange-500 text-white hover:bg-orange-600 hover:text-white focus:bg-orange-600 focus:text-white font-bold",
              weekday: "text-slate-500 dark:text-slate-400 rounded-md w-10 font-bold text-[0.75rem] uppercase",
              month: "w-full relative text-slate-900 dark:text-white",
              caption_label: "text-sm font-bold text-slate-900 dark:text-white",
              button_previous: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-900 dark:text-white absolute left-1 flex items-center justify-center",
              button_next: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-slate-900 dark:text-white absolute right-1 flex items-center justify-center",
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
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center"><Clock className="mr-2 h-4 w-4 text-orange-500" /> Upcoming Events</h4>
              <Button onClick={() => setIsAllEventsOpen(true)} variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-500/10 cursor-pointer">History</Button>
            </div>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? upcomingEvents.map((evt) => (
                <div key={evt.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-500/30 transition-all">
                  <div className="flex flex-col items-center justify-center h-11 w-11 rounded-lg bg-orange-50 dark:bg-orange-500/10 shrink-0">
                    <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase leading-none">{format(evt.date, 'MMM')}</span>
                    <span className="text-sm font-black text-orange-700 dark:text-orange-300 leading-none mt-1">{format(evt.date, 'dd')}</span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{evt.title}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={cn("h-1.5 w-1.5 rounded-full", getEventColor(evt.type))} />
                      <span className="text-[10px] font-semibold text-slate-500 capitalize">{evt.type}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-xs text-slate-500 italic p-4 text-center bg-white dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">No upcoming events.</div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <Button 
              onClick={() => { setScheduleType('event'); setIsScheduleOpen(true); }}
              variant="outline" 
              size="sm" 
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4 text-orange-500" /> New Event
            </Button>
            <Button 
              onClick={() => { setScheduleType('meeting'); setIsScheduleOpen(true); }}
              variant="outline" 
              size="sm" 
              className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold h-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm whitespace-nowrap"
            >
              <Video className="mr-2 h-4 w-4 text-orange-500" /> Meeting
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
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center">
              {scheduleType === 'event' ? <CalendarIcon className="mr-2 h-5 w-5 text-orange-500" /> : <Video className="mr-2 h-5 w-5 text-orange-500" />}
              Schedule {scheduleType === 'event' ? 'New Event' : 'Team Meeting'}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Add a new {scheduleType} to the project calendar. It will be visible to all assignees.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Title</Label>
              <Input id="title" name="title" placeholder={scheduleType === 'event' ? "e.g. Q3 Roadmap Review" : "e.g. Weekly Standup Sync"} required className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</Label>
                <Input id="date" name="date" type="date" required className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Time</Label>
                <Select name="time" defaultValue="09:00 AM">
                  <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 max-h-[200px]">
                    {Array.from({ length: 48 }).map((_, i) => {
                      const hour24 = Math.floor(i / 2);
                      const minute = i % 2 === 0 ? '00' : '30';
                      const ampm = hour24 >= 12 ? 'PM' : 'AM';
                      const hour12 = hour24 % 12 || 12;
                      const timeStr = `${hour12.toString().padStart(2, '0')}:${minute} ${ampm}`;
                      return (
                        <SelectItem key={timeStr} value={timeStr}>
                          {timeStr}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Type</Label>
              <Select name="type" defaultValue={scheduleType === 'event' ? 'milestone' : 'sync'}>
                <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                  {scheduleType === 'event' ? (
                    <>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="leave">Leave / OOO</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="sync">Sync</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="brainstorm">Brainstorming</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter className="pt-4 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsScheduleOpen(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold">
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
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg ml-auto sm:ml-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl">
                          <DropdownMenuItem onClick={() => setEventToEdit(evt)} className="font-semibold text-sm cursor-pointer">
                            Edit Event
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEventToDelete(evt)} className="font-semibold text-sm text-rose-600 focus:text-rose-600 cursor-pointer">
                            Delete Event
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <div className="py-4">
              <Label htmlFor="reason" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Reason for Deletion</Label>
              <Textarea id="reason" name="reason" required placeholder="e.g. Cancelled by client, duplicated event..." className="mt-2 rounded-xl" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEventToDelete(null)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" variant="destructive" className="rounded-xl font-bold">Confirm Delete</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!eventToEdit} onOpenChange={(open) => !open && setEventToEdit(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center">
              Edit Event
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Update event details. Please provide a reason for these changes to notify the team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const title = formData.get('title') as string;
            const dateStr = formData.get('date') as string;
            const timeStr = formData.get('time') as string;
            const type = formData.get('type') as EventType;
            const reason = formData.get('reason') as string;

            if (!title || !dateStr) return;
            const [year, month, day] = dateStr.split('-').map(Number);
            
            setEvents(events.map(ev => {
              if (ev.id === eventToEdit?.id) {
                return { ...ev, title, time: timeStr, type, date: new Date(year, month - 1, day) };
              }
              return ev;
            }));
            
            pushNotification('Event Edited', `"${title}" updated. Reason: ${reason}`, 'warning');
            toast.success('Event Updated', { description: `Reason: ${reason}. Employees notified.` });
            setEventToEdit(null);
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Title</Label>
                <Input id="edit-title" name="title" defaultValue={eventToEdit?.title} required className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</Label>
                  <Input id="edit-date" name="date" type="date" defaultValue={eventToEdit ? format(eventToEdit.date, 'yyyy-MM-dd') : ''} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Time</Label>
                  <Select name="time" defaultValue={eventToEdit?.time || "09:00 AM"}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl max-h-[200px]">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const hour24 = Math.floor(i / 2);
                        const minute = i % 2 === 0 ? '00' : '30';
                        const ampm = hour24 >= 12 ? 'PM' : 'AM';
                        const hour12 = hour24 % 12 || 12;
                        const timeStr = `${hour12.toString().padStart(2, '0')}:${minute} ${ampm}`;
                        return <SelectItem key={timeStr} value={timeStr}>{timeStr}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Type</Label>
                <Select name="type" defaultValue={eventToEdit?.type || 'milestone'}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="leave">Leave / OOO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reason" className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-orange-600">Reason for Edit (Required)</Label>
                <Textarea id="edit-reason" name="reason" required placeholder="e.g. Rescheduled due to client request..." className="rounded-xl border-orange-200 dark:border-orange-500/30 focus-visible:ring-orange-500" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEventToEdit(null)} className="rounded-xl font-bold">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
