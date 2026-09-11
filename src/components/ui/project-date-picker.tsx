import * as React from "react"
import { format, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, CalendarRange, Layers, X } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface LeaveDateSelection {
  mode: 'range' | 'multiple';
  startDate?: string;       // YYYY-MM-DD
  endDate?: string;         // YYYY-MM-DD
  dates: string[];          // List of individual YYYY-MM-DD dates
  totalDays: number;
  displayText: string;
}

function LeaveDayButton({
  className,
  day,
  modifiers,
  children,
  ...props
}: any) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers?.focused) ref.current?.focus()
  }, [modifiers?.focused])

  const isSelected = Boolean(modifiers?.selected)
  const isRangeStart = Boolean(modifiers?.range_start)
  const isRangeEnd = Boolean(modifiers?.range_end)
  const isRangeMiddle = Boolean(modifiers?.range_middle)
  const isToday = Boolean(modifiers?.today)
  const isDisabled = Boolean(modifiers?.disabled)
  const isOutside = Boolean(modifiers?.outside)

  // Single date or discrete multi-dates (e.g. 17, 19, 23)
  const isPill = (isSelected && !isRangeMiddle && !isRangeStart && !isRangeEnd) || (isRangeStart && isRangeEnd)

  return (
    <button
      ref={ref}
      type="button"
      tabIndex={modifiers?.focused ? 0 : -1}
      className={cn(
        "h-9 w-9 p-0 flex items-center justify-center text-xs font-semibold transition-all relative cursor-pointer outline-none select-none",
        isOutside && "opacity-25",
        isDisabled && "text-slate-600 opacity-25 cursor-not-allowed pointer-events-none",
        !isSelected && !isDisabled && "text-slate-700 dark:text-slate-200 hover:bg-purple-500/15 hover:text-purple-400 hover:scale-105 rounded-xl",
        isToday && !isSelected && "border border-purple-400/60 text-purple-400 font-bold shadow-xs rounded-xl",
        // Multi-select / Single selected date solid pill:
        isPill && "bg-purple-600 text-white font-bold rounded-xl shadow-md shadow-purple-600/40 hover:bg-purple-700 hover:text-white scale-105 z-10",
        // Range start pill:
        isRangeStart && !isRangeEnd && "bg-purple-600 text-white font-bold rounded-l-xl rounded-r-none shadow-md shadow-purple-600/30 hover:bg-purple-700 hover:text-white z-10",
        // Range end pill:
        isRangeEnd && !isRangeStart && "bg-purple-600 text-white font-bold rounded-r-xl rounded-l-none shadow-md shadow-purple-600/30 hover:bg-purple-700 hover:text-white z-10",
        // Range middle connected strip:
        isRangeMiddle && "bg-purple-500/25 dark:bg-purple-500/30 text-purple-700 dark:text-purple-200 rounded-none font-semibold hover:bg-purple-500/35"
      )}
      {...props}
    >
      <span>{children || day?.date?.getDate()}</span>
    </button>
  )
}

export function ProjectDatePicker({ 
  value, 
  onChange,
  onDateSelectionChange,
  placeholder = "Pick leave date(s)",
  className,
  name,
  disabled
}: { 
  value?: Date | DateRange | Date[]; 
  onChange?: (date?: Date | DateRange | Date[]) => void;
  onDateSelectionChange?: (selection: LeaveDateSelection) => void;
  placeholder?: string;
  className?: string;
  name?: string;
  disabled?: (date: Date) => boolean;
}) {
  const [open, setOpen] = React.useState(false)
  const [selectionMode, setSelectionMode] = React.useState<'range' | 'multiple'>('range')
  
  // Internal selection state
  const [range, setRange] = React.useState<DateRange | undefined>(() => {
    if (value && typeof value === 'object' && 'from' in value) {
      return value as DateRange
    }
    if (value instanceof Date) {
      return { from: value, to: value }
    }
    return undefined
  })

  const [multipleDates, setMultipleDates] = React.useState<Date[]>(() => {
    if (Array.isArray(value)) {
      return value
    }
    if (value instanceof Date) {
      return [value]
    }
    return []
  })

  const [month, setMonth] = React.useState<Date>(() => {
    if (range?.from) return range.from
    if (multipleDates.length > 0) return multipleDates[0]
    return new Date()
  })

  // Calculate total days and dates list based on active mode
  const { totalDays, datesList, startDateStr, endDateStr, displayText } = React.useMemo(() => {
    if (selectionMode === 'range') {
      if (!range?.from) {
        return { totalDays: 0, datesList: [], startDateStr: undefined, endDateStr: undefined, displayText: placeholder }
      }
      const fromStr = format(range.from, 'yyyy-MM-dd')
      if (!range.to || isSameDay(range.from, range.to)) {
        return {
          totalDays: 1,
          datesList: [fromStr],
          startDateStr: fromStr,
          endDateStr: fromStr,
          displayText: `${format(range.from, 'MMMM do, yyyy')} (1 day)`
        }
      }
      const toStr = format(range.to, 'yyyy-MM-dd')
      const diffMs = Math.abs(range.to.getTime() - range.from.getTime())
      const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1

      // Generate all dates in between
      const allDates: string[] = []
      const curr = new Date(range.from)
      while (curr <= range.to) {
        allDates.push(format(curr, 'yyyy-MM-dd'))
        curr.setDate(curr.getDate() + 1)
      }

      return {
        totalDays: days,
        datesList: allDates,
        startDateStr: fromStr,
        endDateStr: toStr,
        displayText: `${format(range.from, 'MMM d, yyyy')} – ${format(range.to, 'MMM d, yyyy')} (${days} days)`
      }
    } else {
      // Multiple mode
      if (!multipleDates || multipleDates.length === 0) {
        return { totalDays: 0, datesList: [], startDateStr: undefined, endDateStr: undefined, displayText: placeholder }
      }
      const sorted = [...multipleDates].sort((a, b) => a.getTime() - b.getTime())
      const allDates = sorted.map(d => format(d, 'yyyy-MM-dd'))
      const days = sorted.length

      let label = ''
      if (days === 1) {
        label = `${format(sorted[0], 'MMMM do, yyyy')} (1 day)`
      } else if (days <= 3) {
        label = sorted.map(d => format(d, 'MMM d')).join(', ') + ` (${days} days)`
      } else {
        label = `${format(sorted[0], 'MMM d')}, ${format(sorted[1], 'MMM d')} +${days - 2} more (${days} days)`
      }

      return {
        totalDays: days,
        datesList: allDates,
        startDateStr: allDates[0],
        endDateStr: allDates[allDates.length - 1],
        displayText: label
      }
    }
  }, [selectionMode, range, multipleDates, placeholder])

  // Propagate changes upwards whenever selection updates
  React.useEffect(() => {
    if (onDateSelectionChange) {
      onDateSelectionChange({
        mode: selectionMode,
        startDate: startDateStr,
        endDate: endDateStr,
        dates: datesList,
        totalDays,
        displayText
      })
    }
    if (onChange) {
      if (selectionMode === 'range') {
        onChange(range)
      } else {
        onChange(multipleDates)
      }
    }
  }, [selectionMode, startDateStr, endDateStr, datesList, totalDays, displayText])

  const handleRangeSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange)
    if (selectedRange?.from) {
      setMonth(selectedRange.from)
    }
  }

  const handleMultipleSelect = (dates: Date[] | undefined) => {
    const list = dates || []
    setMultipleDates(list)
    if (list.length > 0) {
      setMonth(list[list.length - 1])
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRange(undefined)
    setMultipleDates([])
  }

  const hasSelection = totalDays > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {name && startDateStr && (
        <input type="hidden" name={name} value={startDateStr} />
      )}
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full h-12 rounded-xl border-slate-200 dark:border-purple-500/30 bg-white dark:bg-slate-950 text-slate-900 dark:text-white justify-between text-left font-normal hover:bg-slate-50 dark:hover:bg-slate-900/80 hover:text-slate-900 dark:hover:text-white shadow-xs group",
            !hasSelection && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2.5 truncate min-w-0">
            <CalendarIcon className="h-4 w-4 text-purple-500 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate font-semibold text-sm">{displayText}</span>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {totalDays > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {totalDays} {totalDays === 1 ? 'day' : 'days'}
              </span>
            )}
            {hasSelection && (
              <div 
                role="button" 
                onClick={handleClear}
                className="p-1 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        side="bottom" 
        sideOffset={6} 
        className="w-auto p-0 rounded-2xl border border-slate-200 dark:border-purple-500/30 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-950/95 overflow-hidden" 
        align="start"
      >
        {/* Top Header: Mode Switcher Tabs */}
        <div className="flex items-center justify-between p-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 gap-2">
          <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/90 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectionMode('range')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                selectionMode === 'range'
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              <span>Date Range</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode('multiple')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                selectionMode === 'multiple'
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Specific Dates</span>
            </button>
          </div>

          {hasSelection && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Calendar Body */}
        <div className="p-1">
          {selectionMode === 'range' ? (
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              disabled={disabled}
              month={month}
              onMonthChange={setMonth}
              components={{ DayButton: LeaveDayButton }}
              classNames={{
                day: "h-9 w-9 p-0 font-medium text-center relative select-none",
                weekday: "text-slate-400 dark:text-slate-500 rounded-md w-9 font-bold text-[0.75rem] uppercase tracking-wider text-center",
                month_caption: "flex justify-center pt-1 relative items-center text-slate-900 dark:text-white font-bold text-sm",
              }}
            />
          ) : (
            <Calendar
              mode="multiple"
              selected={multipleDates}
              onSelect={handleMultipleSelect}
              disabled={disabled}
              month={month}
              onMonthChange={setMonth}
              components={{ DayButton: LeaveDayButton }}
              classNames={{
                day: "h-9 w-9 p-0 font-medium text-center relative select-none",
                weekday: "text-slate-400 dark:text-slate-500 rounded-md w-9 font-bold text-[0.75rem] uppercase tracking-wider text-center",
                month_caption: "flex justify-center pt-1 relative items-center text-slate-900 dark:text-white font-bold text-sm",
              }}
            />
          )}
        </div>

        {/* Bottom Helper Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {selectionMode === 'range' ? 'Select start & end date' : 'Click specific dates (e.g. 17, 19, 23)'}
          </span>
          {totalDays > 0 ? (
            <span className="font-bold text-purple-600 dark:text-purple-400">
              {totalDays} {totalDays === 1 ? 'day' : 'days'} selected
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">No dates picked</span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
