import React from 'react';
import { cn } from '@/lib/utils';

export interface ProjectLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: 'large' | 'sidebar';
}

export function ProjectLogo({ size = 'large', className, ...props }: ProjectLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Project OS"
      className={cn(
        size === 'large' ? "project-logo" : "sidebar-logo",
        "transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}
