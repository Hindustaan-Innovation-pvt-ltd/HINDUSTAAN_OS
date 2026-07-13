import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProjectTimeSelect({
  value,
  onChange,
  className,
  name
}: {
  value?: string;
  onChange: (time: string) => void;
  className?: string;
  name?: string;
}) {
  return (
    <>
      {name && value && (
        <input type="hidden" name={name} value={value} />
      )}
      <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`w-full h-11 rounded-xl border border-slate-200 dark:border-purple-500/30 bg-white dark:bg-slate-950 text-slate-900 dark:text-white ${className}`}>
        <SelectValue placeholder="Select time" />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border border-slate-200 dark:border-purple-500/20 shadow-2xl backdrop-blur-md bg-white dark:bg-slate-950 text-slate-900 dark:text-white max-h-[200px]">
        {Array.from({ length: 48 }).map((_, i) => {
          const hour24 = Math.floor(i / 2);
          const minute = i % 2 === 0 ? '00' : '30';
          const ampm = hour24 >= 12 ? 'PM' : 'AM';
          const hour12 = hour24 % 12 || 12;
          const timeStr = `${hour12.toString().padStart(2, '0')}:${minute} ${ampm}`;
          const valueStr = `${hour24.toString().padStart(2, '0')}:${minute}`;
          return (
            <SelectItem key={valueStr} value={valueStr} className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800 cursor-pointer">
              {timeStr}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
    </>
  )
}
