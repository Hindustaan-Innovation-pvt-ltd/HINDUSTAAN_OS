import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function ProjectDatePicker({ 
  value, 
  onChange, 
  placeholder = "Pick a date",
  className,
  name
}: { 
  value?: Date; 
  onChange: (date?: Date) => void; 
  placeholder?: string;
  className?: string;
  name?: string;
}) {
  return (
    <Popover>
      {name && value && (
        <input type="hidden" name={name} value={format(value, 'yyyy-MM-dd')} />
      )}
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full h-11 rounded-xl border-slate-200 dark:border-purple-500/30 bg-white dark:bg-slate-950 text-slate-900 dark:text-white justify-start text-left font-normal hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-2xl border border-slate-200 dark:border-purple-500/20 shadow-2xl backdrop-blur-md bg-white/90 dark:bg-slate-950/90" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          classNames={{
            selected: "bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:bg-gradient-to-r hover:from-violet-500 hover:to-blue-500 hover:text-white focus:bg-gradient-to-r focus:from-violet-500 focus:to-blue-500 focus:text-white",
            today: "ring-2 ring-violet-400 bg-transparent text-slate-900 dark:text-white",
            day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg transition-colors",

          }}
        />
      </PopoverContent>
    </Popover>
  )
}
