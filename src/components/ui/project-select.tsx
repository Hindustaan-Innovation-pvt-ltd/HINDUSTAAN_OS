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
      <SelectTrigger className={`w-full h-11 rounded-xl border-purple-500/30 bg-slate-950 text-white ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border border-purple-500/20 shadow-2xl backdrop-blur-md bg-slate-950 text-white">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
