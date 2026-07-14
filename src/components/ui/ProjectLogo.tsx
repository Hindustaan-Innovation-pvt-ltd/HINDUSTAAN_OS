import React from 'react';
import { cn } from '@/lib/utils';

export interface ProjectLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: 'large' | 'sidebar';
}

export function ProjectLogo({ size = 'large', className, ...props }: ProjectLogoProps) {
  return (
    <div className={cn(
      "flex items-center justify-center transition-all duration-300",
      "bg-transparent border-none p-0 shadow-none w-full",
      className
    )}>
      {/* Light Mode Logo */}
      <img
        src="/project-os-logo.png"
        alt="Project OS"
        className={cn(
          size === 'large' ? "project-logo" : "sidebar-logo",
          "transition-all duration-300 transform scale-[1.3] dark:scale-[1.4] block dark:hidden drop-shadow-[0_0_12px_rgba(125,145,255,0.35)]"
        )}
        {...props}
      />
      {/* Dark Mode Logo */}
      <img
        src="/project-os-logo-dark.png"
        alt="Project OS"
        className={cn(
          size === 'large' ? "project-logo" : "sidebar-logo",
          "transition-all duration-300 transform scale-[1.3] dark:scale-[1.4] hidden dark:block drop-shadow-[0_0_12px_rgba(125,145,255,0.35)]"
        )}
        {...props}
      />
    </div>
  );
}
