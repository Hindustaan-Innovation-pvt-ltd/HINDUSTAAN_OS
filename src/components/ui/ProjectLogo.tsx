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
      {/* 
        Overflow-hidden wrapper crops the transparent padding from the neon logo.
        The image is scaled to 220% so the visible graphic fills the container.
      */}
      <div className={cn(
        "relative flex items-center justify-center overflow-hidden",
        size === 'large' ? "w-[260px] h-[90px]" : "w-[190px] h-[60px]"
      )}>
        <img
          src="/new-brand-logo.png"
          alt="Project OS"
          className="h-[220%] w-[220%] max-w-none object-contain transition-all duration-300 drop-shadow-[0_0_12px_rgba(0,200,255,0.35)]"
          {...props}
        />
      </div>
    </div>
  );
}
