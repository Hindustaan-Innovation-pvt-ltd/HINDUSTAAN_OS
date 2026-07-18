import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch inline-flex shrink-0 cursor-pointer items-center rounded-full border border-transparent shadow-sm transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 data-[state=unchecked]:bg-slate-200 data-[state=unchecked]:border-slate-300 dark:data-[state=checked]:bg-indigo-500 dark:data-[state=checked]:border-indigo-500 dark:data-[state=unchecked]:bg-slate-800 dark:data-[state=unchecked]:border-slate-700/80 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        size === "default" ? "h-5 w-9 px-[2px]" : "h-3.5 w-6 px-[1px]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-white dark:bg-slate-100 shadow-md ring-0 transition-transform",
          size === "default" 
            ? "h-4 w-4 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" 
            : "h-2.5 w-2.5 data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

