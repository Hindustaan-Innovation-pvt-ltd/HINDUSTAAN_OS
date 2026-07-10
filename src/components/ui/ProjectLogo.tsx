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
      <img
        src="/project-os-logo.png"
        alt="Project OS"
        className={cn(
          size === 'large' ? "project-logo" : "sidebar-logo",
          "transition-all duration-300 transform scale-[1.3] dark:scale-[1.4] dark:invert-0 invert drop-shadow-[0_0_12px_rgba(125,145,255,0.35)]"
        )}
        {...props}
      />
    </div>
  );
}
