import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PremiumTimePickerProps {
  value: string; // Expected format: "09:00 AM"
  onChange: (time: string) => void;
  className?: string;
  name?: string;
}

export function PremiumTimePicker({ value, onChange, className, name }: PremiumTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');

  // Parse incoming value
  useEffect(() => {
    if (value) {
      const parts = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (parts) {
        setHour(parts[1].padStart(2, '0'));
        setMinute(parts[2].padStart(2, '0'));
        setPeriod(parts[3].toUpperCase() as 'AM' | 'PM');
      }
    }
  }, [value, isOpen]);

  const handleApply = () => {
    onChange(`${hour}:${minute} ${period}`);
    setIsOpen(false);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  // Create an array of minutes from 00 to 59
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <>
    {name && <input type="hidden" name={name} value={value} />}
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button 
          type="button"
          className={cn(
            "relative w-full rounded-2xl h-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus-visible:ring-orange-500/30 focus-visible:border-orange-500 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-white transition-all duration-300 shadow-sm pl-12 pr-4 font-semibold text-left text-base group",
            className
          )}
        >
          <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 pointer-events-none group-hover:scale-110 transition-transform z-10">
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          {hour}:{minute} {period}
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" sideOffset={4} className="w-auto p-3 rounded-3xl border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950" align="start">
        <div className="flex gap-2">
          {/* Hours Column */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400   mb-2">Hour</span>
            <ScrollArea className="h-[160px] w-[60px] rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="p-1 flex flex-col gap-1">
                {hours.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHour(h)}
                    className={cn(
                      "w-full py-2 rounded-lg text-sm font-bold transition-all",
                      hour === h 
                        ? "bg-orange-500 text-white shadow-md" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Minutes Column */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400   mb-2">Minute</span>
            <ScrollArea className="h-[160px] w-[60px] rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="p-1 flex flex-col gap-1">
                {minutes.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMinute(m)}
                    className={cn(
                      "w-full py-2 rounded-lg text-sm font-bold transition-all",
                      minute === m 
                        ? "bg-orange-500 text-white shadow-md" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* AM/PM Column */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400   mb-2">AM/PM</span>
            <div className="flex flex-col gap-2 p-1 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 h-full w-[60px] justify-center">
              <button
                onClick={() => setPeriod('AM')}
                className={cn(
                  "w-full py-3 rounded-lg text-sm font-bold transition-all",
                  period === 'AM' 
                    ? "bg-orange-500 text-white shadow-md" 
                    : "text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                )}
              >
                AM
              </button>
              <button
                onClick={() => setPeriod('PM')}
                className={cn(
                  "w-full py-3 rounded-lg text-sm font-bold transition-all",
                  period === 'PM' 
                    ? "bg-orange-500 text-white shadow-md" 
                    : "text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                )}
              >
                PM
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button 
            onClick={handleApply}
            className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 shadow-[0_4px_10px_-2px_rgba(249,115,22,0.5)] transition-all hover:-translate-y-0.5"
          >
            Apply Time
          </Button>
        </div>
      </PopoverContent>
    </Popover>
    </>
  );
}
