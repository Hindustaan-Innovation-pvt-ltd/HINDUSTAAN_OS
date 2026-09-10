import React from 'react';
import { cn } from '@/lib/utils';

import brandLogoImg from '@/assets/Frame 134.png';

import { useTheme } from '@/context/ThemeContext';

export interface ProjectLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: 'large' | 'sidebar';
}

export function ProjectLogo({ size = 'large', className, ...props }: ProjectLogoProps) {
  let isLight = false;
  try {
    const themeContext = useTheme();
    isLight = themeContext.theme === 'light';
  } catch {
    isLight = typeof document !== 'undefined' && !document.documentElement.classList.contains('dark');
  }

  return (
    <div className={cn(
      "flex items-center justify-center transition-all duration-300",
      "bg-transparent border-none p-0 shadow-none w-full",
      className
    )}>
      <img
        src={brandLogoImg}
        alt="Hindustaan Innovation"
        className={cn(
          size === 'large' ? "h-16 w-auto" : "h-8 w-auto",
          "object-contain transition-all duration-300 light-mode-logo-shadow",
          className
        )}
        style={{
          filter: isLight 
            ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.40)) drop-shadow(0 6px 14px rgba(0, 0, 0, 0.22))' 
            : 'none'
        }}
        {...props}
      />
    </div>
  );
}
