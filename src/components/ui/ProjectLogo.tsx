import React from 'react';
import { cn } from '@/lib/utils';

export interface ProjectLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: 'large' | 'sidebar';
}

export function ProjectLogo({ size = 'large', className, ...props }: ProjectLogoProps) {
  return (
    <div className={cn(
      "flex items-center justify-center transition-all duration-300",
      "dark:bg-transparent bg-slate-950 rounded-2xl shadow-lg dark:shadow-none",
      size === 'large' ? "px-4 py-2" : "px-2 py-1",
      className
    )}>
      <img
        src="/project-os-logo.png"
        alt="Project OS"
        className={cn(
          size === 'large' ? "project-logo" : "sidebar-logo",
          "transition-all duration-300 transform scale-[1.3] dark:scale-[1.4]"
        )}
        {...props}
      />
    </div>
  );
}
