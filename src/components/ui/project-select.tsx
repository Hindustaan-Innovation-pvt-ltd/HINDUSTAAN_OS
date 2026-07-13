import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface ProjectSelectOption {
  value: string;
  label: string;
}

export function ProjectSelect({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className,
  disabled = false
}: {
  value?: string;
  onChange: (value: string) => void;
  options: ProjectSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={`w-full h-11 rounded-xl border border-slate-200 dark:border-purple-500/30 bg-white dark:bg-slate-950 text-slate-900 dark:text-white ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border border-slate-200 dark:border-purple-500/20 shadow-2xl backdrop-blur-md bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800 cursor-pointer">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
