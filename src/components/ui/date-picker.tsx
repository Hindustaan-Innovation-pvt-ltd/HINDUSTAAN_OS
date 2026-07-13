"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  /** Currently selected date */
  value?: Date | undefined
  /** Callback when a date is selected */
  onChange?: (date: Date | undefined) => void
  /** Placeholder text when no date is selected */
  placeholder?: string
  /** Disabled state */
  disabled?: boolean
  /** Minimum selectable date */
  minDate?: Date
  /** Maximum selectable date */
  maxDate?: Date
  /** Custom className for the trigger button */
  className?: string
  /** Date format string (date-fns format) */
  dateFormat?: string
  /** Whether the field is required */
  required?: boolean
  /** Name attribute for form compatibility */
  name?: string
  /** id attribute */
  id?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  minDate,
  maxDate,
  className,
  dateFormat = "PPP",
  required,
  name,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date)
    // Auto-close after selection
    if (date) {
      setOpen(false)
    }
  }

  return (
    <>
      {/* Hidden input for form compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ? format(value, "yyyy-MM-dd") : ""}
          required={required}
        />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-11 w-full justify-start rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-left font-medium shadow-sm transition-colors",
              "hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/20 dark:hover:border-purple-700",
              "focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:border-purple-400",
              !value && "text-muted-foreground",
              className
            )}
          >
            <CalendarDays className="mr-2 h-4 w-4 shrink-0 text-purple-500 dark:text-purple-400" />
            {value ? (
              <span className="truncate text-slate-900 dark:text-slate-100">
                {format(value, dateFormat)}
              </span>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 rounded-xl border-slate-200 dark:border-slate-800 shadow-xl"
          align="start"
          sideOffset={4}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            className="rounded-xl"
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
