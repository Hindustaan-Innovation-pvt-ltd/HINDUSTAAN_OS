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
  const [month, setMonth] = React.useState<Date>(value || new Date())

  React.useEffect(() => {
    if (value) {
      setMonth(value)
    }
  }, [value])
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
      <PopoverContent side="bottom" sideOffset={4} className="w-auto p-0 rounded-2xl border border-slate-200 dark:border-purple-500/20 shadow-2xl backdrop-blur-md bg-white/90 dark:bg-slate-950/90" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          month={month}
          onMonthChange={setMonth}
          classNames={{
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 hover:scale-105 transition-all duration-200 relative cursor-pointer outline-none",
            today: "bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-900/10 text-orange-600 dark:text-orange-400 font-bold border border-orange-200/60 dark:border-orange-500/30 shadow-sm",
            selected: "bg-gradient-to-br from-orange-500 to-rose-500 text-white hover:from-orange-600 hover:to-rose-600 hover:text-white focus:from-orange-600 focus:to-rose-600 focus:text-white font-bold shadow-md shadow-orange-500/30 hover:scale-105 transition-all",
            weekday: "text-slate-400 dark:text-slate-500 rounded-md w-9 font-bold text-[0.75rem] uppercase tracking-wider",
            month_caption: "flex justify-center pt-1 relative items-center text-slate-900 dark:text-white",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
