import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  let isEmployee = false;
  try {
    const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
    if (userStr) {
      const role = JSON.parse(userStr).role;
      if (role === 'employee' || role === 'intern') isEmployee = true;
    }
  } catch (e) {}

  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm transition-all duration-300",
        isEmployee
          ? "hover:bg-blue-50/80 hover:border-blue-200 hover:shadow-md dark:hover:bg-transparent dark:hover:border-purple-500/50 dark:hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
          : "hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.12)] dark:hover:border-purple-500/50 dark:hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold text-slate-900 dark:text-white", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
