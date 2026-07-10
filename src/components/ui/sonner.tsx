import React from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "@/context/ThemeContext"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        style: {
          background: theme === 'dark' ? 'rgba(18, 24, 47, 0.9)' : '#ffffff',
          color: theme === 'dark' ? '#ffffff' : '#0f172a',
          border: theme === 'dark' ? '1px solid rgba(91, 124, 255, 0.3)' : '1px solid #e2e8f0',
          backdropFilter: 'blur(12px)',
          borderRadius: '0.75rem',
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
